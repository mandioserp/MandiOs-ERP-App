import { Payment, Supplier, Customer, Ledger, AuditLog } from '../models/index.js';
import { assertTenantOwnership, buildTenantQuery, getTenantId } from '../utils/tenant.js';

export async function getPayments(req, res) {
  try {
    const payments = await Payment.find(buildTenantQuery(req));
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments.' });
  }
}

export async function addPayment(req, res) {
  try {
    const { partyId, partyType, amount, date, description, paymentMethod } = req.body;
    const tenantId = getTenantId(req) || 'tenant_default_001';

    if (!partyId || !partyType || !amount || !date) {
      return res.status(400).json({ error: 'Please provide party, party type, amount, and date.' });
    }

    const payAmount = Number(amount);
    let partyName = '';
    let newBalance = 0;
    const selectedMethod = paymentMethod || 'Cash';

    if (partyType === 'Supplier') {
      const supplier = await Supplier.findById(partyId);
      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found.' });
      }
      if (!assertTenantOwnership(req, supplier)) return res.status(404).json({ error: 'Supplier not found.' });
      partyName = supplier.name;

      // When we pay a supplier, our debt reduces. Supplier's balance increases (goes up/gets less negative).
      newBalance = supplier.currentBalance + payAmount;
      await Supplier.findByIdAndUpdate(partyId, {
        totalPaid: supplier.totalPaid + payAmount,
        currentBalance: newBalance,
        remainingBalance: newBalance,
      });

      // Credit means stock supplied, Debit means we paid them (reduces payable)
      await Ledger.create({
        tenantId,
        partyId,
        partyType: 'Supplier',
        date,
        type: 'Debit',
        amount: payAmount,
        balanceAfter: newBalance,
        description: description ? `[${selectedMethod}] ${description}` : `Payment paid to supplier via ${selectedMethod}`,
      });

      await Payment.create({
        tenantId,
        partyId,
        partyName,
        partyType,
        date,
        amount: payAmount,
        type: 'Paid',
        paymentMethod: selectedMethod,
        description: description || `Payment paid via ${selectedMethod}`,
      });

    } else if (partyType === 'Customer') {
      const customer = await Customer.findById(partyId);
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found.' });
      }
      if (!assertTenantOwnership(req, customer)) return res.status(404).json({ error: 'Customer not found.' });
      partyName = customer.name;

      // When they pay us, their debt reduces. Balance goes down (gets closer to zero or negative).
      newBalance = customer.currentBalance - payAmount;
      await Customer.findByIdAndUpdate(partyId, {
        totalPaid: customer.totalPaid + payAmount,
        currentBalance: newBalance,
        remainingBalance: newBalance,
      });

      // Debit means purchase, Credit means payment received (reduces receivable)
      await Ledger.create({
        tenantId,
        partyId,
        partyType: 'Customer',
        date,
        type: 'Credit',
        amount: payAmount,
        balanceAfter: newBalance,
        description: description ? `[${selectedMethod}] ${description}` : `Payment received from customer via ${selectedMethod}`,
      });

      await Payment.create({
        tenantId,
        partyId,
        partyName,
        partyType,
        date,
        amount: payAmount,
        type: 'Received',
        paymentMethod: selectedMethod,
        description: description || `Payment received via ${selectedMethod}`,
      });
    } else {
      return res.status(400).json({ error: 'Invalid party type. Must be Supplier or Customer.' });
    }

    await AuditLog.create({
      tenantId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: `PAYMENT_${partyType.toUpperCase()}`,
      details: `Recorded payment (${selectedMethod}) of Rs. ${payAmount} for ${partyType} ${partyName}.`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({ message: 'Payment recorded and ledger updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record payment.' });
  }
}

export async function deletePayment(req, res) {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found.' });
    }
    if (!assertTenantOwnership(req, payment)) return res.status(404).json({ error: 'Payment not found.' });

    const tenantId = getTenantId(req) || payment.tenantId || 'tenant_default_001';
    const { partyId, partyType, amount, partyName } = payment;

    if (partyType === 'Supplier') {
      const supplier = await Supplier.findById(partyId);
      if (supplier) {
        if (!assertTenantOwnership(req, supplier)) return res.status(404).json({ error: 'Payment not found.' });
        // Reverse payment: we paid them, so now our debt goes back up (gets more negative)
        const reversedBalance = supplier.currentBalance - amount;
        await Supplier.findByIdAndUpdate(partyId, {
          totalPaid: Math.max(0, supplier.totalPaid - amount),
          currentBalance: reversedBalance,
          remainingBalance: reversedBalance,
        });

        await Ledger.create({
          tenantId,
          partyId,
          partyType: 'Supplier',
          date: new Date().toISOString().split('T')[0],
          type: 'Credit',
          amount,
          balanceAfter: reversedBalance,
          description: `DELETED PAYMENT REVERSAL: Cancelled payment of Rs. ${amount}`,
        });
      }
    } else if (partyType === 'Customer') {
      const customer = await Customer.findById(partyId);
      if (customer) {
        if (!assertTenantOwnership(req, customer)) return res.status(404).json({ error: 'Payment not found.' });
        // Reverse payment: they paid us, so now their debt goes back up (gets more positive)
        const reversedBalance = customer.currentBalance + amount;
        await Customer.findByIdAndUpdate(partyId, {
          totalPaid: Math.max(0, customer.totalPaid - amount),
          currentBalance: reversedBalance,
          remainingBalance: reversedBalance,
        });

        await Ledger.create({
          tenantId,
          partyId,
          partyType: 'Customer',
          date: new Date().toISOString().split('T')[0],
          type: 'Debit',
          amount,
          balanceAfter: reversedBalance,
          description: `DELETED PAYMENT REVERSAL: Cancelled payment of Rs. ${amount}`,
        });
      }
    }

    await Payment.findByIdAndDelete(id);

    await AuditLog.create({
      tenantId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DELETE_PAYMENT',
      details: `Deleted payment record of Rs. ${amount} for ${partyType} ${partyName}.`,
      timestamp: new Date().toISOString(),
    });

    res.json({ message: 'Payment record deleted and balances adjusted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete payment.' });
  }
}
