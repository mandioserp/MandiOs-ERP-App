import { Sale, Product, Customer, Supplier, Ledger, AuditLog, StockEntry } from '../models/index.js';
import { calculateCommission, getCommissionCalculationDetails } from '../utils/commissionService.js';
import { assertTenantOwnership, buildTenantQuery, getTenantId } from '../utils/tenant.js';

export async function getSales(req, res) {
  try {
    const sales = await Sale.find(buildTenantQuery(req));
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales history.' });
  }
}

export async function addSale(req, res) {
  try {
    const { stockEntryId, saleRate, date, buyers, customCommission, customCommissionType } = req.body;
    const tenantId = getTenantId(req) || 'tenant_default_001';

    // Validate parameters
    if (!stockEntryId || !saleRate || !date || !buyers || !Array.isArray(buyers) || buyers.length === 0) {
      return res.status(400).json({
        error: 'Please provide stockEntryId, saleRate, date, and a list of buyers with quantities.'
      });
    }

    const rate = Number(saleRate);
    if (isNaN(rate) || rate <= 0) {
      return res.status(400).json({ error: 'Please set a valid sale rate.' });
    }

    // Fetch the Stock Entry (Consignment)
    const stockEntry = await StockEntry.findById(stockEntryId);
    if (!stockEntry) {
      return res.status(404).json({ error: 'Supplier consignment/arrival not found.' });
    }
    if (!assertTenantOwnership(req, stockEntry)) return res.status(404).json({ error: 'Supplier consignment/arrival not found.' });

    const product = await Product.findById(stockEntry.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    if (!assertTenantOwnership(req, product)) return res.status(404).json({ error: 'Product not found.' });

    const supplier = await Supplier.findById(stockEntry.supplierId);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier of this consignment not found.' });
    }
    if (!assertTenantOwnership(req, supplier)) return res.status(404).json({ error: 'Supplier of this consignment not found.' });

    // Calculate total quantity requested in this sale batch
    let totalQtyRequested = 0;
    for (const buyer of buyers) {
      const q = Number(buyer.quantity);
      if (isNaN(q) || q <= 0) {
        return res.status(400).json({ error: 'Quantity for each buyer must be a positive number.' });
      }
      totalQtyRequested += q;
    }

    // Check if consignment has enough remaining quantity
    const currentRemaining = stockEntry.remainingQuantity !== undefined ? stockEntry.remainingQuantity : stockEntry.quantity;
    if (currentRemaining < totalQtyRequested) {
      return res.status(400).json({
        error: `Insufficient consignment stock! Only ${currentRemaining} ${product.unit} remaining in this consignment. Requested: ${totalQtyRequested}`
      });
    }

    // Check if product inventory has enough physical quantity
    if (product.currentQuantity < totalQtyRequested) {
      return res.status(400).json({
        error: `Insufficient physical stock in inventory! Only ${product.currentQuantity} ${product.unit} of ${product.name} left. Requested: ${totalQtyRequested}`
      });
    }

    const createdSales = [];
    let totalGrossBatchAmount = 0;
    let totalSupplierCreditAmount = 0;
    let totalBatchCommission = 0;

    // Process each buyer
    for (const buyer of buyers) {
      const qty = Number(buyer.quantity);
      const discount = Number(buyer.discount) || 0;
      const grossSaleVal = qty * rate;
      
      const commDetails = await getCommissionCalculationDetails({
        productId: product.id || product._id,
        supplierId: stockEntry.supplierId,
        customerId: buyer.customerId,
        quantity: qty,
        unit: product.unit,
        weight: product.averageWeight,
        saleRate: rate,
        customCommission,
        customCommissionType
      });
      const totalCommission = commDetails.commissionAmount;

      // Customer's total purchase value includes commission (recovered from buyer rather than deducted from supplier)
      const saleAmount = grossSaleVal + totalCommission - discount;
      const netSaleVal = saleAmount;
      // Supplier credit is gross sale value without batch commission deduction
      const supplierCreditAmount = grossSaleVal;

      totalGrossBatchAmount += grossSaleVal;
      totalSupplierCreditAmount += supplierCreditAmount;
      totalBatchCommission += totalCommission;

      let saleData = {
        tenantId,
        productId: product.id || product._id,
        productName: product.name,
        stockEntryId: stockEntry.id || stockEntry._id,
        quantity: qty,
        saleRate: rate,
        discount,
        totalAmount: saleAmount,
        date,
        isWalkIn: !!buyer.isWalkIn,
        commissionAmount: totalCommission,
        commissionType: commDetails.commissionType,
        commissionRate: commDetails.formattedRate,
        commissionRateValue: commDetails.commissionRateValue,
        commissionBasis: commDetails.commissionBasis,
        grossSale: grossSaleVal,
        netSale: netSaleVal,
      };

      if (buyer.isWalkIn) {
        saleData.customerName = buyer.walkInName || 'Walk-In Customer';
        saleData.walkInName = buyer.walkInName || 'Walk-In Customer';
        saleData.walkInMobile = buyer.walkInMobile || '';
        saleData.walkInVehicle = buyer.walkInVehicle || '';
        saleData.remarks = buyer.remarks || '';
      } else {
        const customer = await Customer.findById(buyer.customerId);
        if (!customer) {
          return res.status(404).json({ error: `Customer not found for ID: ${buyer.customerId}` });
        }
        if (!assertTenantOwnership(req, customer)) return res.status(404).json({ error: 'Customer not found.' });
        saleData.customerId = customer.id || customer._id;
        saleData.customerName = customer.name;

        // Update Customer Accounts (they owe us)
        const newCustBalance = customer.currentBalance + saleAmount;
        await Customer.findByIdAndUpdate(customer.id || customer._id, {
          totalPurchases: customer.totalPurchases + saleAmount,
          currentBalance: newCustBalance,
          remainingBalance: newCustBalance,
        });

        // Create Customer Ledger entry
        await Ledger.create({
          tenantId,
          partyId: customer.id || customer._id,
          partyType: 'Customer',
          date,
          type: 'Debit',
          amount: saleAmount,
          balanceAfter: newCustBalance,
          description: `Purchased ${qty} ${product.unit} of ${product.name} @ Rs. ${rate}. Buyer Commission: Rs. ${totalCommission}, Discount: Rs. ${discount} (Arrival Ref: ${stockEntry.id || stockEntry._id})`,
        });
      }

      // Create Sale Record
      const sale = await Sale.create(saleData);
      createdSales.push(sale);

      // Decrease Product Inventory
      await Product.findByIdAndUpdate(product.id || product._id, {
        currentQuantity: Math.max(0, product.currentQuantity - qty),
        saleRate: rate, // update last sale rate
      });
    }

    const totalBatchAmount = totalSupplierCreditAmount;

    // --- APPLY RATE & RECORD TO CONSIGNMENT LOT ---
    // Update Stock Entry remaining quantity, total gross realized amount, and weighted average purchase rate
    const updatedRemaining = currentRemaining - totalQtyRequested;
    const updatedTotalAmount = (stockEntry.totalAmount || 0) + totalBatchAmount;
    const updatedPurchaseRate = stockEntry.quantity > 0 ? Math.round((updatedTotalAmount / stockEntry.quantity) * 100) / 100 : rate;

    await StockEntry.findByIdAndUpdate(stockEntry.id || stockEntry._id, {
      remainingQuantity: updatedRemaining,
      totalAmount: updatedTotalAmount,
      purchaseRate: updatedPurchaseRate,
    });

    // NOTE: Under Mandi Consignment Settlement architecture (Option B), daily batch sales decrement
    // consignment stock and record customer receivables. The Supplier Ledger is NOT credited on individual sales;
    // it is credited once with the net payable (gross sales minus commission, freight, labor/hamali & expenses)
    // when the lot inspection is finalized and "Submit to Payables" (Bikri Parchi) is recorded.

    // Audit Log
    await AuditLog.create({
      tenantId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'ADD_BATCH_SALE',
      details: `Sold ${totalQtyRequested} ${product.unit} of ${product.name} from consignment lot #${stockEntry.lotNumber || String(stockEntry.id || stockEntry._id).substring(0,8).toUpperCase()} (Supplier: ${supplier.name}) at rate Rs. ${rate} to ${buyers.length} buyers. Total Realization: Rs. ${totalBatchAmount}. Consignment remaining: ${updatedRemaining} ${product.unit}.`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      sales: createdSales,
      remainingConsignmentQuantity: updatedRemaining,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record batch sale.' });
  }
}

export async function updateSale(req, res) {
  // To keep simplicity and high consistency, we advise users to delete and recreate the batch sale if there are major mistakes.
  // We will provide a clean response.
  res.status(400).json({
    error: 'Direct editing of consignment sales is disabled to preserve ledger consistency. Please delete the sale and record a new one.'
  });
}

export async function deleteSale(req, res) {
  try {
    const { id } = req.params;
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ error: 'Sale record not found.' });
    }
    if (!assertTenantOwnership(req, sale)) return res.status(404).json({ error: 'Sale record not found.' });

    const tenantId = getTenantId(req) || sale.tenantId || 'tenant_default_001';
    const { productId, customerId, quantity, totalAmount, productName, customerName, stockEntryId, saleRate } = sale;

    // 1. Revert product inventory (increase stock back)
    const product = await Product.findById(productId);
    if (product && !assertTenantOwnership(req, product)) return res.status(404).json({ error: 'Sale record not found.' });
    if (product) {
      await Product.findByIdAndUpdate(productId, {
        currentQuantity: product.currentQuantity + quantity,
      });
    }

    // 2. Revert customer balance
    const customer = await Customer.findById(customerId);
    if (customer && !assertTenantOwnership(req, customer)) return res.status(404).json({ error: 'Sale record not found.' });
    if (customer) {
      const revertedCustBalance = customer.currentBalance - totalAmount;
      await Customer.findByIdAndUpdate(customerId, {
        totalPurchases: Math.max(0, customer.totalPurchases - totalAmount),
        currentBalance: revertedCustBalance,
        remainingBalance: revertedCustBalance,
      });

      // Add Credit reversal entry in customer ledger
      await Ledger.create({
        tenantId,
        partyId: customerId,
        partyType: 'Customer',
        date: new Date().toISOString().split('T')[0],
        type: 'Credit',
        amount: totalAmount,
        balanceAfter: revertedCustBalance,
        description: `DELETED SALE REVERSAL: Cancelled purchase of ${quantity} units of ${productName}`,
      });
    }

    // 3. Revert Stock Entry (Consignment)
    if (stockEntryId) {
      const stockEntry = await StockEntry.findById(stockEntryId);
      if (stockEntry) {
        if (!assertTenantOwnership(req, stockEntry)) return res.status(404).json({ error: 'Sale record not found.' });
        const revertQty = quantity;
        const revertAmt = quantity * saleRate;

        const newRemaining = (stockEntry.remainingQuantity || 0) + revertQty;
        const newTotalAmount = Math.max(0, (stockEntry.totalAmount || 0) - revertAmt);
        const newPurchaseRate = stockEntry.quantity > 0 ? Math.round((newTotalAmount / stockEntry.quantity) * 100) / 100 : 0;

        await StockEntry.findByIdAndUpdate(stockEntryId, {
          remainingQuantity: newRemaining,
          totalAmount: newTotalAmount,
          purchaseRate: newPurchaseRate,
        });

        // If the lot was already settled into payables previously, adjust the supplier balance and post reversal
        if (stockEntry.isSettled && stockEntry.supplierId) {
          const supplier = await Supplier.findById(stockEntry.supplierId);
          if (supplier) {
            if (!assertTenantOwnership(req, supplier)) return res.status(404).json({ error: 'Sale record not found.' });
            const revertedSuppBalance = (supplier.currentBalance || 0) + revertAmt;
            const revertedTotalSupplied = Math.max(0, (supplier.totalSupplied || 0) - revertAmt);
            await Supplier.findByIdAndUpdate(stockEntry.supplierId, {
              currentBalance: revertedSuppBalance,
              remainingBalance: revertedSuppBalance,
              totalSupplied: revertedTotalSupplied,
            });

            await Ledger.create({
              tenantId,
              partyId: stockEntry.supplierId,
              partyType: 'Supplier',
              date: new Date().toISOString().split('T')[0],
              type: 'Debit',
              amount: revertAmt,
              balanceAfter: revertedSuppBalance,
              description: `DELETED SALE REVERSAL: Cancelled batch sale of ${quantity} ${productName || 'units'} @ Rs. ${saleRate} from settled lot #${stockEntry.lotNumber || ''} (Buyer: ${customerName || 'Customer'})`,
            });
          }
        }
      }
    }

    await Sale.findByIdAndDelete(id);

    await AuditLog.create({
      tenantId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DELETE_SALE',
      details: `Deleted Sale Entry ${id}. Reverted ${quantity} units of ${productName} from customer ${customerName}.`,
      timestamp: new Date().toISOString(),
    });

    res.json({ message: 'Sale record deleted and inventory/balances adjusted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete sale.' });
  }
}
