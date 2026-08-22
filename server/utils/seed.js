import bcryptjs from 'bcryptjs';
import { Business, GlobalSettings, User, Product, Supplier, Customer, StockEntry, Sale, Ledger, Payment, AuditLog, Expense, Truck, Employee, Salary, SalaryAdvance } from '../models/index.js';

export async function seedDatabase() {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_SEED !== 'true') {
    return;
  }

  try {
    const salt = bcryptjs.genSaltSync(10);
    const superAdminPassword = bcryptjs.hashSync('super123', salt);
    const adminPassword = bcryptjs.hashSync('admin123', salt);
    const clerkPassword = bcryptjs.hashSync('clerk123', salt);
    const customerPassword = bcryptjs.hashSync('customer123', salt);
    const supplierPassword = bcryptjs.hashSync('supplier123', salt);

    // 0A. Ensure Super Admin user exists and password is strictly super123
    let superAdmin = await User.findOne({ email: 'superadmin@mandios.com' });
    if (!superAdmin) {
      superAdmin = await User.create({
        email: 'superadmin@mandios.com',
        password: superAdminPassword,
        name: 'MandiOS Super Admin',
        phone: '03000000000',
        role: 'super_admin',
        address: 'MandiOS HQ, Lahore',
        status: 'Active',
      });
      console.log('Super Admin account created: superadmin@mandios.com / super123');
    } else {
      await User.findByIdAndUpdate(superAdmin.id || superAdmin._id, {
        password: superAdminPassword,
        role: 'super_admin',
        status: 'Active'
      });
      console.log('Super Admin account password refreshed: super123');
    }

    // Ensure Admin & Clerk & Supplier & Customer demo accounts exist and are active
    let demoAdmin = await User.findOne({ email: 'admin@mandi.com' });
    if (!demoAdmin) {
      demoAdmin = await User.create({
        email: 'admin@mandi.com',
        password: adminPassword,
        name: 'Mian Rashid (Admin)',
        phone: '03001234567',
        role: 'Admin',
        address: 'Shop 12, Fruit Market, Lahore',
        tenantId: 'tenant_default_001',
        status: 'Active',
      });
      console.log('Demo Admin created: admin@mandi.com / admin123');
    } else {
      await User.findByIdAndUpdate(demoAdmin.id || demoAdmin._id, {
        password: adminPassword,
        status: 'Active'
      });
    }

    let demoClerk = await User.findOne({ email: 'clerk@mandi.com' });
    if (!demoClerk) {
      demoClerk = await User.create({
        email: 'clerk@mandi.com',
        password: clerkPassword,
        name: 'Sajid Khan (Clerk)',
        phone: '03117654321',
        role: 'Clerk',
        address: 'Samanabad, Lahore',
        tenantId: 'tenant_default_001',
        status: 'Active',
      });
      console.log('Demo Clerk created: clerk@mandi.com / clerk123');
    } else {
      await User.findByIdAndUpdate(demoClerk.id || demoClerk._id, {
        password: clerkPassword,
        status: 'Active'
      });
    }

    let demoSupplier = await User.findOne({ email: 'supplier1@mandi.com' });
    if (!demoSupplier) {
      demoSupplier = await User.create({
        email: 'supplier1@mandi.com',
        password: supplierPassword,
        name: 'Chaudhry Arshad (Grower)',
        phone: '03219876543',
        role: 'Supplier',
        address: 'Faruka Farm, Sargodha',
        tenantId: 'tenant_default_001',
        status: 'Active',
      });
    } else {
      await User.findByIdAndUpdate(demoSupplier.id || demoSupplier._id, {
        password: supplierPassword,
        status: 'Active'
      });
    }

    let demoCustomer = await User.findOne({ email: 'customer1@mandi.com' });
    if (!demoCustomer) {
      demoCustomer = await User.create({
        email: 'customer1@mandi.com',
        password: customerPassword,
        name: 'Haji Aslam (Fruit Buyer)',
        phone: '03334567890',
        role: 'Customer',
        address: 'Shop 45, New Mandi, Multan',
        tenantId: 'tenant_default_001',
        status: 'Active',
      });
    } else {
      await User.findByIdAndUpdate(demoCustomer.id || demoCustomer._id, {
        password: customerPassword,
        status: 'Active'
      });
    }

    // Ensure all business subscriptions are active and unexpired
    const allBusinesses = await Business.find({});
    for (const biz of allBusinesses) {
      await Business.findByIdAndUpdate(biz.id || biz._id, {
        isActive: true,
        isDeleted: false,
        subscriptionStatus: 'Active',
        subscriptionExpiryDate: '2030-12-31'
      });
    }

    // 0B. Ensure Default Business exists
    let defaultBiz = await Business.findOne({ tenantId: 'tenant_default_001' });
    if (!defaultBiz) {
      defaultBiz = await Business.create({
        businessName: 'Sabzi & Fruit Mandi Trade Brokerage',
        businessCode: 'BUS-1001',
        ownerName: 'Mian Rashid (Admin)',
        email: 'admin@mandi.com',
        phone: '03001234567',
        address: 'Shop 12, Fruit Market',
        city: 'Lahore',
        country: 'Pakistan',
        tenantId: 'tenant_default_001',
        subscriptionPlan: 'Enterprise',
        subscriptionStatus: 'Active',
        subscriptionStartDate: new Date().toISOString().split('T')[0],
        subscriptionExpiryDate: '2030-12-31',
        maxUsers: 50,
        isActive: true,
        isDeleted: false,
      });
      console.log('Default Business created with tenantId: tenant_default_001');
    }

    // 0C. Ensure Global Settings exist
    let globalSet = await GlobalSettings.findOne({});
    if (!globalSet) {
      await GlobalSettings.create({
        platformName: 'MandiOS Cloud ERP',
        maintenanceMode: false,
        supportEmail: 'support@mandios.com',
        supportPhone: '03000000000',
        defaultTrialDays: 30,
        allowSelfRegistration: false,
      });
    }

    // Migration Check: Migrate any existing records without tenantId
    const modelsToMigrate = [
      User, Product, Supplier, Customer, StockEntry, Sale, Ledger, Payment,
      AuditLog, Expense, Truck, Employee, Salary, SalaryAdvance
    ];

    for (const modelWrapper of modelsToMigrate) {
      const items = await modelWrapper.find({});
      let updated = false;
      for (const item of items) {
        if (!item.tenantId && item.role !== 'super_admin') {
          await modelWrapper.findByIdAndUpdate(item.id || item._id, { tenantId: 'tenant_default_001' });
          updated = true;
        }
      }
      if (updated) {
        console.log(`Migrated legacy records for model ${modelWrapper.name} to tenant_default_001.`);
      }
    }

    const userCount = await User.countDocuments({ role: { $ne: 'super_admin' } });
    if (userCount > 0) {
      console.log('Database already has tenant user data. Skipping full initial seed.');
      return;
    }

    console.log('Seeding Sabzi & Fruit Mandi Brokerage initial data...');

    // 1. Create Core login Users
    const uAdmin = await User.create({
      tenantId: 'tenant_default_001',
      email: 'admin@mandi.com',
      password: adminPassword,
      name: 'Mian Rashid (Admin)',
      phone: '03001234567',
      role: 'Admin',
      address: 'Shop 12, Fruit Market, Lahore',
      status: 'Active',
    });

    const uClerk = await User.create({
      tenantId: 'tenant_default_001',
      email: 'clerk@mandi.com',
      password: clerkPassword,
      name: 'Sajid Khan (Clerk)',
      phone: '03117654321',
      role: 'Clerk',
      address: 'Samanabad, Lahore',
      status: 'Active',
    });

    const uSup1 = await User.create({
      tenantId: 'tenant_default_001',
      email: 'supplier1@mandi.com',
      password: supplierPassword,
      name: 'Ahmad Nawaz (Supplier)',
      phone: '03215551212',
      role: 'Supplier',
      address: 'Mandi Bahauddin Farm',
      status: 'Active',
    });

    const uSup2 = await User.create({
      tenantId: 'tenant_default_001',
      email: 'supplier2@mandi.com',
      password: supplierPassword,
      name: 'Malik Farms (Supplier)',
      phone: '03009998877',
      role: 'Supplier',
      address: 'Sargodha Orange Orchards',
      status: 'Active',
    });

    const uCust1 = await User.create({
      tenantId: 'tenant_default_001',
      email: 'customer1@mandi.com',
      password: customerPassword,
      name: 'Karachi Fruit Mart (Customer)',
      phone: '03334445555',
      role: 'Customer',
      address: 'Sabzi Mandi Super Highway, Karachi',
      status: 'Active',
    });

    const uCust2 = await User.create({
      tenantId: 'tenant_default_001',
      email: 'customer2@mandi.com',
      password: customerPassword,
      name: 'Lahore Hyperstar (Customer)',
      phone: '03456667777',
      role: 'Customer',
      address: 'Gulberg, Lahore',
      status: 'Active',
    });

    // 2. Create Suppliers linked to users
    const s1 = await Supplier.create({
      userId: uSup1.id,
      name: 'Ahmad Nawaz (Supplier)',
      phone: '03215551212',
      address: 'Mandi Bahauddin Farm',
      cnic: '34101-1234567-1',
      currentBalance: -150000, // We owe them 150,000 PKR (Payable)
      totalSupplied: 450000,
      totalPaid: 300000,
      remainingBalance: -150000,
    });

    const s2 = await Supplier.create({
      userId: uSup2.id,
      name: 'Malik Farms (Supplier)',
      phone: '03009998877',
      address: 'Sargodha Orange Orchards',
      cnic: '38403-7654321-1',
      currentBalance: -80000, // We owe them 80,000 PKR (Payable)
      totalSupplied: 280000,
      totalPaid: 200000,
      remainingBalance: -80000,
    });

    // 3. Create Customers linked to users
    const c1 = await Customer.create({
      userId: uCust1.id,
      name: 'Karachi Fruit Mart (Customer)',
      phone: '03334445555',
      address: 'Sabzi Mandi Super Highway, Karachi',
      currentBalance: 120000, // They owe us 120,000 PKR (Receivable)
      totalPurchases: 320000,
      totalPaid: 200000,
      remainingBalance: 120000,
    });

    const c2 = await Customer.create({
      userId: uCust2.id,
      name: 'Lahore Hyperstar (Customer)',
      phone: '03456667777',
      address: 'Gulberg, Lahore',
      currentBalance: 65000, // They owe us 65,000 PKR (Receivable)
      totalPurchases: 185000,
      totalPaid: 120000,
      remainingBalance: 65000,
    });

    // 4. Create Products
    const p1 = await Product.create({
      name: 'Sindhri Mangoes',
      category: 'Fruits',
      unit: 'Crate',
      currentQuantity: 85,
      purchaseRate: 1500,
      saleRate: 1800,
      status: 'Active',
    });

    const p2 = await Product.create({
      name: 'Sargodha Kinnow',
      category: 'Fruits',
      unit: 'Box',
      currentQuantity: 120,
      purchaseRate: 800,
      saleRate: 1000,
      status: 'Active',
    });

    const p3 = await Product.create({
      name: 'Swat Potatoes',
      category: 'Vegetables',
      unit: 'Bag (50kg)',
      currentQuantity: 250,
      purchaseRate: 2200,
      saleRate: 2500,
      status: 'Active',
    });

    const p4 = await Product.create({
      name: 'Onions (Nasik)',
      category: 'Vegetables',
      unit: 'Bag (40kg)',
      currentQuantity: 15, // Low stock!
      purchaseRate: 2800,
      saleRate: 3100,
      status: 'Active',
    });

    const p5 = await Product.create({
      name: 'Golden Apples',
      category: 'Fruits',
      unit: 'Box',
      currentQuantity: 60,
      purchaseRate: 1800,
      saleRate: 2100,
      status: 'Active',
    });

    // Dates for mock entries
    const todayStr = new Date().toISOString().split('T')[0];
    const dayAgo1 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dayAgo3 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dayAgo7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 5. Create Stock entries (Supplied to Mandi Broker)
    await StockEntry.create({
      tenantId: 'tenant_default_001',
      supplierId: s1.id,
      supplierName: s1.name,
      productId: p1.id,
      productName: p1.name,
      quantity: 100,
      purchaseRate: 1500,
      date: dayAgo7,
      totalAmount: 150000,
    });

    await StockEntry.create({
      tenantId: 'tenant_default_001',
      supplierId: s1.id,
      supplierName: s1.name,
      productId: p3.id,
      productName: p3.name,
      quantity: 150,
      purchaseRate: 2000,
      date: dayAgo3,
      totalAmount: 300000,
    });

    await StockEntry.create({
      tenantId: 'tenant_default_001',
      supplierId: s2.id,
      supplierName: s2.name,
      productId: p2.id,
      productName: p2.name,
      quantity: 200,
      purchaseRate: 800,
      date: dayAgo1,
      totalAmount: 160000,
    });

    // 6. Create Sales
    await Sale.create({
      tenantId: 'tenant_default_001',
      customerId: c1.id,
      customerName: c1.name,
      productId: p1.id,
      productName: p1.name,
      quantity: 15,
      saleRate: 1800,
      discount: 1000,
      totalAmount: 26000,
      date: dayAgo3,
    });

    await Sale.create({
      tenantId: 'tenant_default_001',
      customerId: c1.id,
      customerName: c1.name,
      productId: p3.id,
      productName: p3.name,
      quantity: 50,
      saleRate: 2500,
      discount: 0,
      totalAmount: 125000,
      date: dayAgo1,
    });

    await Sale.create({
      tenantId: 'tenant_default_001',
      customerId: c2.id,
      customerName: c2.name,
      productId: p2.id,
      productName: p2.name,
      quantity: 80,
      saleRate: 1000,
      discount: 2000,
      totalAmount: 78000,
      date: todayStr,
    });

    // 7. Ledgers
    // Supplier 1 ledger (Ahmad Nawaz)
    await Ledger.create({
      tenantId: 'tenant_default_001',
      partyId: s1.id,
      partyType: 'Supplier',
      date: dayAgo7,
      type: 'Credit',
      amount: 150000,
      balanceAfter: -150000,
      description: `Stock Supplied: 100 Crates of ${p1.name} @ Rs. 1500`,
    });

    await Ledger.create({
      tenantId: 'tenant_default_001',
      partyId: s1.id,
      partyType: 'Supplier',
      date: dayAgo3,
      type: 'Credit',
      amount: 300000,
      balanceAfter: -450000,
      description: `Stock Supplied: 150 Bags of ${p3.name} @ Rs. 2000`,
    });

    await Ledger.create({
      tenantId: 'tenant_default_001',
      partyId: s1.id,
      partyType: 'Supplier',
      date: dayAgo1,
      type: 'Debit',
      amount: 300000,
      balanceAfter: -150000,
      description: 'Cash payment disbursed to supplier',
    });

    // Supplier 2 ledger (Malik Farms)
    await Ledger.create({
      tenantId: 'tenant_default_001',
      partyId: s2.id,
      partyType: 'Supplier',
      date: dayAgo1,
      type: 'Credit',
      amount: 160000,
      balanceAfter: -160000,
      description: `Stock Supplied: 200 Boxes of ${p2.name} @ Rs. 800`,
    });

    await Ledger.create({
      tenantId: 'tenant_default_001',
      partyId: s2.id,
      partyType: 'Supplier',
      date: todayStr,
      type: 'Debit',
      amount: 80000,
      balanceAfter: -80000,
      description: 'Cheque payment issued to supplier',
    });

    // Customer 1 ledger (Karachi Fruit Mart)
    await Ledger.create({
      tenantId: 'tenant_default_001',
      partyId: c1.id,
      partyType: 'Customer',
      date: dayAgo3,
      type: 'Debit',
      amount: 26000,
      balanceAfter: 26000,
      description: `Purchased 15 Crates of ${p1.name} @ Rs. 1800 (Discount Rs. 1000)`,
    });

    await Ledger.create({
      tenantId: 'tenant_default_001',
      partyId: c1.id,
      partyType: 'Customer',
      date: dayAgo1,
      type: 'Debit',
      amount: 125000,
      balanceAfter: 151000,
      description: `Purchased 50 Bags of ${p3.name} @ Rs. 2500`,
    });

    await Ledger.create({
      tenantId: 'tenant_default_001',
      partyId: c1.id,
      partyType: 'Customer',
      date: todayStr,
      type: 'Credit',
      amount: 31000,
      balanceAfter: 120000,
      description: 'Cash payment received from customer',
    });

    // Customer 2 ledger (Lahore Hyperstar)
    await Ledger.create({
      tenantId: 'tenant_default_001',
      partyId: c2.id,
      partyType: 'Customer',
      date: todayStr,
      type: 'Debit',
      amount: 78000,
      balanceAfter: 78000,
      description: `Purchased 80 Boxes of ${p2.name} @ Rs. 1000 (Discount Rs. 2000)`,
    });

    await Ledger.create({
      tenantId: 'tenant_default_001',
      partyId: c2.id,
      partyType: 'Customer',
      date: todayStr,
      type: 'Credit',
      amount: 13000,
      balanceAfter: 65000,
      description: 'Cash payment received from customer',
    });

    // 8. Record Payment History
    await Payment.create({
      tenantId: 'tenant_default_001',
      partyId: s1.id,
      partyName: s1.name,
      partyType: 'Supplier',
      date: dayAgo1,
      amount: 300000,
      type: 'Paid',
      description: 'Cash payment disbursed to supplier',
    });

    await Payment.create({
      tenantId: 'tenant_default_001',
      partyId: s2.id,
      partyName: s2.name,
      partyType: 'Supplier',
      date: todayStr,
      amount: 80000,
      type: 'Paid',
      description: 'Cheque payment issued to supplier',
    });

    await Payment.create({
      tenantId: 'tenant_default_001',
      partyId: c1.id,
      partyName: c1.name,
      partyType: 'Customer',
      date: todayStr,
      amount: 31000,
      type: 'Received',
      description: 'Cash payment received from customer',
    });

    await Payment.create({
      tenantId: 'tenant_default_001',
      partyId: c2.id,
      partyName: c2.name,
      partyType: 'Customer',
      date: todayStr,
      amount: 13000,
      type: 'Received',
      description: 'Cash payment received from customer',
    });

    // 9. Audit Logs
    await AuditLog.create({
      tenantId: 'tenant_default_001',
      userId: 'system',
      userName: 'System Init',
      userRole: 'Admin',
      action: 'SEED_DATABASE',
      details: 'Mock Sabzi Mandi Stock Broker database seeded successfully.',
      timestamp: new Date().toISOString(),
    });

    console.log('Database seeding successfully completed!');
  } catch (err) {
    console.error('Error during database seeding:', err);
  }
}
