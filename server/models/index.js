import mongoose from 'mongoose';
import { ModelWrapper } from '../config/db.js';

const Schema = mongoose.Schema;

// 0. Business Schema (Multi-Tenant SaaS Management)
const BusinessSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  businessName: { type: String, required: true },
  businessCode: { type: String },
  arthiCode: { type: String, uppercase: true, trim: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String },
  city: { type: String },
  country: { type: String, default: 'Pakistan' },
  logo: { type: String, default: '' },
  tenantId: { type: String, required: true, unique: true },
  subscriptionPlan: { type: String, default: 'Trial', enum: ['Trial', 'Basic', 'Standard', 'Premium', 'Enterprise', 'Pro', 'Free', 'Starter', 'Custom'] },
  subscriptionStatus: { type: String, default: 'Active', enum: ['Active', 'Suspended', 'Expired', 'Trial', 'Inactive'] },
  subscriptionStartDate: { type: String },
  subscriptionExpiryDate: { type: String },
  maxUsers: { type: Number, default: 10 },
  features: { type: Object, default: {} },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// Platform Broadcasts & Announcements Schema
const AnnouncementSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'info', enum: ['info', 'warning', 'alert', 'success'] },
  targetAudience: { type: String, default: 'All' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, default: 'Super Admin' },
  expiresAt: { type: String },
}, { timestamps: true });

// SaaS Subscription Plans & Quota Schema
const PlanSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  name: { type: String, required: true }, // Basic, Pro, Enterprise
  priceMonthly: { type: Number, default: 0 },
  priceAnnual: { type: Number, default: 0 },
  maxUsers: { type: Number, default: 5 },
  maxProducts: { type: Number, default: 50 },
  description: { type: String, default: '' },
  features: {
    logistics: { type: Boolean, default: true },
    multiLanguage: { type: Boolean, default: true },
    reportsExport: { type: Boolean, default: true },
    returnsModule: { type: Boolean, default: true },
    smsWhatsApp: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
  },
  isPopular: { type: Boolean, default: false },
  status: { type: String, default: 'Active' },
}, { timestamps: true });

// Global Platform Settings Schema (For Super Admin)
const GlobalSettingsSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  platformName: { type: String, default: 'MandiOS Cloud ERP' },
  maintenanceMode: { type: Boolean, default: false },
  supportEmail: { type: String, default: 'support@mandios.com' },
  supportPhone: { type: String, default: '03000000000' },
  defaultTrialDays: { type: Number, default: 30 },
  allowSelfRegistration: { type: Boolean, default: false },
}, { timestamps: true });

// 1. User Schema
const UserSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  tenantId: { type: String }, // Optional for super_admin, required for tenant users
  email: { 
    type: String, 
    trim: true, 
    lowercase: true,
    index: {
      unique: true,
      sparse: true,
      partialFilterExpression: { email: { $type: 'string', $gt: '' } },
    }
  },
  khataId: { type: String, uppercase: true, trim: true },
  password: { type: String },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, required: true, enum: ['super_admin', 'Admin', 'Clerk', 'Customer', 'Supplier'] },
  address: { type: String },
  status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: String },
}, { timestamps: true });

// 2. Product Schema
const ProductSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  tenantId: { type: String, default: 'tenant_default_001' },
  name: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  currentQuantity: { type: Number, default: 0 },
  purchaseRate: { type: Number, default: 0 },
  saleRate: { type: Number, default: 0 },
  status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
  // Default Settings added for customization
  defaultCommission: { type: Number, default: 0 },
  commissionType: { type: String, default: 'Percentage', enum: ['Fixed Amount', 'Percentage'] },
  defaultUnit: { type: String, default: 'Crate' },
  averageWeight: { type: Number, default: 0 },
  minPrice: { type: Number, default: 0 },
  maxPrice: { type: Number, default: 0 },
}, { timestamps: true });

// 3. Supplier Schema
const SupplierSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  tenantId: { type: String, default: 'tenant_default_001' },
  userId: { type: String, ref: 'User' },
  khataId: { type: String, uppercase: true, trim: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  cnic: { type: String },
  currentBalance: { type: Number, default: 0 }, // negative = we owe them
  totalSupplied: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  remainingBalance: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: String },
}, { timestamps: true });

// 4. Customer Schema
const CustomerSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  tenantId: { type: String, default: 'tenant_default_001' },
  userId: { type: String, ref: 'User' },
  khataId: { type: String, uppercase: true, trim: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  referenceBy: { type: String, default: '' },
  currentBalance: { type: Number, default: 0 }, // positive = they owe us
  totalPurchases: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  remainingBalance: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: String },
}, { timestamps: true });

// 5. StockEntry Schema
const StockEntrySchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  tenantId: { type: String, default: 'tenant_default_001' },
  lotNumber: { type: String },
  vehicleNumber: { type: String, default: '' },
  unit: { type: String, default: 'Crates' },
  supplierId: { type: String, ref: 'Supplier', required: true },
  supplierName: { type: String },
  productId: { type: String, ref: 'Product', required: true },
  productName: { type: String },
  quantity: { type: Number, required: true },
  remainingQuantity: { type: Number },
  purchaseRate: { type: Number, required: true },
  date: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  supplierCommissionType: { type: String, default: 'Percentage' },
  supplierCommissionValue: { type: Number, default: 0 },
  marketFeeRate: { type: Number, default: 0 },
  marketFeeAmount: { type: Number, default: 0 },
  lotExpenses: { type: Schema.Types.Mixed, default: {} },
  totalDeductions: { type: Number, default: 0 },
  netPayable: { type: Number, default: 0 },
  isSettled: { type: Boolean, default: false },
  settledAmount: { type: Number, default: 0 },
  settledAt: { type: Date },
}, { timestamps: true });

// 6. Sale Schema
const SaleSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  tenantId: { type: String, default: 'tenant_default_001' },
  customerId: { type: String, ref: 'Customer' },
  customerName: { type: String },
  productId: { type: String, ref: 'Product', required: true },
  productName: { type: String },
  stockEntryId: { type: String, ref: 'StockEntry' },
  quantity: { type: Number, required: true },
  saleRate: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  date: { type: String, required: true },
  isWalkIn: { type: Boolean, default: false },
  walkInName: { type: String },
  walkInMobile: { type: String },
  walkInVehicle: { type: String },
  remarks: { type: String },
  commissionAmount: { type: Number, default: 0 },
  commissionType: { type: String },
  commissionRate: { type: String },
  commissionRateValue: { type: Number },
  commissionBasis: { type: String },
  grossSale: { type: Number },
  netSale: { type: Number },
}, { timestamps: true });

// 7. Ledger Schema
const LedgerSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  tenantId: { type: String, default: 'tenant_default_001' },
  partyId: { type: String, required: true }, // Supplier id or Customer id
  partyType: { type: String, required: true, enum: ['Supplier', 'Customer'] },
  date: { type: String, required: true },
  type: { type: String, required: true, enum: ['Debit', 'Credit'] },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  description: { type: String },
}, { timestamps: true });

// 8. Payment Schema
const PaymentSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  tenantId: { type: String, default: 'tenant_default_001' },
  partyId: { type: String, required: true },
  partyName: { type: String },
  partyType: { type: String, required: true, enum: ['Supplier', 'Customer'] },
  date: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true, enum: ['Paid', 'Received'] },
  paymentMethod: { type: String, default: 'Cash' },
  description: { type: String },
}, { timestamps: true });

// 9. AuditLog Schema
const AuditLogSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  tenantId: { type: String, default: 'tenant_default_001' },
  userId: { type: String, required: true },
  userName: { type: String },
  userRole: { type: String },
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: String, required: true },
});

// 10. Expense Schema
const ExpenseSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  tenantId: { type: String, default: 'tenant_default_001' },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  description: { type: String },
  recordedBy: { type: String },
}, { timestamps: true });

// 11. Truck Schema
const TruckSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  tenantId: { type: String, default: 'tenant_default_001' },
  truckNumber: { type: String, required: true },
  status: { type: String, default: 'Arrived', enum: ['Arrived', 'Waiting', 'Completed', 'Dispatched'] },
  arrivalDate: { type: String, required: true },
  dispatchDate: { type: String },
  supplierId: { type: String, ref: 'Supplier' },
  supplierName: { type: String },
  driverName: { type: String },
  driverPhone: { type: String },
  quantityLoaded: { type: Number, default: 0 },
  description: { type: String },
  notes: { type: String },
}, { timestamps: true });

// 12. Employee Schema
const EmployeeSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  tenantId: { type: String, default: 'tenant_default_001' },
  employeeId: { type: String, required: true },
  name: { type: String, required: true },
  fatherName: { type: String },
  cnic: { type: String },
  phone: { type: String, required: true },
  alternatePhone: { type: String },
  email: { type: String },
  address: { type: String },
  city: { type: String },
  photo: { type: String },
  notes: { type: String },
  referenceBy: { type: String, default: '' },
  designation: { type: String, required: true },
  department: { type: String },
  joiningDate: { type: String, required: true },
  salaryType: { type: String, required: true, default: 'Monthly', enum: ['Monthly', 'Weekly', 'Daily'] },
  basicSalary: { type: Number, required: true },
  openingAdvance: { type: Number, default: 0 },
  status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: String },
}, { timestamps: true });

// 13. Salary Schema
const SalarySchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  tenantId: { type: String, default: 'tenant_default_001' },
  employeeId: { type: String, required: true },
  employeeName: { type: String },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  basicSalary: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  allowance: { type: Number, default: 0 },
  overtime: { type: Number, default: 0 },
  advanceDeduction: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  paymentDate: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, required: true, enum: ['Paid', 'Partial', 'Unpaid'] },
  remarks: { type: String },
  expenseReference: { type: String },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// 14. SalaryAdvance Schema
const SalaryAdvanceSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  tenantId: { type: String, default: 'tenant_default_001' },
  employeeId: { type: String, required: true },
  employeeName: { type: String },
  date: { type: String, required: true },
  amount: { type: Number, required: true },
  reason: { type: String },
  approvedBy: { type: String },
  remarks: { type: String },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// 15. Counter Schema (Atomic Khata ID Sequences)
const CounterSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  tenantId: { type: String, required: true },
  role: { type: String, required: true, enum: ['Customer', 'Supplier'] },
  seq: { type: Number, default: 0 },
}, { timestamps: true });

// Compile Mongoose Models (only if mongoose is used)
const MongooseBusiness = mongoose.models.Business || mongoose.model('Business', BusinessSchema);
const MongooseGlobalSettings = mongoose.models.GlobalSettings || mongoose.model('GlobalSettings', GlobalSettingsSchema);
const MongooseUser = mongoose.models.User || mongoose.model('User', UserSchema);
const MongooseProduct = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const MongooseSupplier = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);
const MongooseCustomer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
const MongooseStockEntry = mongoose.models.StockEntry || mongoose.model('StockEntry', StockEntrySchema);
const MongooseSale = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);
const MongooseLedger = mongoose.models.Ledger || mongoose.model('Ledger', LedgerSchema);
const MongoosePayment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
const MongooseAuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
const MongooseExpense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
const MongooseTruck = mongoose.models.Truck || mongoose.model('Truck', TruckSchema);
const MongooseEmployee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
const MongooseSalary = mongoose.models.Salary || mongoose.model('Salary', SalarySchema);
const MongooseSalaryAdvance = mongoose.models.SalaryAdvance || mongoose.model('SalaryAdvance', SalaryAdvanceSchema);
const MongooseCounter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);
const MongooseAnnouncement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);
const MongoosePlan = mongoose.models.Plan || mongoose.model('Plan', PlanSchema);

// Create and export Wrapped Models
export const Business = new ModelWrapper('Business', MongooseBusiness);
export const GlobalSettings = new ModelWrapper('GlobalSettings', MongooseGlobalSettings);
export const User = new ModelWrapper('User', MongooseUser);
export const Product = new ModelWrapper('Product', MongooseProduct);
export const Supplier = new ModelWrapper('Supplier', MongooseSupplier);
export const Customer = new ModelWrapper('Customer', MongooseCustomer);
export const StockEntry = new ModelWrapper('StockEntry', MongooseStockEntry);
export const Sale = new ModelWrapper('Sale', MongooseSale);
export const Ledger = new ModelWrapper('Ledger', MongooseLedger);
export const Payment = new ModelWrapper('Payment', MongoosePayment);
export const AuditLog = new ModelWrapper('AuditLog', MongooseAuditLog);
export const Expense = new ModelWrapper('Expense', MongooseExpense);
export const Truck = new ModelWrapper('Truck', MongooseTruck);
export const Employee = new ModelWrapper('Employee', MongooseEmployee);
export const Salary = new ModelWrapper('Salary', MongooseSalary);
export const SalaryAdvance = new ModelWrapper('SalaryAdvance', MongooseSalaryAdvance);
export const Counter = new ModelWrapper('Counter', MongooseCounter);
export const Announcement = new ModelWrapper('Announcement', MongooseAnnouncement);
export const Plan = new ModelWrapper('Plan', MongoosePlan);
export { ReturnRecord } from './returnModel.js';

