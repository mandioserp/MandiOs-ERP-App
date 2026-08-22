import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import DialogAlert from './common/DialogAlert.jsx';
import {
  TrendingUp, ArrowDownRight, ArrowUpRight, Plus, Pencil, Trash, Trash2,
  Search, ShieldAlert, Calendar, FileSpreadsheet, Eye, Printer, Filter, CheckCircle2, Boxes, X, ShoppingBag,
  Truck, DollarSign, Activity, FileText, Tag, CheckSquare, Layers, Percent, Clock, UserCheck, Users, RefreshCw, ChevronDown, ArrowUpDown, ArrowDown, ArrowUp, Download, ArrowDownLeft, CreditCard, RotateCcw, Receipt, Lock
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import SettingsContainer from './settings/SettingsContainer.jsx';
import BusinessProfile from './settings/BusinessProfile.jsx';
import HomeTab from './HomeTab.jsx';
import EmployeeManagement from './EmployeeManagement.jsx';
import RecordBatchSale from './RecordBatchSale.jsx';
import SoldConsignments from './SoldConsignments.jsx';
import TruckLogsAndLogistics from './TruckLogsAndLogistics.jsx';
import ProductCatalog from './ProductCatalog.jsx';
import ReturnsManagement from './ReturnsManagement.jsx';
import { openReportInNewTab } from '../utils/navigation.js';
import { downloadLedgerPDF } from '../utils/pdfExport.js';
import SpokeSpinner, { SubmitButton } from './common/SpokeSpinner.jsx';

function SearchablePartySelect({ partyType, partyId, suppliers = [], customers = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  const partiesList = React.useMemo(() => {
    if (partyType === 'Supplier') return suppliers || [];
    if (partyType === 'Customer') return customers || [];
    return [];
  }, [partyType, suppliers, customers]);

  const selectedParty = React.useMemo(() => {
    if (!partyId) return null;
    return partiesList.find(p => String(p.id || p._id) === String(partyId));
  }, [partyId, partiesList]);

  const filteredParties = React.useMemo(() => {
    if (!searchTerm.trim()) return partiesList;
    const term = searchTerm.toLowerCase();
    return partiesList.filter(p => 
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.phone && p.phone.toLowerCase().includes(term)) ||
      (p.khataId && String(p.khataId).toLowerCase().includes(term)) ||
      (p.code && String(p.code).toLowerCase().includes(term))
    );
  }, [partiesList, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (party) => {
    const id = party ? (party.id || party._id) : '';
    onChange({ target: { name: 'partyId', value: id } });
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        disabled={!partyType}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none focus:border-[#4F46E5] text-slate-800 dark:text-slate-100 font-medium text-left flex items-center justify-between text-xs transition-all disabled:opacity-50 hover:border-slate-300 dark:hover:border-slate-700"
      >
        <span className={selectedParty ? 'text-slate-900 dark:text-white font-bold truncate' : 'text-slate-400 truncate'}>
          {selectedParty ? (
            `${selectedParty.name}${selectedParty.khataId ? ` [${selectedParty.khataId}]` : ''} (${partyType === 'Supplier' ? `Debt: Rs. ${Math.abs(selectedParty.currentBalance || 0).toLocaleString()}` : `Receivable: Rs. ${(selectedParty.currentBalance || 0).toLocaleString()}`})`
          ) : (
            partyType ? `Click to search or select ${partyType}...` : 'First Select Party Type'
          )}
        </span>
        <ChevronDown size={16} className={`text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && partyType && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-2xl p-2.5 text-xs space-y-2 max-h-72 flex flex-col">
          <div className="relative shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Type name or phone to filter ${partyType}s...`}
              className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-7 py-2 text-xs outline-none focus:border-[#4F46E5] text-slate-900 dark:text-white font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="overflow-y-auto space-y-1 flex-1 pr-1 custom-scrollbar">
            {filteredParties.length > 0 ? (
              filteredParties.map((p) => {
                const isSelected = String(p.id || p._id) === String(partyId);
                const bal = partyType === 'Supplier' 
                  ? `Debt: Rs. ${Math.abs(p.currentBalance || 0).toLocaleString()}`
                  : `Receivable: Rs. ${(p.currentBalance || 0).toLocaleString()}`;
                return (
                  <button
                    key={p.id || p._id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between gap-2 ${
                      isSelected 
                        ? 'bg-[#4F46E5]/10 text-[#4F46E5] dark:text-indigo-400 font-bold border border-[#4F46E5]/20' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-slate-900 dark:text-white">{p.name}</span>
                        {(p.khataId || p.code) && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                            {p.khataId || p.code}
                          </span>
                        )}
                      </div>
                      {p.phone && <div className="text-[10px] text-slate-400 truncate">Phone: {p.phone}</div>}
                    </div>
                    <div className="text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                      {bal}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs italic">
                No matching {partyType.toLowerCase()}s found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentForm({
  formData,
  onChange,
  onSubmit,
  suppliers = [],
  customers = [],
  paymentMethods = [],
  isSubmitting = false,
  onCancel = null,
  isModal = false
}) {
  const selectedParty = React.useMemo(() => {
    if (!formData?.partyId || !formData?.partyType) return null;
    if (formData.partyType === 'Supplier') {
      return suppliers.find(s => String(s.id || s._id) === String(formData.partyId));
    }
    if (formData.partyType === 'Customer') {
      return customers.find(c => String(c.id || c._id) === String(formData.partyId));
    }
    return null;
  }, [formData?.partyId, formData?.partyType, suppliers, customers]);

  const balanceCalc = React.useMemo(() => {
    if (!selectedParty || !formData?.amount || isNaN(formData.amount)) return null;
    const payAmt = Number(formData.amount);
    if (payAmt <= 0) return null;

    if (formData.partyType === 'Supplier') {
      const currentBal = Number(selectedParty.currentBalance) || 0;
      const newBal = currentBal + payAmt;
      return {
        type: 'Supplier',
        currentDebt: Math.abs(currentBal),
        newDebt: Math.abs(newBal)
      };
    } else {
      const currentBal = Number(selectedParty.currentBalance) || 0;
      const newBal = currentBal - payAmt;
      return {
        type: 'Customer',
        currentReceivable: currentBal,
        newReceivable: newBal
      };
    }
  }, [selectedParty, formData?.amount, formData?.partyType]);

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Party Type</label>
          <select
            required
            name="partyType"
            value={formData?.partyType || ''}
            onChange={(e) => {
              onChange(e);
              onChange({ target: { name: 'partyId', value: '' } });
            }}
            className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none focus:border-[#4F46E5] text-slate-800 dark:text-slate-100 font-medium"
          >
            <option value="">Select Category</option>
            <option value="Supplier">Supplier (Paying Farmer)</option>
            <option value="Customer">Customer (Receiving Cash)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Party Select</label>
          <SearchablePartySelect
            partyType={formData?.partyType}
            partyId={formData?.partyId}
            suppliers={suppliers}
            customers={customers}
            onChange={onChange}
          />
        </div>
      </div>

      {selectedParty && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A]/80 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-700 dark:text-slate-300">
          <div>
            <span className="font-bold text-slate-900 dark:text-white">{selectedParty.name}</span>
            <span className="text-[11px] text-slate-500 ml-2">({formData.partyType})</span>
            {selectedParty.phone && <span className="text-[11px] text-slate-400 ml-2">• Phone: {selectedParty.phone}</span>}
          </div>
          {balanceCalc && (
            <div className="text-right text-xs">
              {balanceCalc.type === 'Supplier' ? (
                <div>
                  <span className="text-slate-400">Current Debt: </span>
                  <span className="font-bold text-rose-500">Rs. {balanceCalc.currentDebt.toLocaleString()}</span>
                  <span className="mx-1.5 text-slate-400">→</span>
                  <span className="text-slate-400">New Debt: </span>
                  <span className="font-bold text-emerald-500">Rs. {balanceCalc.newDebt.toLocaleString()}</span>
                </div>
              ) : (
                <div>
                  <span className="text-slate-400">Current Receivable: </span>
                  <span className="font-bold text-indigo-500">Rs. {balanceCalc.currentReceivable.toLocaleString()}</span>
                  <span className="mx-1.5 text-slate-400">→</span>
                  <span className="text-slate-400">New Receivable: </span>
                  <span className="font-bold text-emerald-500">Rs. {balanceCalc.newReceivable.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Amount Cash (Rs.)</label>
          <input
            required
            type="number"
            min="1"
            step="any"
            name="amount"
            value={formData?.amount || ''}
            onChange={onChange}
            placeholder="Enter value in Rs."
            className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none focus:border-[#4F46E5] text-slate-800 dark:text-slate-100 font-medium"
          />
        </div>
        <div className="space-y-1">
          <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Date</label>
          <input
            required
            type="date"
            name="date"
            value={formData?.date || ''}
            onChange={onChange}
            className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none focus:border-[#4F46E5] text-slate-800 dark:text-slate-100 font-medium"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Payment Method</label>
        <select
          required
          name="paymentMethod"
          value={formData?.paymentMethod || 'Cash'}
          onChange={onChange}
          className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none focus:border-[#4F46E5] text-slate-800 dark:text-slate-100 font-medium"
        >
          {(() => {
            const activeSettingMethods = (paymentMethods || [])
              .filter(m => m.status === 'Active' || !m.status)
              .map(m => m.name);
            
            let methodsList = activeSettingMethods.length > 0 
              ? Array.from(new Set(activeSettingMethods)) 
              : ['Cash'];

            if (formData?.paymentMethod && !methodsList.includes(formData.paymentMethod)) {
              methodsList = [...methodsList, formData.paymentMethod];
            }

            return methodsList.map(method => (
              <option key={method} value={method}>{method}</option>
            ));
          })()}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Description / Memo</label>
        <input
          type="text"
          name="description"
          value={formData?.description || ''}
          onChange={onChange}
          placeholder="e.g. Bank Transfer Ref, Counter Cash"
          className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none focus:border-[#4F46E5] text-slate-800 dark:text-slate-100 font-medium"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
        {isModal && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-indigo-500/10 flex items-center space-x-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <SpokeSpinner size={16} color="#FFFFFF" />
              <span>Processing...</span>
            </>
          ) : (
            <span>Disburse / Receive</span>
          )}
        </button>
      </div>
    </form>
  );
}

export default function AdminDashboard({ tab, setCurrentTab }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const confirm = useConfirm();
  // Data States
  const [clerks, setClerks] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [returns, setReturns] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [reportsData, setReportsData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);

  // Status/Control States
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  // Pagination & Filtering States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [filterProduct, setFilterProduct] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState('');
  
  // Custom Dashboard Global Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTruck, setFilterTruck] = useState('');
  const [filterClerk, setFilterClerk] = useState('');
  const [dashboardSubTab, setDashboardSubTab] = useState('finance');

  // Pending Filter States (buffered before the Apply Filters button is clicked)
  const [pendingReportType, setPendingReportType] = useState('monthly');
  const [pendingCustomStart, setPendingCustomStart] = useState('');
  const [pendingCustomEnd, setPendingCustomEnd] = useState('');
  const [pendingFilterProduct, setPendingFilterProduct] = useState('');
  const [pendingFilterSupplier, setPendingFilterSupplier] = useState('');
  const [pendingFilterCustomer, setPendingFilterCustomer] = useState('');
  const [pendingFilterCategory, setPendingFilterCategory] = useState('');
  const [pendingFilterTruck, setPendingFilterTruck] = useState('');
  const [pendingFilterClerk, setPendingFilterClerk] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const supplierComboboxRef = useRef(null);
  const customerComboboxRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (supplierComboboxRef.current && !supplierComboboxRef.current.contains(event.target)) {
        setIsSupplierDropdownOpen(false);
      }
      if (customerComboboxRef.current && !customerComboboxRef.current.contains(event.target)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [truckFilter, setTruckFilter] = useState('All'); // 'All', 'Arrived', 'Waiting', 'Completed', 'Dispatched'

  // Modals States
  const [modalType, setModalType] = useState(null); // 'clerk', 'supplier', 'customer', 'product', 'stock', 'sale', 'payment', 'view_ledger', 'expense', 'truck'
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [modalAlert, setModalAlert] = useState(null);

  // Pay or Receive Tab Inline Form State
  const [payReceiveFormData, setPayReceiveFormData] = useState({
    partyType: 'Supplier',
    partyId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    description: ''
  });
  const [payReceiveSubmitting, setPayReceiveSubmitting] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0) {
      const activeMethod = paymentMethods.find(m => m.status === 'Active' || !m.status)?.name || 'Cash';
      setPayReceiveFormData(prev => ({
        ...prev,
        paymentMethod: prev.paymentMethod || activeMethod
      }));
    }
  }, [paymentMethods]);

  const handlePayReceiveFormChange = (e) => {
    const { name, value } = e.target;
    setPayReceiveFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayReceiveSubmit = async (e) => {
    e.preventDefault();
    if (!payReceiveFormData.partyType || !payReceiveFormData.partyId || !payReceiveFormData.amount || !payReceiveFormData.date) {
      showToast('Please select party and enter amount and date.', 'error');
      return;
    }
    setPayReceiveSubmitting(true);
    try {
      await api.post('/payments', payReceiveFormData);
      showToast('Payment / Receipt recorded successfully!');
      const activeMethod = (paymentMethods || []).find(m => m.status === 'Active' || !m.status)?.name || 'Cash';
      setPayReceiveFormData({
        partyType: 'Supplier',
        partyId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: activeMethod,
        description: ''
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to record payment', 'error');
    } finally {
      setPayReceiveSubmitting(false);
    }
  };

  // Ledger state for viewing
  const [ledgerHistory, setLedgerHistory] = useState([]);
  const [ledgerPartyName, setLedgerPartyName] = useState('');
  const [ledgerSortOrder, setLedgerSortOrder] = useState('newest'); // 'newest' | 'oldest'

  // Sorted ledger history entries according to ledgerSortOrder (default Newest First)
  const displayLedgerHistory = [...ledgerHistory].sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt || 0).getTime();
    const dateB = new Date(b.date || b.createdAt || 0).getTime();
    if (dateA !== dateB) {
      return ledgerSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    }
    const idxA = ledgerHistory.indexOf(a);
    const idxB = ledgerHistory.indexOf(b);
    return ledgerSortOrder === 'newest' ? idxB - idxA : idxA - idxB;
  });
  const [invoiceSettings, setInvoiceSettings] = useState(null);
  const [unitsList, setUnitsList] = useState([]);

  // Notification Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Core Data on mount or tab change
  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        clerksRes, suppliersRes, customersRes, productsRes,
        stockRes, salesRes, paymentsRes, returnsRes, auditRes, reportsRes,
        expensesRes, trucksRes, employeesRes, salariesRes, advancesRes,
        invoiceSettingsRes, unitsRes, expCatsRes, payMethodsRes,
        deletedUsersRes
      ] = await Promise.all([
        api.get('/clerks').catch(() => ({ data: [] })),
        api.get('/suppliers').catch(() => ({ data: [] })),
        api.get('/customers').catch(() => ({ data: [] })),
        api.get('/products').catch(() => ({ data: [] })),
        api.get('/stock').catch(() => ({ data: [] })),
        api.get('/sales').catch(() => ({ data: [] })),
        api.get('/payments').catch(() => ({ data: [] })),
        api.get('/returns').catch(() => ({ data: [] })),
        api.get('/audit').catch(() => ({ data: [] })),
        api.get(`/reports?type=${reportType}${reportType === 'custom' ? `&startDate=${customStart}&endDate=${customEnd}` : ''}&productId=${filterProduct}&supplierId=${filterSupplier}&customerId=${filterCustomer}&category=${filterCategory}&truckNumber=${filterTruck}&clerkId=${filterClerk}`).catch(() => ({ data: null })),
        api.get('/expenses').catch(() => ({ data: [] })),
        api.get('/trucks').catch(() => ({ data: [] })),
        api.get('/employees').catch(() => ({ data: [] })),
        api.get('/salaries').catch(() => ({ data: [] })),
        api.get('/advances').catch(() => ({ data: [] })),
        api.get('/settings/invoice').catch(() => ({ data: null })),
        api.get('/settings/units').catch(() => ({ data: [] })),
        api.get('/settings/expense-categories').catch(() => ({ data: [] })),
        api.get('/settings/payment-methods').catch(() => ({ data: [] })),
        api.get('/deleted-users').catch(() => ({ data: [] }))
      ]);

      const extractArray = (data) => Array.isArray(data) ? data : (Array.isArray(data?.products) ? data.products : (Array.isArray(data?.data) ? data.data : []));

      setClerks(extractArray(clerksRes.data));
      setSuppliers(extractArray(suppliersRes.data));
      setCustomers(extractArray(customersRes.data));
      setProducts(extractArray(productsRes.data));
      setStockEntries(extractArray(stockRes.data));
      setSales(extractArray(salesRes.data));
      setPayments(extractArray(paymentsRes.data));
      setReturns(extractArray(returnsRes.data));
      setAuditLogs(extractArray(auditRes.data));
      setReportsData(reportsRes.data || null);
      setExpenses(extractArray(expensesRes.data));
      setTrucks(extractArray(trucksRes.data));
      setEmployees(extractArray(employeesRes.data));
      setSalaries(extractArray(salariesRes.data));
      setAdvances(extractArray(advancesRes.data));
      setInvoiceSettings(invoiceSettingsRes.data || null);
      setUnitsList(extractArray(unitsRes.data));
      setExpenseCategories(extractArray(expCatsRes.data));
      setPaymentMethods(extractArray(payMethodsRes.data));
      setDeletedUsers(extractArray(deletedUsersRes.data));
    } catch (err) {
      showToast('Error loading server data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetGlobalDashboardFilters = () => {
    setFilterProduct('');
    setFilterSupplier('');
    setFilterCustomer('');
    setFilterCategory('');
    setFilterTruck('');
    setFilterClerk('');
    setReportType('monthly');
    setCustomStart('');
    setCustomEnd('');

    setPendingFilterProduct('');
    setPendingFilterSupplier('');
    setPendingFilterCustomer('');
    setPendingFilterCategory('');
    setPendingFilterTruck('');
    setPendingFilterClerk('');
    setPendingReportType('monthly');
    setPendingCustomStart('');
    setPendingCustomEnd('');
    setCustomerSearchQuery('');
    setSupplierSearchQuery('');
  };

  // Reset Global Dashboard Analytical Filters when tab changes away from 'dashboard'
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
    if (tab !== 'dashboard') {
      resetGlobalDashboardFilters();
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [tab, reportType, customStart, customEnd, filterProduct, filterSupplier, filterCustomer, filterCategory, filterTruck, filterClerk]);

  // Open Add/Edit modals
  const openModal = async (type, mode, item = null) => {
    setModalType(type);
    setModalMode(mode);
    setSelectedItem(item);
    setModalAlert(null);

    if (mode === 'edit' && item) {
      setFormData({
        ...item,
        khataId: item.khataId || item.code || '',
        password: ''
      }); // reset password field for edit
    } else {
      if (type === 'payment') {
        const defaultMethod = (paymentMethods || []).find(m => m.status === 'Active' || !m.status)?.name || 'Cash';
        setFormData({
          partyType: 'Supplier',
          partyId: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: defaultMethod,
          description: ''
        });
      } else if (type === 'supplier') {
        setFormData({ khataId: '' });
        try {
          const res = await api.get('/suppliers/next-khata-id');
          if (res.data?.nextKhataId) {
            setFormData(prev => ({ ...prev, khataId: res.data.nextKhataId }));
          }
        } catch (e) {
          // ignore or fallback
        }
      } else if (type === 'customer') {
        setFormData({ khataId: '' });
        try {
          const res = await api.get('/customers/next-khata-id');
          if (res.data?.nextKhataId) {
            setFormData(prev => ({ ...prev, khataId: res.data.nextKhataId }));
          }
        } catch (e) {
          // ignore or fallback
        }
      } else {
        setFormData({});
      }
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
    setFormData({});
    setModalAlert(null);
  };

  // Handle Form Change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (modalSubmitting) return;
    setModalSubmitting(true);
    setModalAlert(null);
    try {
      let endpoint = '';
      if (modalType === 'clerk') endpoint = '/clerks';
      else if (modalType === 'supplier') endpoint = '/suppliers';
      else if (modalType === 'customer') endpoint = '/customers';
      else if (modalType === 'product') endpoint = '/products';
      else if (modalType === 'stock') endpoint = '/stock';
      else if (modalType === 'sale') endpoint = '/sales';
      else if (modalType === 'payment') endpoint = '/payments';
      else if (modalType === 'expense') endpoint = '/expenses';
      else if (modalType === 'truck') endpoint = '/trucks';

      if (modalMode === 'add') {
        if (modalType === 'stock' || modalType === 'sale' || modalType === 'expense' || modalType === 'truck') {
          // Add default date if empty
          if (modalType === 'truck' && !formData.arrivalDate) {
            formData.arrivalDate = new Date().toISOString().split('T')[0];
          }
          if (modalType === 'expense' && !formData.date) {
            formData.date = new Date().toISOString().split('T')[0];
          }
          if (!formData.date && modalType !== 'truck') {
            formData.date = new Date().toISOString().split('T')[0];
          }
        }
        await api.post(endpoint, formData);
        showToast(`${modalType.toUpperCase()} created successfully!`);
      } else {
        await api.put(`${endpoint}/${selectedItem.id || selectedItem._id}`, formData);
        showToast(`${modalType.toUpperCase()} updated successfully!`);
      }
      closeModal();
      fetchData();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to submit form';
      if (modalType) {
        setModalAlert({ type: 'error', message: errMsg });
      } else {
        showToast(errMsg, 'error');
      }
    } finally {
      setModalSubmitting(false);
    }
  };

  // Helper to check if a supplier has linked data in the application
  const isSupplierLinked = (sup) => {
    if (!sup) return false;
    const sId = String(sup.id || sup._id);
    const sName = sup.name ? sup.name.trim().toLowerCase() : '';
    if (Math.abs(Number(sup.currentBalance) || 0) > 0.01) return true;
    if (Math.abs(Number(sup.remainingBalance) || 0) > 0.01) return true;
    if (Number(sup.totalSupplied) > 0 || Number(sup.totalPaid) > 0) return true;
    if (stockEntries?.some(st => String(st.supplierId) === sId || (st.supplierName && st.supplierName.trim().toLowerCase() === sName))) return true;
    if (payments?.some(p => p.partyType === 'Supplier' && (String(p.partyId) === sId || (p.partyName && p.partyName.trim().toLowerCase() === sName)))) return true;
    if (trucks?.some(t => String(t.supplierId) === sId || (t.supplierName && t.supplierName.trim().toLowerCase() === sName))) return true;
    if (returns?.some(r => String(r.supplierId) === sId || (r.supplierName && r.supplierName.trim().toLowerCase() === sName))) return true;
    return false;
  };

  // Helper to check if a customer has linked data in the application
  const isCustomerLinked = (cust) => {
    if (!cust) return false;
    const cId = String(cust.id || cust._id);
    const cName = cust.name ? cust.name.trim().toLowerCase() : '';
    if (Math.abs(Number(cust.currentBalance) || 0) > 0.01) return true;
    if (Math.abs(Number(cust.remainingBalance) || 0) > 0.01) return true;
    if (Number(cust.totalPurchases) > 0 || Number(cust.totalPaid) > 0) return true;
    if (sales?.some(s => String(s.customerId) === cId || (s.customerName && s.customerName.trim().toLowerCase() === cName))) return true;
    if (payments?.some(p => p.partyType === 'Customer' && (String(p.partyId) === cId || (p.partyName && p.partyName.trim().toLowerCase() === cName)))) return true;
    if (returns?.some(r => String(r.customerId) === cId || (r.customerName && r.customerName.trim().toLowerCase() === cName))) return true;
    return false;
  };

  // Handle Delete with Confirmation
  const handleDelete = async (type, id, name) => {
    if (type === 'supplier') {
      const sup = suppliers.find(s => String(s.id || s._id) === String(id));
      if (isSupplierLinked(sup)) {
        showToast(`Cannot delete supplier "${name}": This supplier has linked transactions/records (stock arrivals, payments, or ledger entries) in the application.`, 'error');
        return;
      }
    }

    if (type === 'customer') {
      const cust = customers.find(c => String(c.id || c._id) === String(id));
      if (isCustomerLinked(cust)) {
        showToast(`Cannot delete customer "${name}": This customer has linked transactions/records (sales invoices, payments, or ledger entries) in the application.`, 'error');
        return;
      }
    }

    const isUserType = ['clerk', 'supplier', 'customer', 'employee'].includes(type);
    const confirmMsg = isUserType
      ? `Are you sure you want to delete ${name}? This user will be soft-deleted and moved to the Deleted Users / Trash section, where they can be restored anytime.`
      : `Are you absolutely sure you want to delete ${name}? This action is irreversible.`;

    const confirmed = await confirm({
      title: isUserType ? `Delete ${name}?` : `Delete Record`,
      message: confirmMsg,
      confirmText: isUserType ? 'Delete & Move to Trash' : 'Delete',
      type: 'danger'
    });

    if (!confirmed) {
      return;
    }

    try {
      let endpoint = '';
      if (type === 'clerk') endpoint = `/clerks/${id}`;
      else if (type === 'supplier') endpoint = `/suppliers/${id}`;
      else if (type === 'customer') endpoint = `/customers/${id}`;
      else if (type === 'employee') endpoint = `/employees/${id}`;
      else if (type === 'product') endpoint = `/products/${id}`;
      else if (type === 'stock') endpoint = `/stock/${id}`;
      else if (type === 'sale') endpoint = `/sales/${id}`;
      else if (type === 'payment') endpoint = `/payments/${id}`;
      else if (type === 'expense') endpoint = `/expenses/${id}`;
      else if (type === 'truck') endpoint = `/trucks/${id}`;
      else endpoint = `/users/${id}`;

      await api.delete(endpoint);
      showToast(isUserType ? `${name} soft-deleted and moved to Trash.` : `${type.toUpperCase()} deleted successfully.`);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete record.', 'error');
    }
  };

  // Handle Restore User
  const handleRestoreUser = async (item) => {
    const confirmed = await confirm({
      title: `Restore ${item.name}?`,
      message: `Are you sure you want to restore ${item.name}? This will reactivate their account and restore their profile.`,
      confirmText: 'Restore Account',
      type: 'info'
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.post(`/deleted-users/${item.id || item.entityId}/restore`, { entityType: item.entityType });
      showToast(`${item.name} (${item.userType || item.role}) restored successfully.`);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to restore user.', 'error');
    }
  };

  // Quick update for Truck / Gate Logistics status
  const handleTruckStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/trucks/${id}`, { status: newStatus });
      showToast(`Vehicle status updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update vehicle status', 'error');
    }
  };

  // View ledger for a party (Supplier or Customer)
  const viewLedger = (partyId, partyType, name) => {
    const reportType = partyType === 'Supplier' ? 'supplier-ledger' : 'customer-ledger';
    openReportInNewTab(reportType, { partyId, partyName: encodeURIComponent(name) });
  };

  // Export to Excel (Generates CSV and triggers download)
  const exportToExcel = (dataList, filename) => {
    if (!dataList || dataList.length === 0) {
      showToast('No data available to export', 'error');
      return;
    }

    const headers = Object.keys(dataList[0]).join(',');
    const rows = dataList.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report exported to Excel (.csv) format!');
  };

  // Native Print Window for printable invoice
  const triggerPrint = (title) => {
    const printContent = document.getElementById('printable-area');
    const originalContent = document.body.innerHTML;

    if (!printContent) {
      showToast('Printing error: Area not found', 'error');
      return;
    }

    const win = window.open('', '', 'height=700,width=900');
    win.document.write('<html><head><title>' + title + '</title>');
    win.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.3.0/dist/tailwind.min.css" rel="stylesheet">');
    win.document.write('</head><body class="p-8 bg-white text-slate-900">');
    win.document.write(printContent.innerHTML);
    win.document.write('</body></html>');
    win.document.close();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  // Enriched Stock Entries with Returns calculations
  const enrichedStockEntries = React.useMemo(() => {
    return stockEntries.map(entry => {
      const entryId = String(entry.id || entry._id);
      const lotNumStr = entry.lotNumber ? String(entry.lotNumber) : null;

      // Find linked sales
      const lotSales = (sales || []).filter(s => {
        if (s.isDeleted) return false;
        const sStockId = s.stockEntryId ? String(s.stockEntryId) : null;
        const sLotNum = s.stockLotNumber ? String(s.stockLotNumber) : null;
        if (sStockId && sStockId === entryId) return true;
        if (sLotNum && lotNumStr && sLotNum === lotNumStr) return true;
        return false;
      });

      // Find linked approved returns
      const lotReturns = (returns || []).filter(r => {
        if (r.isDeleted || r.status !== 'Approved') return false;
        const rStockId = r.stockEntryId ? String(r.stockEntryId) : null;
        const rSaleId = r.saleId ? String(r.saleId) : null;
        const matchesStock = (rStockId && rStockId === entryId);
        const matchesSale = rSaleId && lotSales.some(s => String(s.id || s._id) === rSaleId);
        return matchesStock || matchesSale;
      });

      const arrivedQty = entry.arrivedQuantity !== undefined ? Number(entry.arrivedQuantity) : (Number(entry.quantity) || 0);
      const rawSoldQty = lotSales.length > 0
        ? lotSales.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0)
        : (entry.soldQuantity !== undefined ? Number(entry.soldQuantity) : 0);

      const returnedProduceQty = lotReturns.length > 0
        ? lotReturns.reduce((acc, r) => acc + (Number(r.produceReturnedQty) || 0), 0)
        : (entry.returnedQuantity !== undefined ? Number(entry.returnedQuantity) : 0);

      const netSoldQty = Math.max(0, rawSoldQty - returnedProduceQty);
      const remainingQty = entry.remainingQuantity !== undefined 
        ? Number(entry.remainingQuantity) 
        : Math.max(0, arrivedQty - netSoldQty);

      const rawGrossSales = lotSales.reduce((acc, s) => acc + (Number(s.grossSale) || (Number(s.quantity || 0) * Number(s.saleRate || 0)) || 0), 0);
      const returnedGross = lotReturns.reduce((acc, r) => acc + (Number(r.grossReturnAmount) || (Number(r.produceReturnedQty || 0) * Number(r.saleRate || 0)) || 0), 0);
      const totalAmount = (rawGrossSales > 0 || returnedGross > 0)
        ? Math.max(0, Math.round((rawGrossSales - returnedGross) * 100) / 100)
        : (Number(entry.totalAmount) || 0);

      const avgRate = netSoldQty > 0 
        ? (Math.round((totalAmount / netSoldQty) * 100) / 100)
        : (Number(entry.purchaseRate) || 0);

      const status = remainingQty === 0 ? 'Depleted' : (netSoldQty > 0 ? 'Partially Sold' : 'In-Stock');
      const lotNumber = entry.lotNumber || (entryId.substring(0, 6).toUpperCase());
      const unit = entry.unit || 'Crates';

      return {
        ...entry,
        lotNumber,
        unit,
        arrivedQty,
        soldQty: rawSoldQty,
        returnedProduceQty,
        netSoldQty,
        remainingQty,
        avgRate,
        totalAmount,
        status,
      };
    });
  }, [stockEntries, sales, returns]);

  // Stock Summary calculations
  const stockSummary = React.useMemo(() => {
    let totalLots = enrichedStockEntries.length;
    let totalArrived = 0;
    let totalSold = 0;
    let totalReturned = 0;
    let totalRemaining = 0;
    let totalCreditedAmount = 0;

    enrichedStockEntries.forEach(item => {
      totalArrived += (item.arrivedQty || 0);
      totalSold += (item.soldQty || 0);
      totalReturned += (item.returnedProduceQty || 0);
      totalRemaining += (item.remainingQty || 0);
      totalCreditedAmount += (item.totalAmount || 0);
    });

    return {
      totalLots,
      totalArrived,
      totalSold,
      totalReturned,
      netSold: Math.max(0, totalSold - totalReturned),
      totalRemaining,
      totalCreditedAmount
    };
  }, [enrichedStockEntries]);

  // Parse dynamic financial summary from report API
  const fSummary = reportsData?.financialSummary || {
    totalSales: 0,
    totalPurchases: 0,
    totalCustomerCommission: 0,
    totalSupplierCommission: 0,
    totalCommissionEarned: 0,
    cashReceived: 0,
    cashPaid: 0,
    totalExpenses: 0,
    totalSupplierExpenseDeductions: 0,
    totalExpenseDeductions: 0,
    netProfit: 0,
    totalReceivables: 0,
    totalPayables: 0
  };

  // Calculate supplier expense deductions strictly from supplier lots (excluding Mandi shop operational expenses)
  const calculatedSupplierExpenseDeductions = (fSummary.totalSupplierExpenseDeductions !== undefined && fSummary.totalSupplierExpenseDeductions !== null)
    ? fSummary.totalSupplierExpenseDeductions
    : (stockEntries || []).reduce((sum, entry) => {
        let lotTotalExp = 0;
        if (entry.lotExpenses && typeof entry.lotExpenses === 'object') {
          lotTotalExp += Object.values(entry.lotExpenses).reduce((s, v) => {
            const num = Number(v);
            return s + (!isNaN(num) && num > 0 ? num : 0);
          }, 0);
        }
        // Include Market / Sarkari Fee
        const mktRate = Number(entry.marketFeeRate || entry.marketFeePercentage || 0);
        if (entry.marketFeeAmount) {
          lotTotalExp += Number(entry.marketFeeAmount);
        } else if (mktRate > 0) {
          const entryGross = Number(entry.totalAmount) || 0;
          lotTotalExp += Math.round((entryGross * (mktRate / 100)) * 100) / 100;
        }
        return sum + lotTotalExp;
      }, 0);

  const summary = {
    totalPurchasedAmount: fSummary.totalPurchases,
    totalSoldAmount: fSummary.totalSales,
    totalProfit: fSummary.netProfit,
    totalReceivable: fSummary.totalReceivables,
    totalPayable: fSummary.totalPayables,
    totalSupplierExpenseDeductions: calculatedSupplierExpenseDeductions
  };

  // Prepare chart data
  const saleChartData = reportsData?.analytics?.salesAndCommissionTimeSeries?.length > 0
    ? reportsData.analytics.salesAndCommissionTimeSeries.map(item => ({
        name: item.date,
        Sales: item.sales || 0,
        "Supplier Commission": item.supplierCommission !== undefined ? item.supplierCommission : 0,
        "Buyer Commission": item.customerCommission !== undefined ? item.customerCommission : (item.commission || 0),
        "Total Commission": item.commission !== undefined ? item.commission : ((item.customerCommission || 0) + (item.supplierCommission || 0))
      }))
    : [
        {
          name: 'Overall Ledger',
          Sales: fSummary.totalSales || summary.totalSoldAmount || 0,
          "Supplier Commission": fSummary.totalSupplierCommission || 0,
          "Buyer Commission": fSummary.totalCustomerCommission || 0,
          "Total Commission": fSummary.totalCommissionEarned || summary.totalProfit || 0
        }
      ];

  const safeProducts = Array.isArray(products) ? products : [];

  const stockChartData = safeProducts.slice(0, 5).map(p => ({
    name: p.name,
    Stock: p.currentQuantity
  }));

  const receivablesPayablesData = [
    { name: 'Total Receivables', value: summary.totalReceivable },
    { name: 'Total Payables', value: summary.totalPayable },
  ];

  const COLORS = ['#4F46E5', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6'];

  // Universal Filtering Utility
  const filterAndPaginate = (list) => {
    let filtered = Array.isArray(list) ? list : [];

    // Search bar filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(term)
        ) ||
        (item.lotNumber && String(item.lotNumber).toLowerCase().includes(term)) ||
        (item.vehicleNumber && String(item.vehicleNumber).toLowerCase().includes(term))
      );
    }

    // Specific filters (only apply on tabs that use product/supplier/customer/date filters)
    if (tab !== 'deleted_users' && tab !== 'clerks' && tab !== 'employees' && tab !== 'suppliers' && tab !== 'customers' && tab !== 'pay_or_receive') {
      if (filterProduct) {
        filtered = filtered.filter(item => item.productId === filterProduct || item.productName?.toLowerCase().includes(filterProduct.toLowerCase()));
      }
      if (filterSupplier) {
        filtered = filtered.filter(item => item.supplierId === filterSupplier || item.supplierName?.toLowerCase().includes(filterSupplier.toLowerCase()));
      }
      if (filterCustomer) {
        filtered = filtered.filter(item => item.customerId === filterCustomer || item.customerName?.toLowerCase().includes(filterCustomer.toLowerCase()));
      }
      if (filterDate) {
        filtered = filtered.filter(item => item.date === filterDate);
      }
      if (tab === 'stock' && filterStockStatus) {
        filtered = filtered.filter(item => item.status === filterStockStatus);
      }
    }

    // Pagination bounds
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIdx, startIdx + itemsPerPage);

    return { paginated, totalPages, totalItems };
  };

  // Loading Screen
  if (loading && !reportsData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400">{t("Loading Brokerage Dashboard...")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center space-x-3 px-5 py-3.5 rounded-2xl shadow-xl transition-all border
          ${toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-[#4F46E5]/10 border-[#4F46E5]/20 text-[#4F46E5] dark:text-indigo-400'}`}>
          <CheckCircle2 size={18} />
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* ----------------- TAB: HOME ----------------- */}
      {tab === 'home' && (
        <HomeTab setCurrentTab={setCurrentTab} />
      )}

      {/* ----------------- TAB: TRUCK LOGS & LOGISTICS ----------------- */}
      {tab === 'logistics' && (
        <TruckLogsAndLogistics suppliers={suppliers} showToast={showToast} />
      )}

      {/* ----------------- TAB: EMPLOYEES ----------------- */}
      {tab === 'employees' && (
        <EmployeeManagement />
      )}

      {/* ----------------- TAB: DASHBOARD ----------------- */}
      {tab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Global Dashboard Filters */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="flex items-center space-x-2">
                <Filter className="text-[#4F46E5] dark:text-indigo-400 shrink-0" size={18} />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Global Dashboard Analytical Filters</h4>
              </div>
              <button 
                onClick={() => {
                  resetGlobalDashboardFilters();
                  showToast('All dashboard filters cleared!', 'info');
                }}
                className="text-[10px] text-rose-500 font-bold hover:underline uppercase transition-all"
              >
                Clear All Filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
              
              {/* Date Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500 dark:text-slate-400 block">Date Filter Period</label>
                <select 
                  value={pendingReportType}
                  onChange={(e) => setPendingReportType(e.target.value)}
                  className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                >
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                  <option value="This Year">This Year</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>
 
              {/* Product Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500 dark:text-slate-400 block">Mandi Fruit Item</label>
                <select 
                  value={pendingFilterProduct}
                  onChange={(e) => setPendingFilterProduct(e.target.value)}
                  className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                >
                  <option value="">-- All Fruits / Products --</option>
                  {safeProducts.map(p => (
                    <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
 
              {/* Grower / Supplier Filter with Auto-opening Searchable Combobox */}
              <div className="space-y-1 relative" ref={supplierComboboxRef}>
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-500 dark:text-slate-400 block">Grower / Supplier</label>
                  {pendingFilterSupplier && (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Selected
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  <input
                    type="text"
                    placeholder="Search grower / supplier..."
                    value={supplierSearchQuery}
                    onFocus={() => setIsSupplierDropdownOpen(true)}
                    onChange={(e) => {
                      setSupplierSearchQuery(e.target.value);
                      setIsSupplierDropdownOpen(true);
                      if (!e.target.value.trim() && pendingFilterSupplier) {
                        setPendingFilterSupplier('');
                      }
                    }}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                  />
                  {supplierSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSupplierSearchQuery('');
                        setPendingFilterSupplier('');
                        setIsSupplierDropdownOpen(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 p-0.5 rounded-md cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md cursor-pointer"
                    >
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${isSupplierDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {/* Auto-visible Dropdown Menu */}
                {isSupplierDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 animate-fade-in">
                    <div
                      onClick={() => {
                        setPendingFilterSupplier('');
                        setSupplierSearchQuery('');
                        setIsSupplierDropdownOpen(false);
                      }}
                      className={`p-2.5 hover:bg-indigo-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors ${!pendingFilterSupplier ? 'bg-indigo-50/70 dark:bg-slate-800/90 text-[#4F46E5] font-bold' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      <div>
                        <span className="font-bold text-xs block">-- All Suppliers ({(suppliers || []).length}) --</span>
                        <span className="text-[10px] text-slate-400">Show data for all registered growers</span>
                      </div>
                      {!pendingFilterSupplier && <CheckCircle2 size={14} className="text-[#4F46E5]" />}
                    </div>

                    {(() => {
                      const filtered = (suppliers || []).filter(s => {
                        if (!supplierSearchQuery.trim()) return true;
                        const q = supplierSearchQuery.toLowerCase();
                        return (
                          (s.name && s.name.toLowerCase().includes(q)) ||
                          (s.phone && s.phone.toLowerCase().includes(q)) ||
                          (s.city && s.city.toLowerCase().includes(q))
                        );
                      });

                      if ((filtered || []).length === 0) {
                        return (
                          <div className="p-3 text-center text-xs text-slate-400 font-medium">
                            No supplier matching "{supplierSearchQuery}"
                          </div>
                        );
                      }

                      return filtered.map(s => {
                        const sId = s.id || s._id;
                        const isSelected = pendingFilterSupplier === sId;
                        return (
                          <div
                            key={sId}
                            onClick={() => {
                              setPendingFilterSupplier(sId);
                              setSupplierSearchQuery(s.name);
                              setIsSupplierDropdownOpen(false);
                            }}
                            className={`p-2.5 hover:bg-indigo-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors ${isSelected ? 'bg-indigo-50/70 dark:bg-slate-800/90 text-[#4F46E5]' : 'text-slate-700 dark:text-slate-200'}`}
                          >
                            <div>
                              <span className="font-bold text-xs block">{s.name}</span>
                              <span className="text-[10px] text-slate-400">
                                {s.phone ? `📞 ${s.phone}` : ''} {s.city ? `• 📍 ${s.city}` : ''}
                              </span>
                            </div>
                            {isSelected && <CheckCircle2 size={14} className="text-[#4F46E5]" />}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              {/* Buyer / Customer Filter with Auto-opening Searchable Combobox */}
              <div className="space-y-1 relative" ref={customerComboboxRef}>
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-500 dark:text-slate-400 block">Buyer / Customer</label>
                  {pendingFilterCustomer && (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Selected
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  <input
                    type="text"
                    placeholder="Search buyer / customer..."
                    value={customerSearchQuery}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setIsCustomerDropdownOpen(true);
                      if (!e.target.value.trim() && pendingFilterCustomer) {
                        setPendingFilterCustomer('');
                      }
                    }}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all"
                  />
                  {customerSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearchQuery('');
                        setPendingFilterCustomer('');
                        setIsCustomerDropdownOpen(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 p-0.5 rounded-md cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md cursor-pointer"
                    >
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${isCustomerDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {/* Auto-visible Dropdown Menu */}
                {isCustomerDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 animate-fade-in">
                    <div
                      onClick={() => {
                        setPendingFilterCustomer('');
                        setCustomerSearchQuery('');
                        setIsCustomerDropdownOpen(false);
                      }}
                      className={`p-2.5 hover:bg-indigo-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors ${!pendingFilterCustomer ? 'bg-indigo-50/70 dark:bg-slate-800/90 text-[#4F46E5] font-bold' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      <div>
                        <span className="font-bold text-xs block">-- All Customers ({(customers || []).length}) --</span>
                        <span className="text-[10px] text-slate-400">Show data for all registered buyers</span>
                      </div>
                      {!pendingFilterCustomer && <CheckCircle2 size={14} className="text-[#4F46E5]" />}
                    </div>

                    {(() => {
                      const filtered = (customers || []).filter(c => {
                        if (!customerSearchQuery.trim()) return true;
                        const q = customerSearchQuery.toLowerCase();
                        return (
                          (c.name && c.name.toLowerCase().includes(q)) ||
                          (c.phone && c.phone.toLowerCase().includes(q)) ||
                          (c.shopName && c.shopName.toLowerCase().includes(q)) ||
                          (c.city && c.city.toLowerCase().includes(q))
                        );
                      });

                      if ((filtered || []).length === 0) {
                        return (
                          <div className="p-3 text-center text-xs text-slate-400 font-medium">
                            No buyer matching "{customerSearchQuery}"
                          </div>
                        );
                      }

                      return filtered.map(c => {
                        const cId = c.id || c._id;
                        const isSelected = pendingFilterCustomer === cId;
                        return (
                          <div
                            key={cId}
                            onClick={() => {
                              setPendingFilterCustomer(cId);
                              setCustomerSearchQuery(c.name);
                              setIsCustomerDropdownOpen(false);
                            }}
                            className={`p-2.5 hover:bg-indigo-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors ${isSelected ? 'bg-indigo-50/70 dark:bg-slate-800/90 text-[#4F46E5]' : 'text-slate-700 dark:text-slate-200'}`}
                          >
                            <div>
                              <span className="font-bold text-xs block">{c.name}</span>
                              <span className="text-[10px] text-slate-400">
                                {c.shopName ? `🏬 ${c.shopName}` : ''} {c.phone ? `• 📞 ${c.phone}` : ''} {c.city ? `• 📍 ${c.city}` : ''}
                              </span>
                            </div>
                            {isSelected && <CheckCircle2 size={14} className="text-[#4F46E5]" />}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
 
              {/* Fruit Category Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500 dark:text-slate-400 block">Fruit Category</label>
                <select 
                  value={pendingFilterCategory}
                  onChange={(e) => setPendingFilterCategory(e.target.value)}
                  className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                >
                  <option value="">-- All Categories --</option>
                  {Array.from(new Set(safeProducts.map(p => p.category).filter(Boolean))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
 
              {/* Truck Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500 dark:text-slate-400 block">Logistics / Truck Log</label>
                <input 
                  type="text"
                  placeholder="e.g. MH-12-PQ-9999"
                  value={pendingFilterTruck}
                  onChange={(e) => setPendingFilterTruck(e.target.value)}
                  className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                />
              </div>
 
              {/* Clerk Filter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500 dark:text-slate-400 block">Mandi Operator Clerk</label>
                <select 
                  value={pendingFilterClerk}
                  onChange={(e) => setPendingFilterClerk(e.target.value)}
                  className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                >
                  <option value="">-- All Clerks --</option>
                  {clerks.map(cl => (
                    <option key={cl.id || cl._id} value={cl.id || cl._id}>{cl.name}</option>
                  ))}
                </select>
              </div>
 
              {/* Custom Date Inputs */}
              {pendingReportType === 'custom' && (
                <div className="space-y-1 sm:col-span-1">
                  <label className="font-bold text-slate-500 dark:text-slate-400 block">Custom Date Range Selection</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="date" 
                      value={pendingCustomStart} 
                      onChange={e => setPendingCustomStart(e.target.value)} 
                      className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 px-2 py-2 rounded-xl text-xs w-1/2"
                    />
                    <span className="opacity-55">to</span>
                    <input 
                      type="date" 
                      value={pendingCustomEnd} 
                      onChange={e => setPendingCustomEnd(e.target.value)} 
                      className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 px-2 py-2 rounded-xl text-xs w-1/2"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Filter Action Button */}
            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800/60">
              <button
                onClick={() => {
                  setReportType(pendingReportType);
                  setCustomStart(pendingCustomStart);
                  setCustomEnd(pendingCustomEnd);
                  setFilterProduct(pendingFilterProduct);
                  setFilterSupplier(pendingFilterSupplier);
                  setFilterCustomer(pendingFilterCustomer);
                  setFilterCategory(pendingFilterCategory);
                  setFilterTruck(pendingFilterTruck);
                  setFilterClerk(pendingFilterClerk);
                  showToast('Analytical filters applied successfully!', 'success');
                }}
                className="flex items-center space-x-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-indigo-500/10 active:scale-95"
              >
                <Filter size={14} />
                <span>APPLY FILTERS</span>
              </button>
            </div>
          </div>

          {/* Collapsible Alerts for Low Stock */}
          {safeProducts.some(p => p.currentQuantity <= 20) && (
            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300 flex items-center space-x-3">
              <ShieldAlert size={20} className="text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Low Stock Warning Alerts!</p>
                <p className="text-xs opacity-80 mt-0.5">
                  The following items are low in stock: {safeProducts.filter(p => p.currentQuantity <= 20).map(p => `${p.name} (${p.currentQuantity} left)`).join(', ')}. Please coordinate with Suppliers!
                </p>
              </div>
            </div>
          )}

          {/* Sub Navigation tabs within the Dashboard */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm">
            {[
              { id: 'finance', label: 'Financial Summary', icon: DollarSign },
              { id: 'inventory', label: 'Stock & Lot Ledger', icon: Boxes },
              { id: 'parties', label: 'Customers & Suppliers', icon: Users },
              { id: 'expenses', label: 'Operating Expenses', icon: Percent },
              { id: 'staff_payroll', label: 'Staff & Payroll', icon: Users },
              { id: 'timeline', label: 'Recent Activities Feed', icon: Activity }
            ].map(sub => {
              const IconComp = sub.icon;
              const isActive = dashboardSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setDashboardSubTab(sub.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200
                    ${isActive 
                      ? 'bg-[#4F46E5] text-white shadow-md shadow-indigo-500/15' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                >
                  <IconComp size={15} />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* SUB-TAB VIEW: FINANCIAL SUMMARY */}
          {dashboardSubTab === 'finance' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                
                {/* Total Sales */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold tracking-wider uppercase">Gross Sales Revenue</p>
                    <h3 className="text-2xl font-black mt-1 text-[#4F46E5] dark:text-indigo-400">Rs. {fSummary.totalSales.toLocaleString()}</h3>
                    <span className="text-[10px] opacity-60">Total sold stock value</span>
                  </div>
                  <div className="p-3 bg-[#4F46E5]/10 text-[#4F46E5] dark:text-indigo-400 rounded-xl">
                    <TrendingUp size={20} />
                  </div>
                </div>

                {/* Walk-In Customer Revenue */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold tracking-wider uppercase">Walk-In Customer Revenue</p>
                    <h3 className="text-2xl font-black mt-1 text-amber-500">Rs. {(fSummary.walkInRevenue || 0).toLocaleString()}</h3>
                    <span className="text-[10px] opacity-60">Total sold to walk-in buyers</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                    <ShoppingBag size={20} />
                  </div>
                </div>

                {/* Total Purchases */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold tracking-wider uppercase">Total Cost of Stock</p>
                    <h3 className="text-2xl font-black mt-1 text-rose-500">Rs. {fSummary.totalPurchases.toLocaleString()}</h3>
                    <span className="text-[10px] opacity-60">Total supplied stock value</span>
                  </div>
                  <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                    <ArrowDownRight size={20} />
                  </div>
                </div>

                {/* Net Commission */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold tracking-wider uppercase">Brokerage Commission</p>
                    <h3 className="text-2xl font-black mt-1 text-emerald-500">Rs. {(fSummary.totalCommissionEarned || (fSummary.totalCustomerCommission + fSummary.totalSupplierCommission) || 0).toLocaleString()}</h3>
                    <span className="text-[10px] opacity-60">Customer: Rs. {(fSummary.totalCustomerCommission || 0).toLocaleString()} | Supplier: Rs. {(fSummary.totalSupplierCommission || 0).toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <Percent size={20} />
                  </div>
                </div>

                {/* Cash Received */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold tracking-wider uppercase">Cash In / Collected</p>
                    <h3 className="text-2xl font-black mt-1 text-emerald-500">Rs. {fSummary.cashReceived.toLocaleString()}</h3>
                    <span className="text-[10px] opacity-60">Customer receipts collected</span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <ArrowUpRight size={20} />
                  </div>
                </div>

                {/* Cash Paid */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold tracking-wider uppercase">Cash Out / Disbursed</p>
                    <h3 className="text-2xl font-black mt-1 text-rose-500">Rs. {fSummary.cashPaid.toLocaleString()}</h3>
                    <span className="text-[10px] opacity-60">Supplier payments disbursed</span>
                  </div>
                  <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                    <ArrowDownRight size={20} />
                  </div>
                </div>

                {/* Net Profit */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold tracking-wider uppercase">Brokerage Net Profit</p>
                    <h3 className="text-2xl font-black mt-1 text-indigo-500 dark:text-indigo-400">Rs. {fSummary.netProfit.toLocaleString()}</h3>
                    <span className="text-[10px] opacity-60">Customer Comm (Rs. {(fSummary.totalCustomerCommission || 0).toLocaleString()}) + Supplier Comm - Expenses</span>
                  </div>
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-xl">
                    <DollarSign size={20} />
                  </div>
                </div>

                {/* Operating Expenses */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold tracking-wider uppercase">Mandi Expenses</p>
                    <h3 className="text-2xl font-black mt-1 text-amber-500">Rs. {fSummary.totalExpenses.toLocaleString()}</h3>
                    <span className="text-[10px] opacity-60">Labor, Transport, Loading costs</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                    <FileText size={20} />
                  </div>
                </div>

                {/* Outstanding Receivables */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold tracking-wider uppercase">Outstanding Receivables</p>
                    <h3 className="text-2xl font-black mt-1 text-[#4F46E5] dark:text-indigo-400">Rs. {fSummary.totalReceivables.toLocaleString()}</h3>
                    <span className="text-[10px] opacity-60">Due from Buyers / Customers</span>
                  </div>
                  <div className="p-3 bg-[#4F46E5]/10 text-[#4F46E5] dark:text-indigo-400 rounded-xl">
                    <ArrowUpRight size={20} />
                  </div>
                </div>

                {/* Outstanding Payables */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold tracking-wider uppercase">Outstanding Payables</p>
                    <h3 className="text-2xl font-black mt-1 text-rose-500">Rs. {fSummary.totalPayables.toLocaleString()}</h3>
                    <span className="text-[10px] opacity-60">Owed to Growers / Suppliers</span>
                  </div>
                  <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                    <ArrowDownRight size={20} />
                  </div>
                </div>

                {/* Expense Deductions (From Suppliers) */}
                <div 
                  onClick={() => openReportInNewTab('supplier-deductions')}
                  className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between cursor-pointer hover:border-orange-500/50 hover:shadow-md transition-all group"
                  title="Click to view Supplier Expense Deduction Report"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold tracking-wider uppercase">Expense Deductions</p>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">View Report ↗</span>
                    </div>
                    <h3 className="text-2xl font-black mt-1 text-orange-500 dark:text-orange-400">
                      Rs. {calculatedSupplierExpenseDeductions.toLocaleString()}
                    </h3>
                    <span className="text-[10px] opacity-60">
                      Freight, Crates, Market/Sarkari Fee & Lot Deductions
                    </span>
                  </div>
                  <div className="p-3 bg-orange-500/10 text-orange-500 dark:text-orange-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Receipt size={20} />
                  </div>
                </div>

              </div>

              {/* Financial Performance Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* sales vs commission chart */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 flex flex-col h-96 shadow-sm">
                  <h4 className="text-sm font-black uppercase tracking-wider mb-4 text-slate-700 dark:text-slate-300">Sales vs Commission Growth Ledger</h4>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={saleChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--tooltip-border)" opacity={0.6} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-color)', borderColor: 'var(--tooltip-border)', borderRadius: '12px' }} />
                        <Legend />
                        <Bar dataKey="Sales" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Supplier Commission" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Buyer Commission" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Total Commission" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* receivables vs payables pie chart */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 flex flex-col h-96 shadow-sm">
                  <h4 className="text-sm font-black uppercase tracking-wider mb-4 text-slate-700 dark:text-slate-300">Outstanding Balances Ledger</h4>
                  <div className="flex-1 min-h-0 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={receivablesPayablesData}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {receivablesPayablesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-color)', borderColor: 'var(--tooltip-border)', borderRadius: '12px' }} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Outstanding Balances Breakdown Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Customer Outstanding Receivables Table */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Customer Outstanding Balances (Top 10)</h4>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded-full uppercase">Receivables</span>
                  </div>
                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                          <th className="py-2.5 px-3">Customer Name</th>
                          <th className="py-2.5 px-3">Phone</th>
                          <th className="py-2.5 px-3 text-right">Outstanding Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                        {(reportsData?.outstandingBalances?.customerOutstandingTable || []).slice(0, 10).map((c, index) => (
                          <tr key={c.customerId || c.id || c._id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                            <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">{c.name}</td>
                            <td className="py-3 px-3 text-slate-500">{c.phone || 'N/A'}</td>
                            <td className="py-3 px-3 text-right font-black text-indigo-500 dark:text-indigo-400">Rs. {c.outstandingAmount.toLocaleString()}</td>
                          </tr>
                        ))}
                        {(reportsData?.outstandingBalances?.customerOutstandingTable || []).length === 0 && (
                          <tr>
                            <td colSpan="3" className="py-8 text-center text-slate-400 font-semibold">No outstanding receivables logs found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Supplier Payables Table */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Supplier Outstanding Payables (Top 10)</h4>
                    <span className="text-[10px] bg-rose-500/10 text-rose-400 font-bold px-2 py-0.5 rounded-full uppercase">Payables</span>
                  </div>
                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                          <th className="py-2.5 px-3">Supplier Name</th>
                          <th className="py-2.5 px-3">Phone</th>
                          <th className="py-2.5 px-3 text-right">Owed Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                        {(reportsData?.outstandingBalances?.supplierPayablesTable || []).slice(0, 10).map((s, index) => (
                          <tr key={s.supplierId || s.id || s._id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                            <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">{s.name}</td>
                            <td className="py-3 px-3 text-slate-500">{s.phone || 'N/A'}</td>
                            <td className="py-3 px-3 text-right font-black text-rose-500">Rs. {s.payableAmount.toLocaleString()}</td>
                          </tr>
                        ))}
                        {(reportsData?.outstandingBalances?.supplierPayablesTable || []).length === 0 && (
                          <tr>
                            <td colSpan="3" className="py-8 text-center text-slate-400 font-semibold">No outstanding payables logs found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>


            </div>
          )}

          {/* SUB-TAB VIEW: STOCK & LOT LEDGER */}
          {dashboardSubTab === 'inventory' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Inventory metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Total Trucks */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Trucks Received</p>
                    <h3 className="text-2xl font-black mt-1 text-sky-500">{reportsData?.stockSummary?.totalTrucksArrived || 0}</h3>
                    <span className="text-[10px] opacity-60">Arrived in chosen period</span>
                  </div>
                  <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl">
                    <Truck size={20} />
                  </div>
                </div>

                {/* Total Suppliers */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Suppliers Delivering</p>
                    <h3 className="text-2xl font-black mt-1 text-emerald-500">{reportsData?.stockSummary?.uniqueSuppliersCount || 0}</h3>
                    <span className="text-[10px] opacity-60">Active suppliers delivering</span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <Users size={20} />
                  </div>
                </div>

                {/* Total Categories */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Fruit Categories</p>
                    <h3 className="text-2xl font-black mt-1 text-amber-500">{reportsData?.stockSummary?.categoriesCount || 0}</h3>
                    <span className="text-[10px] opacity-60">Distinct category types</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                    <Layers size={20} />
                  </div>
                </div>

                {/* Total Crates Received */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Crates Received</p>
                    <h3 className="text-2xl font-black mt-1 text-indigo-500 dark:text-indigo-400">{reportsData?.stockSummary?.totalCratesReceived || 0}</h3>
                    <span className="text-[10px] opacity-60">Total volume received</span>
                  </div>
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-xl">
                    <Boxes size={20} />
                  </div>
                </div>

                {/* Total Crates Sold */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Crates Sold</p>
                    <h3 className="text-2xl font-black mt-1 text-emerald-500">{reportsData?.stockSummary?.totalCratesSold || 0}</h3>
                    <span className="text-[10px] opacity-60">Total volume sold</span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <CheckSquare size={20} />
                  </div>
                </div>

                {/* Remaining Stock */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Remaining Stock</p>
                    <h3 className="text-2xl font-black mt-1 text-blue-500">{reportsData?.stockSummary?.remainingStock || 0}</h3>
                    <span className="text-[10px] opacity-60">Current available inventory</span>
                  </div>
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                    <Boxes size={20} />
                  </div>
                </div>

                {/* Unsold Lots */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Unsold Consignment Lots</p>
                    <h3 className="text-2xl font-black mt-1 text-amber-500">{reportsData?.stockSummary?.unsoldLotsCount || 0}</h3>
                    <span className="text-[10px] opacity-60">Lots with pending balance</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                    <Tag size={20} />
                  </div>
                </div>

              </div>

              {/* Lot performance analysis panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-2xl text-xs">
                <div>
                  <span className="font-extrabold text-slate-500 uppercase block">Lots Received</span>
                  <p className="text-lg font-black mt-1 text-slate-700 dark:text-slate-200">{reportsData?.lotSummary?.lotsReceived || 0}</p>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 uppercase block">Lots Completed / Sold Out</span>
                  <p className="text-lg font-black mt-1 text-emerald-500">{reportsData?.lotSummary?.lotsSold || 0}</p>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 uppercase block">Lots Pending Balance</span>
                  <p className="text-lg font-black mt-1 text-amber-500">{reportsData?.lotSummary?.lotsPending || 0}</p>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 uppercase block">Avg. Selling Price</span>
                  <p className="text-lg font-black mt-1 text-indigo-500 dark:text-indigo-400">Rs. {reportsData?.lotSummary?.avgSellingPrice || 0}</p>
                </div>
                {reportsData?.lotSummary?.highestSellingLot && (
                  <div className="sm:col-span-2 border-t border-slate-200 dark:border-slate-800/80 pt-3">
                    <span className="font-extrabold text-slate-500 uppercase block">Highest Selling Deal / Lot</span>
                    <p className="mt-1 font-semibold text-slate-800 dark:text-slate-300">
                      Product: <span className="font-bold text-indigo-400">{reportsData.lotSummary.highestSellingLot.productName}</span> @ Rs. {reportsData.lotSummary.highestSellingLot.saleRate}
                    </p>
                  </div>
                )}
                {reportsData?.lotSummary?.lowestSellingLot && (
                  <div className="sm:col-span-2 border-t border-slate-200 dark:border-slate-800/80 pt-3">
                    <span className="font-extrabold text-slate-500 uppercase block">Lowest Selling Deal / Lot</span>
                    <p className="mt-1 font-semibold text-slate-800 dark:text-slate-300">
                      Product: <span className="font-bold text-rose-400">{reportsData.lotSummary.lowestSellingLot.productName}</span> @ Rs. {reportsData.lotSummary.lowestSellingLot.saleRate}
                    </p>
                  </div>
                )}
              </div>

              {/* Fruit summary table */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-sm">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Fruit Consignment Sales & Stock Performance Summary</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                        <th className="py-2.5 px-3">Fruit / Product Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-center">Total Received</th>
                        <th className="py-2.5 px-3 text-center">Total Sold</th>
                        <th className="py-2.5 px-3 text-center">Remaining Stock</th>
                        <th className="py-2.5 px-3 text-right">Avg Purchase Rate</th>
                        <th className="py-2.5 px-3 text-right">Avg Selling Rate</th>
                        <th className="py-2.5 px-3 text-right">Gross Dealing Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                      {(reportsData?.stockSummary?.fruitSummaryTable || []).map((fruit, index) => (
                        <tr key={fruit.productId || fruit.id || fruit._id || fruit.name || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">{fruit.name}</td>
                          <td className="py-3 px-3 text-slate-500">{fruit.category}</td>
                          <td className="py-3 px-3 text-center font-bold">{fruit.received} {fruit.unit}</td>
                          <td className="py-3 px-3 text-center text-emerald-500 font-bold">{fruit.sold} {fruit.unit}</td>
                          <td className="py-3 px-3 text-center text-blue-500 font-bold">{fruit.remaining} {fruit.unit}</td>
                          <td className="py-3 px-3 text-right text-slate-500 font-medium">Rs. {fruit.avgPurchaseRate.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right text-indigo-400 font-bold">Rs. {fruit.avgSaleRate.toLocaleString()}</td>
                          <td className={`py-3 px-3 text-right font-black ${fruit.estimatedProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            Rs. {fruit.estimatedProfit.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {(reportsData?.stockSummary?.fruitSummaryTable || []).length === 0 && (
                        <tr>
                          <td colSpan="8" className="py-8 text-center text-slate-400 font-semibold">No stock dealing logs found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* SUB-TAB VIEW: CUSTOMERS & SUPPLIERS */}
          {dashboardSubTab === 'parties' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Customer and supplier summaries */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Total Customers */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Active Customers</p>
                    <h3 className="text-2xl font-black mt-1 text-indigo-500 dark:text-indigo-400">{reportsData?.customerSummary?.totalActiveCustomers || 0}</h3>
                    <span className="text-[10px] opacity-60">Registered buyers in Mandi</span>
                  </div>
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-xl">
                    <Users size={20} />
                  </div>
                </div>

                {/* Customers purchased today */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Customers Purchased Today</p>
                    <h3 className="text-2xl font-black mt-1 text-emerald-500">{reportsData?.customerSummary?.customersPurchasedTodayCount || 0}</h3>
                    <span className="text-[10px] opacity-60">Active deal makers today</span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <UserCheck size={20} />
                  </div>
                </div>

                {/* New Customers */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">New Customer Registrations</p>
                    <h3 className="text-2xl font-black mt-1 text-sky-500">{reportsData?.customerSummary?.newCustomersCount || 0}</h3>
                    <span className="text-[10px] opacity-60">Registered in chosen period</span>
                  </div>
                  <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl">
                    <Plus size={20} />
                  </div>
                </div>

                {/* Customers with pending payments */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Buyers with Pending Due</p>
                    <h3 className="text-2xl font-black mt-1 text-rose-500">{reportsData?.customerSummary?.pendingPaymentCustomersCount || 0}</h3>
                    <span className="text-[10px] opacity-60">Have positive due balances</span>
                  </div>
                  <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                    <ArrowUpRight size={20} />
                  </div>
                </div>

                {/* Total Suppliers */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Active Suppliers</p>
                    <h3 className="text-2xl font-black mt-1 text-indigo-500 dark:text-indigo-400">{reportsData?.supplierSummary?.totalActiveSuppliers || 0}</h3>
                    <span className="text-[10px] opacity-60">Registered orchard growers</span>
                  </div>
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-xl">
                    <Users size={20} />
                  </div>
                </div>

                {/* Suppliers Delivered today */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Suppliers Delivering Today</p>
                    <h3 className="text-2xl font-black mt-1 text-emerald-500">{reportsData?.supplierSummary?.suppliersDeliveredTodayCount || 0}</h3>
                    <span className="text-[10px] opacity-60">Supplied stock logs today</span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <Truck size={20} />
                  </div>
                </div>

                {/* Suppliers awaiting payment */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Suppliers with Pending Due</p>
                    <h3 className="text-2xl font-black mt-1 text-rose-500">{reportsData?.supplierSummary?.suppliersAwaitingPaymentCount || 0}</h3>
                    <span className="text-[10px] opacity-60">Growers we owe money to</span>
                  </div>
                  <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                    <ArrowDownRight size={20} />
                  </div>
                </div>

              </div>

              {/* Top tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Top Customer Buyers */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60 pb-2">Top 10 Customers / Buyers Performance</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                          <th className="py-2.5 px-3">Buyer Name</th>
                          <th className="py-2.5 px-3 text-center">Crates Purchased</th>
                          <th className="py-2.5 px-3 text-right">Total Billing Value</th>
                          <th className="py-2.5 px-3 text-right">Current Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                        {(reportsData?.customerSummary?.topBuyersTable || []).map((buyer, index) => (
                          <tr key={buyer.customerId || buyer.id || buyer._id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                            <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">{buyer.name}</td>
                            <td className="py-3 px-3 text-center font-bold text-slate-600 dark:text-slate-300">{buyer.qty}</td>
                            <td className="py-3 px-3 text-right font-black text-indigo-500 dark:text-indigo-400">Rs. {buyer.spent.toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-medium text-slate-500">Rs. {buyer.remainingBalance.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Suppliers */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60 pb-2">Top 10 Growers / Suppliers Performance</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                          <th className="py-2.5 px-3">Supplier Name</th>
                          <th className="py-2.5 px-3 text-center">Crates Supplied</th>
                          <th className="py-2.5 px-3 text-right">Gross dealing value</th>
                          <th className="py-2.5 px-3 text-right">Our Pending Payable</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                        {(reportsData?.supplierSummary?.topSuppliersTable || []).map((sup, index) => (
                          <tr key={sup.supplierId || sup.id || sup._id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                            <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">{sup.name}</td>
                            <td className="py-3 px-3 text-center font-bold text-slate-600 dark:text-slate-300">{sup.qty}</td>
                            <td className="py-3 px-3 text-right font-black text-emerald-500">Rs. {sup.value.toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-medium text-rose-400">Rs. {sup.remainingBalance.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SUB-TAB VIEW: OPERATING EXPENSES */}
          {dashboardSubTab === 'expenses' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Expense Category Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Total Expenses Summary Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between h-44">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Total Mandi Operating Expenses</span>
                      <h3 className="text-3xl font-black mt-1 text-rose-500">Rs. {fSummary.totalExpenses.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                      <Percent size={20} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">Calculated dynamically matching global filters and time-period</p>
                </div>

                {/* Expenses Categories list breakdown */}
                <div className="md:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 space-y-3 shadow-sm h-44 overflow-y-auto">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60 pb-1.5">Expenses Category Breakdown</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {(reportsData?.expenseSummary || []).map((exp, index) => (
                      <div key={exp.category || index} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <span className="font-bold text-slate-600 dark:text-slate-300">{exp.category}</span>
                        <div className="text-right">
                          <span className="font-extrabold text-slate-800 dark:text-slate-100 block">Rs. {exp.amount.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{exp.percentage}% of total</span>
                        </div>
                      </div>
                    ))}
                    {(reportsData?.expenseSummary || []).length === 0 && (
                      <div className="col-span-2 text-center text-slate-400 py-4 font-semibold">No expenses recorded.</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Expense list logger */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Mandi Ledger - Expense Statement</h4>
                    <p className="text-xs text-slate-500">Log loading/unloading, transport, labor, and utilities costs</p>
                  </div>
                  <button 
                    onClick={() => openModal('expense', 'add')}
                    className="flex items-center space-x-2 bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-500/10"
                  >
                    <Plus size={14} />
                    <span>RECORD NEW OPERATING EXPENSE</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                        <th className="py-2.5 px-3">Expense Date</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Description / Remarks</th>
                        <th className="py-2.5 px-3 text-right">Expense Amount</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                      {expenses.map((exp) => (
                        <tr key={exp.id || exp._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">{exp.date}</td>
                          <td className="py-3 px-3 font-bold text-amber-500 uppercase">{exp.category}</td>
                          <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">{exp.description || 'N/A'}</td>
                          <td className="py-3 px-3 text-right font-black text-rose-500">Rs. {exp.amount.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button onClick={() => openModal('expense', 'edit', exp)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300">
                                <Pencil size={12} />
                              </button>
                              <button onClick={() => handleDelete('expense', exp.id || exp._id, `Expense for ${exp.category}`)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400">
                                <Trash size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {expenses.length === 0 && (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-400 font-semibold">No operational expenses recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* SUB-TAB VIEW: STAFF & PAYROLL ANALYTICS */}
          {dashboardSubTab === 'staff_payroll' && (
            <div className="space-y-6 animate-fade-in text-xs font-semibold">
              
              {/* Core analytics widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                
                {/* Total & Active Staff */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Staff Registered</span>
                    <h3 className="text-2xl font-black mt-1 text-indigo-500">{employees.length} Employees</h3>
                    <span className="text-[10px] text-emerald-500 font-bold">● {employees.filter(e => e.status === 'Active').length} Active On-Duty</span>
                  </div>
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                    <Users size={20} />
                  </div>
                </div>

                {/* Monthly Salary Payout Contract */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Active Monthly Payroll Contract</span>
                    <h3 className="text-2xl font-black mt-1 text-emerald-500">
                      Rs. {employees.filter(e => e.status === 'Active').reduce((sum, e) => sum + e.basicSalary, 0).toLocaleString()}
                    </h3>
                    <span className="text-[10px] opacity-60">Total monthly liability</span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <DollarSign size={20} />
                  </div>
                </div>

                {/* Staff Expenses Spent Overall */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Accumulated Staff Expenditure</span>
                    <h3 className="text-2xl font-black mt-1 text-rose-500">
                      Rs. {(salaries.reduce((sum, s) => sum + s.netSalary, 0) + advances.reduce((sum, a) => sum + a.amount, 0)).toLocaleString()}
                    </h3>
                    <span className="text-[10px] text-amber-500 font-bold">Includes Rs. {advances.reduce((sum, a) => sum + a.amount, 0).toLocaleString()} Disbursed Loans</span>
                  </div>
                  <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                    <Activity size={20} />
                  </div>
                </div>

              </div>

              {/* Dynamic stats for selected Month */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Real-time Monthly Audit: {new Date().toLocaleString('en-US', { month: 'long' })} {new Date().getFullYear()}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-[#4F46E5] font-black uppercase tracking-wider">Auto calculated</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-150 dark:border-slate-800/60">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">Payroll Disbursed This Month</span>
                    <span className="font-mono text-base font-black text-emerald-500 mt-1 block">
                      Rs. {salaries
                        .filter(s => s.month === new Date().toLocaleString('en-US', { month: 'long' }) && s.year === new Date().getFullYear())
                        .reduce((sum, s) => sum + s.netSalary, 0).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400">Paid out to active staff</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-150 dark:border-slate-800/60">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">Pending Salaries Due</span>
                    <span className="font-mono text-base font-black text-rose-500 mt-1 block">
                      Rs. {Math.max(0, 
                        employees.filter(e => e.status === 'Active').reduce((sum, e) => sum + e.basicSalary, 0) - 
                        salaries
                          .filter(s => s.month === new Date().toLocaleString('en-US', { month: 'long' }) && s.year === new Date().getFullYear())
                          .reduce((sum, s) => sum + s.netSalary, 0)
                      ).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400">Liability to be cleared</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-150 dark:border-slate-800/60">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">Advances Disbursed This Month</span>
                    <span className="font-mono text-base font-black text-amber-500 mt-1 block">
                      Rs. {advances
                        .filter(a => {
                          const currentYM = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
                          return a.date.startsWith(currentYM);
                        })
                        .reduce((sum, a) => sum + a.amount, 0).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400">Emergency salary advances</span>
                  </div>
                </div>
              </div>

              {/* Active staff roster quicklist */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                  Active Staff Member Directory Quicklist ({employees.filter(e => e.status === 'Active').length})
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800/60 text-[10px] font-bold text-slate-500 uppercase">
                        <th className="py-2 px-3">ID</th>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Designation</th>
                        <th className="py-2 px-3">Phone</th>
                        <th className="py-2 px-3 text-right">Contract Salary</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs font-medium">
                      {employees.filter(e => e.status === 'Active').slice(0, 5).map(emp => (
                        <tr key={emp._id || emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-500">{emp.employeeId}</td>
                          <td className="py-2.5 px-3 font-bold">{emp.name}</td>
                          <td className="py-2.5 px-3 text-slate-500">{emp.designation}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">{emp.phone}</td>
                          <td className="py-2.5 px-3 text-right font-bold font-mono">Rs. {emp.basicSalary.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 uppercase">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                      {employees.filter(e => e.status === 'Active').length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400 font-semibold">No active staff registered.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* SUB-TAB VIEW: RECENT ACTIVITIES TIMELINE */}
          {dashboardSubTab === 'timeline' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-md space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Live Mandi Brokerage Audit Activities Timeline</h4>
                <p className="text-xs text-slate-500">Chronological list of all operational, financial, and administrative activities</p>
              </div>

              <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 space-y-6">
                {(Array.isArray(reportsData?.recentActivities) ? reportsData.recentActivities : []).map((act, index) => {
                  return (
                    <div key={act.id || act._id || index} className="relative pl-6">
                      {/* Icon Bullet */}
                      <span className={`absolute -left-3.5 top-1 p-1 rounded-full text-white ring-4 ring-white dark:ring-[#1E293B]
                        ${act.type === 'arrival' ? 'bg-sky-500' : 
                          act.type === 'sale' ? 'bg-indigo-500' : 
                          act.type === 'receipt' ? 'bg-emerald-500' : 
                          act.type === 'payment' ? 'bg-rose-500' : 
                          act.type === 'expense' ? 'bg-amber-500' : 
                          'bg-slate-500'}`}>
                        {act.type === 'arrival' ? <Truck size={10} /> :
                         act.type === 'sale' ? <Percent size={10} /> :
                         act.type === 'receipt' ? <ArrowUpRight size={10} /> :
                         act.type === 'payment' ? <ArrowDownRight size={10} /> :
                         act.type === 'expense' ? <FileText size={10} /> :
                         <Activity size={10} />}
                      </span>

                      {/* Content Box */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/45 border border-slate-100 dark:border-slate-800/50">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">{act.title}</span>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center space-x-1">
                            <Clock size={10} />
                            <span>{act.date || act.timestamp?.split('T')[0]}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">{act.description}</p>
                      </div>
                    </div>
                  );
                })}
                {(!Array.isArray(reportsData?.recentActivities) || reportsData.recentActivities.length === 0) && (
                  <div className="py-12 text-center text-slate-400 font-semibold">No recent auditing events log found.</div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ----------------- TAB: CLERKS ----------------- */}
      {tab === 'clerks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider">Clerks & Operators Portfolio</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage login credentials and authorization roles for Mandi operators</p>
            </div>
            <button 
              onClick={() => openModal('clerk', 'add')}
              className="flex items-center space-x-2 bg-[#4F46E5] hover:bg-[#4F46E5] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/10"
            >
              <Plus size={16} />
              <span>ADD NEW CLERK</span>
            </button>
          </div>

          <div className="flex items-center px-4 py-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
            <Search size={18} className="text-slate-500 dark:text-slate-400 mr-3" />
            <input 
              type="text" 
              placeholder="Search operators by name, email or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-0 outline-none w-full text-sm placeholder:text-slate-500"
            />
          </div>

          {/* Clerks Table */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    <th className="py-4 px-5">Name</th>
                    <th className="py-4 px-5">Email Address</th>
                    <th className="py-4 px-5">Phone No.</th>
                    <th className="py-4 px-5">Mandi Desk Location</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-200 dark:divide-slate-800/50 text-xs">
                  {filterAndPaginate(clerks).paginated.map(clerk => (
                    <tr key={clerk.id || clerk._id} className="hover:bg-slate-800/20">
                      <td className="py-3.5 px-5 font-bold">{clerk.name}</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-700 dark:text-slate-300">{clerk.email || 'N/A'}</td>
                      <td className="py-3.5 px-5">{clerk.phone}</td>
                      <td className="py-3.5 px-5 truncate max-w-xs">{clerk.address || 'N/A'}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${clerk.status === 'Active' ? 'bg-[#4F46E5]/10 text-[#4F46E5] dark:text-indigo-400' : 'bg-rose-500/10 text-rose-500'}`}>
                          {clerk.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => openModal('clerk', 'edit', clerk)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete('clerk', clerk.id || clerk._id, clerk.name)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400">
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {filterAndPaginate(clerks).totalPages > 1 && (
              <div className="p-4 border-t border-slate-800/55 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Showing page {currentPage} of {filterAndPaginate(clerks).totalPages}</span>
                <div className="flex space-x-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-3 py-1 bg-slate-800 text-xs rounded-lg">Prev</button>
                  <button onClick={() => setCurrentPage(p => Math.min(filterAndPaginate(clerks).totalPages, p + 1))} className="px-3 py-1 bg-slate-800 text-xs rounded-lg">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB: SUPPLIERS ----------------- */}
      {tab === 'suppliers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider">Suppliers Management Center</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add agriculture suppliers, view history, ledgers and track payments</p>
            </div>
            <button 
              onClick={() => openModal('supplier', 'add')}
              className="flex items-center space-x-2 bg-[#4F46E5] hover:bg-[#4F46E5] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/10"
            >
              <Plus size={16} />
              <span>ADD NEW SUPPLIER</span>
            </button>
          </div>

          <div className="flex items-center px-4 py-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
            <Search size={18} className="text-slate-500 dark:text-slate-400 mr-3" />
            <input 
              type="text" 
              placeholder="Search agricultural suppliers by name, address or CNIC..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-0 outline-none w-full text-sm placeholder:text-slate-500"
            />
          </div>

          {/* Suppliers list */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    <th className="py-4 px-5">Supplier Name</th>
                    <th className="py-4 px-5">Phone No.</th>
                    <th className="py-4 px-5">CNIC</th>
                    <th className="py-4 px-5 text-right">Total Supplied Value</th>
                    <th className="py-4 px-5 text-right">Total Disbursed Paid</th>
                    <th className="py-4 px-5 text-right">Outstanding Balance</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-200 dark:divide-slate-800/50 text-xs">
                  {filterAndPaginate(suppliers).paginated.map(sup => (
                    <tr key={sup.id || sup._id} className="hover:bg-slate-800/20">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold block">{sup.name}</span>
                          {(sup.khataId || sup.code) && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              {sup.khataId || sup.code}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">{sup.address}</span>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-700 dark:text-slate-300">{sup.phone}</td>
                      <td className="py-3.5 px-5">{sup.cnic || 'N/A'}</td>
                      <td className="py-3.5 px-5 text-right font-semibold">Rs. {sup.totalSupplied.toLocaleString()}</td>
                      <td className="py-3.5 px-5 text-right font-semibold">Rs. {sup.totalPaid.toLocaleString()}</td>
                      <td className={`py-3.5 px-5 text-right font-black ${sup.currentBalance < 0 ? 'text-rose-400' : 'text-[#4F46E5] dark:text-indigo-400'}`}>
                        Rs. {Math.abs(sup.currentBalance).toLocaleString()} {sup.currentBalance < 0 ? '(Payable)' : '(Receivable)'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => viewLedger(sup.id || sup._id, 'Supplier', sup.name)} className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#4F46E5]/10 hover:bg-[#4F46E5]/20 text-[#4F46E5] dark:text-indigo-400 font-bold text-[10px]">
                            <Eye size={12} />
                            <span>LEDGER</span>
                          </button>
                          <button onClick={() => openModal('supplier', 'edit', sup)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300">
                            <Pencil size={14} />
                          </button>
                          {isSupplierLinked(sup) ? (
                            <button 
                              type="button"
                              onClick={() => showToast(`Cannot delete "${sup.name}": Supplier is linked to active or historical records (stock arrivals, payments, or ledger transactions).`, 'error')} 
                              title="Linked to mandi data - Deletion protected" 
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                            >
                              <Lock size={14} />
                            </button>
                          ) : (
                            <button onClick={() => handleDelete('supplier', sup.id || sup._id, sup.name)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400">
                              <Trash size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: CUSTOMERS ----------------- */}
      {tab === 'customers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider">Customers Management Center</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track mandi wholesale purchasers, outstanding balances, sales histories and payments</p>
            </div>
            <button 
              onClick={() => openModal('customer', 'add')}
              className="flex items-center space-x-2 bg-[#4F46E5] hover:bg-[#4F46E5] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/10"
            >
              <Plus size={16} />
              <span>ADD NEW CUSTOMER</span>
            </button>
          </div>

          <div className="flex items-center px-4 py-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
            <Search size={18} className="text-slate-500 dark:text-slate-400 mr-3" />
            <input 
              type="text" 
              placeholder="Search mandi retail/wholesale customers by name, phone, shop address..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-0 outline-none w-full text-sm placeholder:text-slate-500"
            />
          </div>

          {/* Customers Portfolio */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    <th className="py-4 px-5">Customer Name / Shop Address</th>
                    <th className="py-4 px-5">Phone No.</th>
                    <th className="py-4 px-5 text-right">Total Purchases Value</th>
                    <th className="py-4 px-5 text-right">Total Paid Back</th>
                    <th className="py-4 px-5 text-right">Outstanding Receivable</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-200 dark:divide-slate-800/50 text-xs">
                  {filterAndPaginate(customers).paginated.map(cust => (
                    <tr key={cust.id || cust._id} className="hover:bg-slate-800/20">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold block">{cust.name}</span>
                          {(cust.khataId || cust.code) && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              {cust.khataId || cust.code}
                            </span>
                          )}
                        </div>
                        {cust.address && <span className="text-[10px] text-slate-500 block">{cust.address}</span>}
                        {cust.referenceBy && <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold block">Ref: {cust.referenceBy}</span>}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-700 dark:text-slate-300">{cust.phone}</td>
                      <td className="py-3.5 px-5 text-right font-semibold">Rs. {cust.totalPurchases.toLocaleString()}</td>
                      <td className="py-3.5 px-5 text-right font-semibold">Rs. {cust.totalPaid.toLocaleString()}</td>
                      <td className={`py-3.5 px-5 text-right font-black ${cust.currentBalance > 0 ? 'text-rose-400' : 'text-[#4F46E5] dark:text-indigo-400'}`}>
                        Rs. {Math.abs(cust.currentBalance).toLocaleString()} {cust.currentBalance > 0 ? '(Owes Us)' : '(Credit Balance)'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => viewLedger(cust.id || cust._id, 'Customer', cust.name)} className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#4F46E5]/10 hover:bg-[#4F46E5]/20 text-[#4F46E5] dark:text-indigo-400 font-bold text-[10px]">
                            <Eye size={12} />
                            <span>LEDGER</span>
                          </button>
                          <button onClick={() => openModal('customer', 'edit', cust)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300">
                            <Pencil size={14} />
                          </button>
                          {isCustomerLinked(cust) ? (
                            <button 
                              type="button"
                              onClick={() => showToast(`Cannot delete "${cust.name}": Customer is linked to active or historical records (sales invoices, payments, or ledger transactions).`, 'error')} 
                              title="Linked to mandi data - Deletion protected" 
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                            >
                              <Lock size={14} />
                            </button>
                          ) : (
                            <button onClick={() => handleDelete('customer', cust.id || cust._id, cust.name)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400">
                              <Trash size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: PRODUCTS ----------------- */}
      {tab === 'products' && (
        <ProductCatalog
          products={products}
          unitsList={unitsList}
          onRefresh={fetchData}
          showToast={showToast}
          role="Admin"
        />
      )}

      {/* ----------------- TAB: STOCK ----------------- */}
      {tab === 'stock' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider">Supplies Inventory Log (Purchase)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Record and track consignment lots, produce arrivals, sales dispatches, and customer returns restocked into inventory</p>
            </div>
            <button 
              onClick={() => openModal('stock', 'add')}
              className="flex items-center space-x-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
            >
              <Plus size={16} />
              <span>RECORD NEW STOCK ARRIVAL</span>
            </button>
          </div>

          {/* Top Summary Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Lots</div>
              <div className="text-lg font-black text-slate-800 dark:text-white mt-1">{stockSummary.totalLots}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Consignments</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Arrived Stock</div>
              <div className="text-lg font-black text-indigo-500 dark:text-indigo-400 mt-1">{stockSummary.totalArrived.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Total received</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Gross Sold</div>
              <div className="text-lg font-black text-blue-500 dark:text-blue-400 mt-1">{stockSummary.totalSold.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Sales tickets</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-amber-200/50 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/10 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400 flex items-center gap-1">
                <RotateCcw size={11} />
                <span>Returned Qty</span>
              </div>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">{stockSummary.totalReturned.toLocaleString()}</div>
              <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">Restocked</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-emerald-200/50 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">Remaining Stock</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{stockSummary.totalRemaining.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">In warehouse</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Total Value</div>
              <div className="text-lg font-black text-rose-500 dark:text-rose-400 mt-1">Rs. {stockSummary.totalCreditedAmount.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Net turnover</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="flex items-center px-4 py-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80">
              <Search size={16} className="text-slate-500 dark:text-slate-400 mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Search by Lot #, supplier, produce..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent border-0 outline-none text-xs w-full placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center px-4 py-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80">
              <Filter size={16} className="text-slate-500 dark:text-slate-400 mr-2 shrink-0" />
              <select 
                value={filterSupplier} 
                onChange={e => setFilterSupplier(e.target.value)}
                className="bg-transparent border-0 outline-none text-xs w-full"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
              </select>
            </div>

            <div className="flex items-center px-4 py-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80">
              <Tag size={16} className="text-slate-500 dark:text-slate-400 mr-2 shrink-0" />
              <select 
                value={filterProduct} 
                onChange={e => setFilterProduct(e.target.value)}
                className="bg-transparent border-0 outline-none text-xs w-full"
              >
                <option value="">All Products</option>
                {safeProducts.map(p => <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>)}
              </select>
            </div>

            <div className="flex items-center px-4 py-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80">
              <Activity size={16} className="text-slate-500 dark:text-slate-400 mr-2 shrink-0" />
              <select 
                value={filterStockStatus} 
                onChange={e => setFilterStockStatus(e.target.value)}
                className="bg-transparent border-0 outline-none text-xs w-full"
              >
                <option value="">All Statuses</option>
                <option value="In-Stock">In-Stock (Available)</option>
                <option value="Partially Sold">Partially Sold</option>
                <option value="Depleted">Depleted (Zero Balance)</option>
              </select>
            </div>

            <div className="flex items-center px-4 py-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80">
              <Calendar size={16} className="text-slate-500 dark:text-slate-400 mr-2 shrink-0" />
              <input 
                type="date" 
                value={filterDate} 
                onChange={e => setFilterDate(e.target.value)}
                className="bg-transparent border-0 outline-none text-xs w-full"
              />
            </div>
          </div>

          {/* Stock Log Table */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/40">
                    <th className="py-4 px-5">Lot # & Date</th>
                    <th className="py-4 px-5">Supplier / Grower</th>
                    <th className="py-4 px-5">Commodity</th>
                    <th className="py-4 px-5 text-right">Arrived Qty</th>
                    <th className="py-4 px-5 text-right">Sold Qty</th>
                    <th className="py-4 px-5 text-right">Returned Qty</th>
                    <th className="py-4 px-5 text-right">Remaining Qty</th>
                    <th className="py-4 px-5 text-right">Avg Realized Rate</th>
                    <th className="py-4 px-5 text-right">Total Credited</th>
                    <th className="py-4 px-5 text-center">Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                  {(() => {
                    const { paginated, totalPages } = filterAndPaginate(enrichedStockEntries);
                    if (paginated.length === 0) {
                      return (
                        <tr>
                          <td colSpan={11} className="py-12 text-center text-slate-400">
                            No stock arrival supplies found matching current filters.
                          </td>
                        </tr>
                      );
                    }
                    return paginated.map(entry => {
                      const hasReturns = (entry.returnedProduceQty || 0) > 0;
                      return (
                        <tr key={entry.id || entry._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded text-[11px] border border-indigo-200/40 dark:border-indigo-800/40">
                                #{entry.lotNumber}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{entry.date}</div>
                            {entry.vehicleNumber && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Truck size={10} />
                                <span>{entry.vehicleNumber}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="font-bold text-slate-900 dark:text-white">{entry.supplierName}</div>
                            {entry.supplierPhone && <div className="text-[11px] text-slate-400">{entry.supplierPhone}</div>}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{entry.productName}</div>
                            <span className="inline-block text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 mt-0.5">
                              {entry.unit || 'Crates'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                            {entry.arrivedQty} <span className="text-[10px] font-normal text-slate-400">{entry.unit || 'Crates'}</span>
                          </td>
                          <td className="py-3.5 px-5 text-right font-semibold text-blue-600 dark:text-blue-400">
                            {entry.soldQty} <span className="text-[10px] font-normal text-slate-400">{entry.unit || 'Crates'}</span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            {hasReturns ? (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded text-xs border border-amber-200/50 dark:border-amber-800/40">
                                <RotateCcw size={10} />
                                {entry.returnedProduceQty} {entry.unit || 'Crates'}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            {entry.remainingQty} <span className="text-[10px] font-normal text-slate-400">{entry.unit || 'Crates'}</span>
                          </td>
                          <td className="py-3.5 px-5 text-right font-semibold text-slate-700 dark:text-slate-300">
                            Rs. {entry.avgRate || 0}
                          </td>
                          <td className="py-3.5 px-5 text-right font-black text-rose-600 dark:text-rose-400">
                            Rs. {(entry.totalAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              entry.status === 'Depleted'
                                ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                : entry.status === 'Partially Sold'
                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-800/40'
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/40'
                            }`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button 
                                onClick={() => openModal('stock', 'edit', entry)} 
                                title="Edit Lot Arrival"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                              >
                                <Pencil size={13} />
                              </button>
                              <button 
                                onClick={() => handleDelete('stock', entry.id || entry._id, `Lot #${entry.lotNumber} (${entry.arrivedQty} ${entry.unit || 'units'} of ${entry.productName})`)} 
                                title="Delete Lot Arrival"
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 transition-colors cursor-pointer"
                              >
                                <Trash size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {(() => {
              const { totalPages, totalItems } = filterAndPaginate(enrichedStockEntries);
              if (totalPages <= 1) return null;
              return (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-xs">
                  <div className="text-slate-500 dark:text-slate-400">
                    Showing Page <span className="font-bold text-slate-800 dark:text-white">{currentPage}</span> of <span className="font-bold text-slate-800 dark:text-white">{totalPages}</span> ({totalItems} total supply lots)
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 font-medium hover:bg-slate-50 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 font-medium hover:bg-slate-50 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ----------------- TAB: SALES ----------------- */}
      {tab === 'sales' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider">Mandi Commission Brokerage Sales Ledger</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage and record sales made to market retail and wholesale buyers</p>
            </div>
            <button 
              onClick={() => openModal('sale', 'add')}
              className="flex items-center space-x-2 bg-[#4F46E5] hover:bg-[#4F46E5] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/10"
            >
              <Plus size={16} />
              <span>RECORD NEW SALES VOUCHER</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center px-4 py-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
              <Search size={16} className="text-slate-500 dark:text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search sales ledger..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent border-0 outline-none text-xs w-full placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center px-4 py-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
              <Filter size={16} className="text-slate-500 dark:text-slate-400 mr-2" />
              <select 
                value={filterCustomer} 
                onChange={e => setFilterCustomer(e.target.value)}
                className="bg-transparent border-0 outline-none text-xs w-full"
              >
                <option value="">All Customers</option>
                {customers.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex items-center px-4 py-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
              <Calendar size={16} className="text-slate-500 dark:text-slate-400 mr-2" />
              <input 
                type="date" 
                value={filterDate} 
                onChange={e => setFilterDate(e.target.value)}
                className="bg-transparent border-0 outline-none text-xs w-full"
              />
            </div>
          </div>

          {/* Sales List Table */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    <th className="py-4 px-5">Date</th>
                    <th className="py-4 px-5">Buyer Customer</th>
                    <th className="py-4 px-5">Product Name</th>
                    <th className="py-4 px-5 text-right">Quantity Sold</th>
                    <th className="py-4 px-5 text-right">Sale Rate</th>
                    <th className="py-4 px-5 text-right">Discounts</th>
                    <th className="py-4 px-5 text-right">Total Invoice Value</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-200 dark:divide-slate-800/50 text-xs">
                  {filterAndPaginate(sales).paginated.map(sale => (
                    <tr key={sale.id || sale._id} className="hover:bg-slate-800/20">
                      <td className="py-3.5 px-5 font-bold text-slate-700 dark:text-slate-300">{sale.date}</td>
                      <td className="py-3.5 px-5 font-semibold">{sale.customerName}</td>
                      <td className="py-3.5 px-5">{sale.productName}</td>
                      <td className="py-3.5 px-5 text-right font-bold text-blue-400">{sale.quantity}</td>
                      <td className="py-3.5 px-5 text-right">Rs. {sale.saleRate}</td>
                      <td className="py-3.5 px-5 text-right text-rose-400">Rs. {sale.discount || 0}</td>
                      <td className="py-3.5 px-5 text-right font-black text-[#4F46E5] dark:text-indigo-400">Rs. {sale.totalAmount.toLocaleString()}</td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Invoice Print Utility */}
                          <button 
                            onClick={() => {
                              openReportInNewTab('sale-invoice', { saleId: sale.id || sale._id });
                            }} 
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                            title="Print Invoice"
                          >
                            <Printer size={13} />
                          </button>
                          <button onClick={() => handleDelete('sale', sale.id || sale._id, `${sale.quantity} of ${sale.productName}`)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400">
                            <Trash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: RETURNS & SETTLEMENTS ----------------- */}
      {tab === 'returns' && (
        <ReturnsManagement user={user} role={user?.role || 'Admin'} />
      )}

      {/* ----------------- TAB: PAY OR RECEIVE ----------------- */}
      {tab === 'pay_or_receive' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <DollarSign className="text-[#4F46E5] dark:text-indigo-400" size={24} />
                <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">Pay or Receive Money</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Directly disburse cash or bank payments to suppliers, or collect payments from customers with instant automatic ledger balance updates.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  const activeMethod = (paymentMethods || []).find(m => m.status === 'Active' || !m.status)?.name || 'Cash';
                  setPayReceiveFormData({
                    partyType: 'Supplier',
                    partyId: '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    paymentMethod: activeMethod,
                    description: ''
                  });
                }}
                className="text-xs font-bold px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all uppercase tracking-wider flex items-center space-x-1.5"
              >
                <RotateCcw size={14} />
                <span>Reset Form</span>
              </button>
            </div>
          </div>

          {/* Financial Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
                <ArrowUpRight size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Supplier Payables</p>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Rs. {Math.abs(summary.totalPayable || 0).toLocaleString()}
                </h4>
              </div>
            </div>

            <div 
              onClick={() => openReportInNewTab('supplier-deductions')}
              className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center space-x-4 cursor-pointer hover:border-orange-500/50 hover:shadow-md transition-all group"
              title="Click to view Supplier Expense Deduction Report"
            >
              <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                <Receipt size={22} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expense Deductions</p>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">View ↗</span>
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Rs. {calculatedSupplierExpenseDeductions.toLocaleString()}
                </h4>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
                <ArrowDownLeft size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Customer Receivables</p>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Rs. {(summary.totalReceivable || 0).toLocaleString()}
                </h4>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CreditCard size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Payment Methods</p>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  {(paymentMethods || []).filter(m => m.status === 'Active' || !m.status).length || 1} Available
                </h4>
              </div>
            </div>
          </div>

          {/* Main Form & Recent Transactions Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Direct Form Card */}
            <div className="lg:col-span-7 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800/80 pb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Direct Payment / Receipt Entry</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Fill in details below to disburse cash or collect payments</p>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-[#4F46E5] dark:text-indigo-400">
                  Direct Form
                </span>
              </div>

              <PaymentForm
                formData={payReceiveFormData}
                onChange={handlePayReceiveFormChange}
                onSubmit={handlePayReceiveSubmit}
                suppliers={suppliers}
                customers={customers}
                paymentMethods={paymentMethods}
                isSubmitting={payReceiveSubmitting}
                isModal={false}
              />
            </div>

            {/* Recent Payment Logs */}
            <div className="lg:col-span-5 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Recent Payment Activity</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Latest posted receipts & disbursements</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentTab('payments')}
                  className="text-xs font-bold text-[#4F46E5] dark:text-indigo-400 hover:underline"
                >
                  View All
                </button>
              </div>

              {payments && payments.length > 0 ? (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {payments.slice(0, 7).map(p => (
                    <div key={p.id || p._id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A]/80 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{p.partyName}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${p.type === 'Paid' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            {p.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.date} • {p.paymentMethod || 'Cash'} {p.description ? `• ${p.description}` : ''}
                        </div>
                      </div>
                      <div className="text-right font-black text-sm text-slate-900 dark:text-white">
                        Rs. {Number(p.amount || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No payment transactions recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: PAYMENTS ----------------- */}
      {tab === 'payments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider">Mandi General Accounts: Cash Disbursements & Receipts</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Record payments given to suppliers or cash collected from customers</p>
            </div>
            <button 
              onClick={() => openModal('payment', 'add')}
              className="flex items-center space-x-2 bg-[#4F46E5] hover:bg-[#4F46E5] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/10"
            >
              <Plus size={16} />
              <span>RECORD NEW PAYMENT</span>
            </button>
          </div>

          <div className="flex items-center px-4 py-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
            <Search size={18} className="text-slate-500 dark:text-slate-400 mr-3" />
            <input 
              type="text" 
              placeholder="Search cashier ledger by party, type, date..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-0 outline-none w-full text-sm placeholder:text-slate-500"
            />
          </div>

          {/* Payments Table */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    <th className="py-4 px-5">Date</th>
                    <th className="py-4 px-5">Party Name</th>
                    <th className="py-4 px-5">Role Type</th>
                    <th className="py-4 px-5">Transaction Type</th>
                    <th className="py-4 px-5">Payment Method</th>
                    <th className="py-4 px-5">Description / Ref</th>
                    <th className="py-4 px-5 text-right">Amount Cash</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-200 dark:divide-slate-800/50 text-xs">
                  {filterAndPaginate(payments).paginated.map(p => (
                    <tr key={p.id || p._id} className="hover:bg-slate-800/20">
                      <td className="py-3.5 px-5 font-bold text-slate-700 dark:text-slate-300">{p.date}</td>
                      <td className="py-3.5 px-5 font-bold">{p.partyName}</td>
                      <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400">{p.partyType}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${p.type === 'Received' ? 'bg-[#4F46E5]/10 text-[#4F46E5] dark:text-indigo-400' : 'bg-rose-500/10 text-rose-500'}`}>
                          {p.type === 'Received' ? 'CASH IN (Received)' : 'CASH OUT (Disbursed)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-700 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-slate-800 text-[#4F46E5] dark:text-indigo-400 font-bold text-[11px]">
                          💳 {p.paymentMethod || 'Cash'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 italic text-slate-500 dark:text-slate-400">{p.description}</td>
                      <td className={`py-3.5 px-5 text-right font-black ${p.type === 'Received' ? 'text-[#4F46E5] dark:text-indigo-400' : 'text-rose-400'}`}>
                        Rs. {p.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button onClick={() => handleDelete('payment', p.id || p._id, `payment of Rs. ${p.amount}`)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400">
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: REPORTS ----------------- */}
      {tab === 'reports' && reportsData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider">Mandi Financial Ledger & Audit Statement Reports</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Analyze purchase logs, profits, and export accounting ledgers to Excel/Spreadsheet</p>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => exportToExcel(reportsData.sales, 'sales_ledger_mandi')}
                className="flex items-center space-x-2 border border-slate-200 dark:border-slate-700/60 hover:border-slate-600 bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
              >
                <FileSpreadsheet size={16} />
                <span>EXPORT SALES EXCEL</span>
              </button>
              
              <button 
                onClick={() => exportToExcel(reportsData.purchases, 'purchases_ledger_mandi')}
                className="flex items-center space-x-2 border border-slate-200 dark:border-slate-700/60 hover:border-slate-600 bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
              >
                <FileSpreadsheet size={16} />
                <span>EXPORT PURCHASES EXCEL</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics of chosen report period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Total Purchases Cost</span>
              <h4 className="text-xl font-black mt-1 text-rose-400">Rs. {summary.totalPurchasedAmount.toLocaleString()}</h4>
              <span className="text-[10px] opacity-65">Value of supplied stock received</span>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800/80 pt-4 sm:pt-0 sm:pl-6">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Total Sales Revenue</span>
              <h4 className="text-xl font-black mt-1 text-[#4F46E5] dark:text-indigo-400">Rs. {summary.totalSoldAmount.toLocaleString()}</h4>
              <span className="text-[10px] opacity-65">Gross billing value</span>
            </div>
            <div className="border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800/80 pt-4 lg:pt-0 lg:pl-6">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Net Commission from Customer</span>
              <h4 className="text-xl font-black mt-1 text-emerald-500">Rs. {(fSummary.totalCustomerCommission !== undefined ? fSummary.totalCustomerCommission : fSummary.totalCommissionEarned).toLocaleString()}</h4>
              <span className="text-[10px] opacity-65">Commission fee charged to buyer</span>
            </div>
            <div className="border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800/80 pt-4 lg:pt-0 lg:pl-6">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Net Commission Fee Deducted from Supplier</span>
              <h4 className="text-xl font-black mt-1 text-amber-500">Rs. {(fSummary.totalSupplierCommission || 0).toLocaleString()}</h4>
              <span className="text-[10px] opacity-65">Commission deducted on supplier lots</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Purchase logs */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 space-y-4">
              <h4 className="text-sm font-black uppercase tracking-wider">Purchase History Statement</h4>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
                      <th className="pb-2.5 px-2">Date</th>
                      <th className="pb-2.5 px-2">Farmer / Supplier</th>
                      <th className="pb-2.5 px-2">Produce Item</th>
                      <th className="pb-2.5 px-2 text-right">Qty</th>
                      <th className="pb-2.5 px-2 text-right">Rate</th>
                      <th className="pb-2.5 px-2 text-right">Sum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-200 dark:divide-slate-800/50">
                    {reportsData.purchases.map(p => (
                      <tr key={p.id || p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                        <td className="py-2.5 px-2 text-slate-500 dark:text-slate-400">{p.date}</td>
                        <td className="py-2.5 px-2 font-semibold">{p.supplierName}</td>
                        <td className="py-2.5 px-2">{p.productName}</td>
                        <td className="py-2.5 px-2 text-right font-bold text-slate-700 dark:text-slate-300">{p.quantity}</td>
                        <td className="py-2.5 px-2 text-right">Rs. {p.purchaseRate}</td>
                        <td className="py-2.5 px-2 text-right font-bold">Rs. {p.totalAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sales ledger */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 space-y-4">
              <h4 className="text-sm font-black uppercase tracking-wider">Sales Ledger Statement</h4>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
                      <th className="pb-2.5 px-2">Date</th>
                      <th className="pb-2.5 px-2">Buyer / Shop</th>
                      <th className="pb-2.5 px-2">Produce Item</th>
                      <th className="pb-2.5 px-2 text-right">Qty</th>
                      <th className="pb-2.5 px-2 text-right">Disc</th>
                      <th className="pb-2.5 px-2 text-right">Billing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-200 dark:divide-slate-800/50">
                    {reportsData.sales.map(s => (
                      <tr key={s.id || s._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                        <td className="py-2.5 px-2 text-slate-500 dark:text-slate-400">{s.date}</td>
                        <td className="py-2.5 px-2 font-semibold">{s.customerName}</td>
                        <td className="py-2.5 px-2">{s.productName}</td>
                        <td className="py-2.5 px-2 text-right font-bold text-slate-700 dark:text-slate-300">{s.quantity}</td>
                        <td className="py-2.5 px-2 text-right text-rose-400">Rs. {s.discount || 0}</td>
                        <td className="py-2.5 px-2 text-right font-black text-[#4F46E5] dark:text-indigo-400">Rs. {s.totalAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ----------------- TAB: AUDIT LOGS ----------------- */}
      {tab === 'audit' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider">Audit logs & System Activity Log</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Review critical bookkeeping modifications and login telemetry for transparency</p>
          </div>

          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="p-4 bg-[#F1F5F9] dark:bg-[#1e2d42] border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Telemetry History (Top 100 Logs)</span>
            </div>

            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold bg-white dark:bg-[#1E293B] sticky top-0">
                    <th className="py-3 px-5">Timestamp</th>
                    <th className="py-3 px-5">User</th>
                    <th className="py-3 px-5">Role</th>
                    <th className="py-3 px-5">Action Identifier</th>
                    <th className="py-3 px-5">Bookkeeping Modifications Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/30">
                  {auditLogs.map(log => (
                    <tr key={log.id || log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                      <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-700 dark:text-slate-300">{log.userName}</td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-500 dark:text-slate-400">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-[#4F46E5] dark:text-indigo-400 font-semibold">{log.action}</td>
                      <td className="py-3.5 px-5 italic text-slate-700 dark:text-slate-300">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: DELETED USERS / TRASH ----------------- */}
      {tab === 'deleted_users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider flex items-center space-x-2">
                <Trash2 size={20} className="text-rose-500" />
                <span>Deleted Users & Trash Bin</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">View soft-deleted user accounts (Customers, Suppliers, Clerks, Employees) and restore them anytime.</p>
            </div>
            <button 
              onClick={fetchData}
              className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
            >
              <RefreshCw size={14} />
              <span>REFRESH TRASH</span>
            </button>
          </div>

          <div className="flex items-center px-4 py-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800">
            <Search size={18} className="text-slate-500 dark:text-slate-400 mr-3" />
            <input 
              type="text" 
              placeholder="Search deleted accounts by name, user type, phone, email, or deleted by..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-0 outline-none w-full text-sm placeholder:text-slate-500"
            />
          </div>

          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    <th className="py-4 px-5">Name</th>
                    <th className="py-4 px-5">User Type</th>
                    <th className="py-4 px-5">Contact Info</th>
                    <th className="py-4 px-5">Deleted Date</th>
                    <th className="py-4 px-5">Deleted By</th>
                    <th className="py-4 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filterAndPaginate(deletedUsers).paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        No soft-deleted users found in the trash bin.
                      </td>
                    </tr>
                  ) : (
                    filterAndPaginate(deletedUsers).paginated.map(userItem => (
                      <tr key={userItem.id || userItem.entityId} className="hover:bg-slate-800/20">
                        <td className="py-3.5 px-5 font-bold">{userItem.name}</td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            userItem.userType === 'Customer' ? 'bg-blue-500/10 text-blue-500' :
                            userItem.userType === 'Supplier' ? 'bg-purple-500/10 text-purple-500' :
                            userItem.userType === 'Employee' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-indigo-500/10 text-indigo-500'
                          }`}>
                            {userItem.userType || userItem.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 space-y-0.5">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">{userItem.phone}</div>
                          {userItem.email && userItem.email !== 'N/A' && (
                            <div className="text-[11px] text-slate-400">{userItem.email}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-slate-500">
                          {userItem.deletedAt ? new Date(userItem.deletedAt).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-3.5 px-5 font-medium text-slate-600 dark:text-slate-300">
                          {userItem.deletedBy || 'Admin'}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => handleRestoreUser(userItem)}
                            className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm"
                          >
                            <RefreshCw size={13} />
                            <span>Restore</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {filterAndPaginate(deletedUsers).totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-50 font-bold"
                >
                  Previous
                </button>
                <span className="text-slate-500">
                  Page {currentPage} of {filterAndPaginate(deletedUsers).totalPages}
                </span>
                <button
                  disabled={currentPage === filterAndPaginate(deletedUsers).totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, filterAndPaginate(deletedUsers).totalPages))}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-50 font-bold"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB: RECORD BATCH SALE ----------------- */}
      {tab === 'sales_batch' && (
        <RecordBatchSale setCurrentTab={setCurrentTab} />
      )}

      {/* ----------------- TAB: SOLD CONSIGNMENTS ----------------- */}
      {tab === 'sales_sold_consignments' && (
        <SoldConsignments setCurrentTab={setCurrentTab} />
      )}

      {/* ----------------- TAB: BUSINESS PROFILE ----------------- */}
      {(tab === 'business_profile' || tab === 'business') && (
        <BusinessProfile showToast={showToast} />
      )}

      {/* ----------------- TAB: SETTINGS ----------------- */}
      {(tab === 'settings' || tab?.startsWith('settings_')) && (
        <SettingsContainer tab={tab} showToast={showToast} />
      )}

      {/* ----------------- MODALS LAYER ----------------- */}
      {modalType && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          
          {/* Clerk / User Form Modal */}
          {(modalType === 'clerk' || modalType === 'supplier' || modalType === 'customer' || modalType === 'product') && (
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 p-6 space-y-6 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 pb-4">
                <h3 className="text-base font-black uppercase tracking-wider">{modalMode === 'add' ? 'ADD' : 'EDIT'} {modalType.toUpperCase()}</h3>
                <button onClick={closeModal} className="text-slate-500 dark:text-slate-400 hover:text-white"><X size={18} /></button>
              </div>

              <DialogAlert alert={modalAlert} onDismiss={() => setModalAlert(null)} />

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Name</label>
                  <input required type="text" name="name" value={formData.name || ''} onChange={handleFormChange} className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none focus:border-[#4F46E5]" />
                </div>

                {(modalType === 'supplier' || modalType === 'customer') && (
                  <div className="space-y-1">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                      <span>Khata ID (Unique / Auto-Generated)</span>
                      <span className="text-[10px] text-emerald-500 font-semibold tracking-normal normal-case">
                        Used for login & ledgers
                      </span>
                    </label>
                    <input
                      type="text"
                      name="khataId"
                      value={formData.khataId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, khataId: e.target.value.toUpperCase() }))}
                      placeholder={modalType === 'supplier' ? 'e.g. RT-S-1' : 'e.g. RT-C-1'}
                      className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none focus:border-[#4F46E5] font-mono font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                )}

                {modalType !== 'product' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">
                          Email Address {(modalType === 'supplier' || modalType === 'customer') ? '(Optional)' : '(Login ID) *'}
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email || ''}
                          onChange={handleFormChange}
                          placeholder={(modalType === 'supplier' || modalType === 'customer') ? 'Optional email address' : 'Enter login email'}
                          className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none focus:border-[#4F46E5]"
                          {...(modalType !== 'supplier' && modalType !== 'customer' ? { required: true } : {})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">
                          Password {(modalType === 'supplier' || modalType === 'customer') ? '(Optional)' : (modalMode === 'add' ? ' *' : ' (Optional for edit)')}
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password || ''}
                          onChange={handleFormChange}
                          placeholder={modalMode === 'edit' ? 'Leave empty to keep current' : ((modalType === 'supplier' || modalType === 'customer') ? 'Optional login password' : 'Enter login password')}
                          className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none focus:border-[#4F46E5]"
                          {...(modalMode === 'add' && modalType !== 'supplier' && modalType !== 'customer' ? { required: true } : {})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Phone No.</label>
                      <input required type="text" name="phone" value={formData.phone || ''} onChange={handleFormChange} className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none focus:border-[#4F46E5]" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Address</label>
                      <input type="text" name="address" value={formData.address || ''} onChange={handleFormChange} className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none focus:border-[#4F46E5]" />
                    </div>
                  </>
                )}

                {modalType === 'supplier' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">CNIC (Optional)</label>
                      <input type="text" name="cnic" value={formData.cnic || ''} onChange={handleFormChange} placeholder="e.g. 35201-XXXXXXX-X" className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none" />
                    </div>
                    {modalMode === 'add' && (
                      <div className="space-y-1">
                        <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Opening Balance</label>
                        <input type="number" name="currentBalance" value={formData.currentBalance || ''} onChange={handleFormChange} placeholder="Use negative for our payable debt" className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none" />
                      </div>
                    )}
                  </div>
                )}

                {modalType === 'customer' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Reference By (Optional)</label>
                      <input type="text" name="referenceBy" value={formData.referenceBy || ''} onChange={handleFormChange} placeholder="e.g. Referred by Malik Shabir" className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none focus:border-[#4F46E5]" />
                    </div>
                    {modalMode === 'add' && (
                      <div className="space-y-1">
                        <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Opening Outstanding Debt Receivable</label>
                        <input type="number" name="currentBalance" value={formData.currentBalance || ''} onChange={handleFormChange} placeholder="Positive Rs. they owe us" className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none" />
                      </div>
                    )}
                  </>
                )}

                {modalType === 'product' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Category</label>
                        <select required name="category" value={formData.category || ''} onChange={handleFormChange} className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none">
                          <option value="">Select Category</option>
                          <option value="Fruits">Fruits</option>
                          <option value="Vegetables">Vegetables</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Unit</label>
                        <select required name="unit" value={formData.unit || ''} onChange={handleFormChange} className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none text-xs">
                          <option value="">Select Unit</option>
                          {unitsList.length > 0 ? (
                            unitsList.filter(u => u.status === 'Active').map(u => (
                              <option key={u.id || u._id} value={u.name}>{u.name}</option>
                            ))
                          ) : (
                            <>
                              <option value="Crate">Crate</option>
                              <option value="Box">Box</option>
                              <option value="Bag">Bag</option>
                              <option value="Kg">Kg</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Status</label>
                      <select name="status" value={formData.status || 'Active'} onChange={handleFormChange} className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </>
                )}

                {modalType === 'clerk' && (
                  <div className="space-y-1">
                    <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">Operating Desk Status</label>
                    <select name="status" value={formData.status || 'Active'} onChange={handleFormChange} className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
                  <button type="button" onClick={closeModal} className="px-5 py-3 rounded-xl hover:bg-slate-800 transition-all text-xs font-bold uppercase tracking-wider">Cancel</button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    {modalSubmitting ? (
                      <>
                        <SpokeSpinner size={16} color="#FFFFFF" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Details</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Stock Entry / Sale Entry Form Modals */}
          {modalType === 'stock' && (
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
                <h3 className="text-base font-black uppercase tracking-wider">{modalMode === 'add' ? 'RECORD' : 'EDIT'} SUPPLIER STOCK ARRIVAL</h3>
                <button onClick={closeModal} className="text-slate-500 dark:text-slate-400 hover:text-white"><X size={18} /></button>
              </div>

              <DialogAlert alert={modalAlert} onDismiss={() => setModalAlert(null)} />

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase block">Supplier / Grower</label>
                    <select required name="supplierId" value={formData.supplierId || ''} onChange={handleFormChange} className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none">
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase block">Product</label>
                    <select required name="productId" value={formData.productId || ''} onChange={handleFormChange} className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none">
                      <option value="">Select Product</option>
                      {safeProducts.map(p => <option key={p.id || p._id} value={p.id || p._id}>{p.name} ({p.unit})</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase block">Arrival Quantity</label>
                    <input required type="number" name="quantity" value={formData.quantity || ''} onChange={handleFormChange} placeholder="Enter physical units received" className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase block">Voucher Date</label>
                    <input required type="date" name="date" value={formData.date || ''} onChange={handleFormChange} className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase block">Vehicle / Truck No. (Optional)</label>
                    <input type="text" name="vehicleNumber" value={formData.vehicleNumber || ''} onChange={handleFormChange} placeholder="e.g. LES-4921" className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none uppercase font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase block">Lot Reference # (Optional)</label>
                    <input type="text" name="lotNumber" value={formData.lotNumber || ''} onChange={handleFormChange} placeholder="Auto-assigned if empty" className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none uppercase font-mono" />
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-[11px]">
                  <strong>Note:</strong> Rate will be left pending at arrival, and will be updated automatically as you make sales tickets from this lot.
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                  <button type="button" onClick={closeModal} className="px-5 py-3 rounded-xl hover:bg-slate-800 text-xs font-bold uppercase">Cancel</button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold uppercase flex items-center space-x-2 cursor-pointer"
                  >
                    {modalSubmitting ? (
                      <>
                        <SpokeSpinner size={16} color="#FFFFFF" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Arrival</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {modalType === 'sale' && (
            <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
                <h3 className="text-base font-black uppercase tracking-wider">RECORD BATCH CONSIGNMENT SALE</h3>
                <button onClick={closeModal} className="text-slate-500 dark:text-slate-400 hover:text-white"><X size={18} /></button>
              </div>

              <DialogAlert alert={modalAlert} onDismiss={() => setModalAlert(null)} />

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold uppercase block text-[10px]">Select Available Farmer Consignment</label>
                  <select 
                    required 
                    name="stockEntryId" 
                    value={formData.stockEntryId || ''} 
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        stockEntryId: selectedId,
                        date: prev.date || new Date().toISOString().split('T')[0],
                        buyers: [] // Reset buyers list
                      }));
                    }} 
                    className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none"
                  >
                    <option value="">Select active consignment</option>
                    {stockEntries
                      .filter(s => (s.remainingQuantity !== undefined ? s.remainingQuantity : s.quantity) > 0)
                      .map(s => (
                        <option key={s.id || s._id} value={s.id || s._id}>
                          {s.productName} ({(s.remainingQuantity !== undefined ? s.remainingQuantity : s.quantity)} left) - Supplier: {s.supplierName} (Arrived: {s.date})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase block text-[10px]">Set Sale Rate (Rs.)</label>
                    <input 
                      required 
                      type="number" 
                      name="saleRate" 
                      placeholder="Set flat rate for selected buyers"
                      value={formData.saleRate || ''} 
                      onChange={(e) => setFormData(prev => ({ ...prev, saleRate: e.target.value }))}
                      className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none font-bold text-sm" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 dark:text-slate-400 font-bold uppercase block text-[10px]">Booking Date</label>
                    <input 
                      required 
                      type="date" 
                      name="date" 
                      value={formData.date || ''} 
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-500 dark:text-slate-400 font-bold uppercase block text-[10px]">Select Buyers & Enter Quantities</label>
                  <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-3 bg-[#F8FAFC] dark:bg-[#0F172A]">
                    {customers.map(c => {
                      const buyerConfig = (formData.buyers || []).find(b => b.customerId === (c.id || c._id));
                      const isChecked = !!buyerConfig;
                      return (
                        <div key={c.id || c._id} className="space-y-2 border-b border-slate-100 dark:border-slate-800/40 pb-2 last:border-0 last:pb-0">
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                if (checked) {
                                  const updatedBuyers = [...(formData.buyers || []), { customerId: c.id || c._id, name: c.name, quantity: '', discount: '' }];
                                  setFormData(prev => ({ ...prev, buyers: updatedBuyers }));
                                } else {
                                  const updatedBuyers = (formData.buyers || []).filter(b => b.customerId !== (c.id || c._id));
                                  setFormData(prev => ({ ...prev, buyers: updatedBuyers }));
                                }
                              }}
                              className="rounded text-[#4F46E5] focus:ring-[#4F46E5] h-4 w-4"
                            />
                            <span className="font-bold text-slate-700 dark:text-slate-300">{c.name}</span>
                          </div>
                          {isChecked && (
                            <div className="grid grid-cols-2 gap-3 pl-6">
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase block mb-1">Quantity to Buy</span>
                                <input 
                                  required
                                  type="number" 
                                  placeholder="Qty"
                                  value={buyerConfig.quantity || ''}
                                  onChange={(e) => {
                                    const updatedBuyers = (formData.buyers || []).map(b => 
                                      b.customerId === (c.id || c._id) ? { ...b, quantity: e.target.value } : b
                                    );
                                    setFormData(prev => ({ ...prev, buyers: updatedBuyers }));
                                  }}
                                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 outline-none"
                                />
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase block mb-1">Discount (Rs.)</span>
                                <input 
                                  type="number" 
                                  placeholder="Discount"
                                  value={buyerConfig.discount || ''}
                                  onChange={(e) => {
                                    const updatedBuyers = (formData.buyers || []).map(b => 
                                      b.customerId === (c.id || c._id) ? { ...b, discount: e.target.value } : b
                                    );
                                    setFormData(prev => ({ ...prev, buyers: updatedBuyers }));
                                  }}
                                  className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {formData.stockEntryId && formData.saleRate && (formData.buyers || []).length > 0 && (
                  <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-[#4F46E5] uppercase block">Batch Sale Summary</span>
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Total Buyers Selected:</span>
                      <span>{formData.buyers.length}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Total Units Sold:</span>
                      <span>
                        {formData.buyers.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0)} units
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-black text-[#4F46E5]">
                      <span>Total Billing Amount:</span>
                      <span>
                        Rs. {formData.buyers.reduce((acc, curr) => {
                          const amt = ((Number(curr.quantity) || 0) * Number(formData.saleRate)) - (Number(curr.discount) || 0);
                          return acc + amt;
                        }, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                  <button type="button" onClick={closeModal} className="px-5 py-3 rounded-xl hover:bg-slate-800 text-xs font-bold uppercase">Cancel</button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold uppercase flex items-center space-x-2 cursor-pointer"
                  >
                    {modalSubmitting ? (
                      <>
                        <SpokeSpinner size={16} color="#FFFFFF" />
                        <span>Recording...</span>
                      </>
                    ) : (
                      <span>Record Batch Sales</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payment Recording Modal */}
          {modalType === 'payment' && (
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 p-6 space-y-6 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
                <h3 className="text-base font-black uppercase tracking-wider">RECORD DIRECT TRANSACTION PAYMENT</h3>
                <button onClick={closeModal} className="text-slate-500 dark:text-slate-400 hover:text-white"><X size={18} /></button>
              </div>

              <DialogAlert alert={modalAlert} onDismiss={() => setModalAlert(null)} />

              <PaymentForm
                formData={formData}
                onChange={handleFormChange}
                onSubmit={handleSubmit}
                suppliers={suppliers}
                customers={customers}
                paymentMethods={paymentMethods}
                isModal={true}
                onCancel={closeModal}
              />
            </div>
          )}

          {/* ADD / EDIT MANDI OPERATING EXPENSE MODAL */}
          {modalType === 'expense' && (
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 p-6 space-y-6 shadow-2xl relative">
              <button onClick={closeModal} className="absolute top-5 right-5 text-slate-500 dark:text-slate-400 hover:text-white"><X size={18} /></button>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider">{modalMode === 'add' ? 'Record Mandi Operating Expense' : 'Update Operating Expense Record'}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Log expenditures for brokerage activities and general operations</p>
              </div>

              <DialogAlert alert={modalAlert} onDismiss={() => setModalAlert(null)} />

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Expense Category</label>
                    <select required name="category" value={formData.category || ''} onChange={handleFormChange} className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none text-xs focus:border-[#4F46E5]">
                      <option value="">-- Choose Category --</option>
                      {(() => {
                        const activeSettingCats = (expenseCategories || [])
                          .filter(c => c.status === 'Active' || !c.status)
                          .map(c => c.name);
                        const defaultCats = [
                          'Labor',
                          'Transport',
                          'Loading/Unloading',
                          'Rent',
                          'Electricity',
                          'Maintenance',
                          'Miscellaneous',
                          'Salary'
                        ];
                        const allCats = Array.from(new Set([...activeSettingCats, ...defaultCats]));
                        if (formData.category && !allCats.includes(formData.category)) {
                          allCats.push(formData.category);
                        }
                        return allCats.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ));
                      })()}
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Expense Cost (Rs.)</label>
                    <input required type="number" name="amount" value={formData.amount || ''} onChange={handleFormChange} placeholder="Enter value in Rs." className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none text-xs focus:border-[#4F46E5]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Date of Expense</label>
                  <input required type="date" name="date" value={formData.date || ''} onChange={handleFormChange} className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none text-xs focus:border-[#4F46E5]" />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Description / Remarks</label>
                  <textarea name="description" value={formData.description || ''} onChange={handleFormChange} placeholder="Provide specific billing context (e.g. Labor payment for lot #34)" className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none text-xs focus:border-[#4F46E5] h-20" />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
                  <button type="button" onClick={closeModal} className="px-5 py-3 rounded-xl hover:bg-slate-800 transition-all text-xs font-bold uppercase tracking-wider">Cancel</button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    {modalSubmitting ? (
                      <>
                        <SpokeSpinner size={16} color="#FFFFFF" />
                        <span>Recording...</span>
                      </>
                    ) : (
                      <span>Record Expense</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW PARTY GENERAL LEDGER MODAL */}
          {modalType === 'view_ledger' && (
            <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 p-6 space-y-6 shadow-2xl relative flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider">General Account Statement Ledger</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Ledger details for {ledgerPartyName}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    type="button"
                    onClick={() => setLedgerSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
                  >
                    <ArrowUpDown size={13} className="text-[#4F46E5]" />
                    <span>{ledgerSortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      downloadLedgerPDF({
                        partyType: 'Ledger',
                        partyDetails: { name: ledgerPartyName || 'Party' },
                        ledgerEntries: displayLedgerHistory || []
                      });
                    }} 
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                  >
                    <Download size={13} />
                    <span>DOWNLOAD PDF</span>
                  </button>
                  <button onClick={closeModal} className="text-slate-500 dark:text-slate-400 hover:text-white"><X size={18} /></button>
                </div>
              </div>

              {/* Printable Area */}
              <div id="printable-area" className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                <div className="hidden print:block border-b-2 border-slate-300 pb-4 mb-4">
                  <h2 className="text-xl font-bold uppercase tracking-wider">Mandi Stock Brokerage Account Statement</h2>
                  <p className="text-sm">Statement Ledger for Party: <strong>{ledgerPartyName}</strong></p>
                  <p className="text-xs text-slate-500 mt-1">Generated: {new Date().toLocaleString()}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Transaction Entry / Reference Description</th>
                        <th className="py-3 px-3">Posting Type</th>
                        <th className="py-3 px-3 text-right">Debit Cash (Dr)</th>
                        <th className="py-3 px-3 text-right">Credit Cash (Cr)</th>
                        <th className="py-3 px-3 text-right">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                      {displayLedgerHistory.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-4 text-center text-slate-500 italic">No ledger transaction postings located.</td>
                        </tr>
                      ) : (
                        displayLedgerHistory.map((l, index) => (
                          <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/10">
                            <td className="py-3 px-3">{l.date}</td>
                            <td className="py-3 px-3 italic font-semibold">{l.description}</td>
                            <td className="py-3 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${l.type === 'Debit' ? 'bg-[#4F46E5]/10 text-[#4F46E5] dark:text-indigo-400' : 'bg-rose-500/10 text-rose-500'}`}>
                                {l.type}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-[#1E293B] dark:text-slate-100">
                              {l.type === 'Debit' ? `Rs. ${l.amount.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-[#1E293B] dark:text-slate-100">
                              {l.type === 'Credit' ? `Rs. ${l.amount.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-[#1E293B] dark:text-slate-100">
                              Rs. {l.balanceAfter.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
                <button onClick={closeModal} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider">Close Ledger</button>
              </div>
            </div>
          )}

          {/* INVOICE VIEWER AND PRINT MODAL */}
          {modalType === 'invoice' && selectedItem && (
            <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 p-6 space-y-6 shadow-2xl relative flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 pb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-black uppercase tracking-wider">BILLING TAX INVOICE</h3>
                  {invoiceSettings?.paperSize && (
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full font-bold">
                      Format: {invoiceSettings.paperSize}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => triggerPrint(`Invoice-${selectedItem.id || selectedItem._id}`)} className="flex items-center space-x-1 bg-[#4F46E5] hover:bg-[#4F46E5] text-white font-bold text-xs px-3 py-1.5 rounded-xl">
                    <Printer size={13} />
                    <span>PRINT</span>
                  </button>
                  <button onClick={closeModal} className="text-slate-500 dark:text-slate-400 hover:text-white"><X size={18} /></button>
                </div>
              </div>

              {/* Invoice Printable Section */}
              <div
                id="printable-area"
                className={`p-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl mx-auto shadow-sm ${
                  invoiceSettings?.paperSize === 'Thermal 3-inch'
                    ? 'w-[76mm] max-w-[320px] font-mono text-[10px] space-y-3'
                    : invoiceSettings?.paperSize === 'A5'
                    ? 'w-[148mm] max-w-md text-[11px] space-y-4'
                    : 'w-full max-w-xl space-y-6 text-xs'
                }`}
              >
                {/* Header Block */}
                <div className={`flex ${invoiceSettings?.paperSize === 'Thermal 3-inch' ? 'flex-col items-center text-center' : 'justify-between items-start'} border-b-2 border-slate-200 pb-4`}>
                  <div className={invoiceSettings?.paperSize === 'Thermal 3-inch' ? 'space-y-1' : ''}>
                    {invoiceSettings?.companyLogo ? (
                      <img
                        src={invoiceSettings.companyLogo}
                        alt="Logo"
                        className="h-10 object-contain mb-1.5"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 mb-1">
                        <img 
                          src="/mandi_logo.jpg" 
                          alt="Mandi OS Logo" 
                          referrerPolicy="no-referrer"
                          className="h-9 w-auto object-contain rounded"
                        />
                        <h2 className="text-base font-black tracking-wider uppercase text-[#4F46E5]">
                          {invoiceSettings?.header || 'Mandi OS - Sabzi & Fruit Broker'}
                        </h2>
                      </div>
                    )}
                    {!invoiceSettings?.companyLogo && invoiceSettings?.header && (
                      <h2 className="text-sm font-black tracking-wide uppercase text-slate-800">
                        {invoiceSettings.header}
                      </h2>
                    )}
                    <p className="text-[10px] text-slate-500">Shop 12, Fruit Market, Lahore, Pakistan</p>
                    <p className="text-[10px] text-slate-500">Phone: 03001234567 | NTN: 489210-9</p>
                  </div>
                  <div className={invoiceSettings?.paperSize === 'Thermal 3-inch' ? 'text-center mt-2 pt-2 border-t border-dashed border-slate-300 w-full' : 'text-right'}>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">INVOICE</h3>
                    <p className="font-bold text-[10px]">
                      No: {invoiceSettings?.invoicePrefix || 'MANDI'}-{selectedItem.id?.substring(0, 5) || selectedItem._id?.substring(0, 5)}
                    </p>
                    <p className="text-[10px] text-slate-500">Date: {selectedItem.date}</p>
                  </div>
                </div>

                {/* Client / Status Block */}
                <div className={`grid ${invoiceSettings?.paperSize === 'Thermal 3-inch' ? 'grid-cols-1 space-y-2' : 'grid-cols-2 gap-4'} py-3 border-b border-slate-200 text-[10px]`}>
                  <div>
                    <span className="text-slate-500 font-bold uppercase block text-[8px]">Billed To:</span>
                    <p className="font-black text-xs text-slate-800">{selectedItem.customerName || selectedItem.supplierName}</p>
                    <p className="text-slate-500 text-[9px]">Mandi Trade Account Client</p>
                  </div>
                  <div className={invoiceSettings?.paperSize === 'Thermal 3-inch' ? 'text-left' : 'text-right'}>
                    <span className="text-slate-500 font-bold uppercase block text-[8px]">Status:</span>
                    <span className="inline-block mt-0.5 font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px]">
                      PAID & POSTED
                    </span>
                  </div>
                </div>

                {/* Items List Table */}
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 font-bold uppercase text-slate-500 text-[8px]">
                      <th className="py-2">Item Description</th>
                      <th className="py-2 text-right">Qty</th>
                      <th className="py-2 text-right">Rate</th>
                      <th className="py-2 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-bold text-slate-800 text-[10px]">
                      <td className="py-3">{selectedItem.productName}</td>
                      <td className="py-3 text-right">
                        {selectedItem.quantity} {selectedItem.unit || 'units'}
                      </td>
                      <td className="py-3 text-right">Rs. {selectedItem.saleRate || selectedItem.purchaseRate}</td>
                      <td className="py-3 text-right">
                        Rs. {((selectedItem.quantity || 0) * (selectedItem.saleRate || selectedItem.purchaseRate || 0)).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Accounting Calculations */}
                <div className="border-t border-slate-200 pt-3 flex justify-end">
                  <div className={`${invoiceSettings?.paperSize === 'Thermal 3-inch' ? 'w-full' : 'w-1/2'} space-y-1 text-right font-bold text-[10px]`}>
                    {(() => {
                      const grossSub = selectedItem.grossSale || ((selectedItem.quantity || 0) * (selectedItem.saleRate || selectedItem.purchaseRate || 0));
                      const comm = selectedItem.commissionAmount || 0;
                      const disc = selectedItem.discount || selectedItem.discountAmount || 0;
                      const netTotal = grossSub + comm - disc;
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Gross Subtotal:</span>
                            <span>Rs. {grossSub.toLocaleString()}</span>
                          </div>
                          {comm > 0 && (
                            <div className="flex justify-between text-slate-600">
                              <span className="text-slate-500">Buyer Commission:</span>
                              <span>+ Rs. {comm.toLocaleString()}</span>
                            </div>
                          )}
                          {disc > 0 && (
                            <div className="flex justify-between text-rose-600">
                              <span>Discount Coupon:</span>
                              <span>- Rs. {disc.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-slate-300 pt-1.5 text-xs font-black text-slate-900">
                            <span>Grand Billing Total:</span>
                            <span>Rs. {netTotal.toLocaleString()}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Terms and Conditions */}
                {invoiceSettings?.termsAndConditions && (
                  <div className="border-t border-slate-200 pt-3 text-[9px] text-slate-500 text-left">
                    <span className="font-bold block uppercase text-[8px]">Terms & Conditions:</span>
                    <p className="whitespace-pre-line leading-normal text-slate-600">{invoiceSettings.termsAndConditions}</p>
                  </div>
                )}

                {/* Signature Block */}
                <div className="flex justify-between items-end pt-5 border-t border-slate-200 text-[9px]">
                  <div className="text-slate-400 text-[8px]">
                    Format: {invoiceSettings?.paperSize || 'A4 Standard'}
                  </div>
                  <div className="text-right">
                    <div className="w-24 border-b border-slate-300 mx-auto"></div>
                    <p className="text-[9px] text-slate-500 mt-1.5 font-bold">
                      {invoiceSettings?.signature || 'Authorized Signatory'}
                    </p>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="border-t border-slate-100 pt-3 text-center text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                  {invoiceSettings?.footer || 'Thank you for trading at Lahore Sabzi & Fruit Mandi!'}
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={closeModal} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold uppercase">Close Invoice</button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
