import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { exportToCSV } from '../../utils/navigation';
import { Printer, Download, Filter, Search, RefreshCw, Truck } from 'lucide-react';
import PrintReportHeader from '../common/PrintReportHeader.jsx';

export default function LogisticsReportPage() {
  const { t } = useLanguage();

  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTruckLogs();
  }, []);

  const fetchTruckLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trucks').catch(() => ({ data: [] }));
      setTrucks(res.data || []);
    } catch (err) {
      console.error('Failed to load truck logs', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered truck logs
  const filteredTrucks = trucks.filter(item => {
    if (statusFilter !== 'All' && item.status !== statusFilter) return false;
    if (startDate && item.arrivalDate < startDate) return false;
    if (endDate && item.arrivalDate > endDate) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const numMatch = item.truckNumber?.toLowerCase().includes(term);
      const driverMatch = item.driverName?.toLowerCase().includes(term);
      const transporterMatch = item.transporter?.toLowerCase().includes(term);
      const supplierMatch = item.supplierName?.toLowerCase().includes(term);
      if (!numMatch && !driverMatch && !transporterMatch && !supplierMatch) return false;
    }
    return true;
  });

  // Totals
  const totalFreight = filteredTrucks.reduce((acc, t) => acc + (t.freightAmount || 0), 0);
  const totalLabor = filteredTrucks.reduce((acc, t) => acc + (t.laborCharges || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Truck Number', 'Arrival Date', 'Driver Name', 'Transporter', 'Supplier', 'Freight Charges (Rs)', 'Labor Charges (Rs)', 'Status'];
    const rows = filteredTrucks.map(t => [
      t.truckNumber,
      t.arrivalDate || t.date || '',
      t.driverName || 'N/A',
      t.transporter || 'N/A',
      t.supplierName || 'N/A',
      t.freightAmount || 0,
      t.laborCharges || 0,
      t.status || 'Received'
    ]);
    exportToCSV('Truck_Logistics_Report', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
              Dedicated Report Page
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Logistics & Truck Freight Statement</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white mt-1">
            Truck Logs & Freight Logistics Report
          </h1>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <button
            onClick={fetchTruckLogs}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all"
            title="Refresh Logistics Data"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Printer size={14} />
            <span>Print Logistics Report</span>
          </button>
        </div>
      </div>

      {/* Printable Header */}
      <PrintReportHeader
        title="TRUCK FREIGHT LOGISTICS & UNLOADING AUDIT STATEMENT"
        period={`${startDate || 'All-Time'} to ${endDate || 'Present'}`}
        filters={[
          ...(statusFilter !== 'All' ? [{ label: 'Status', value: statusFilter }] : [])
        ]}
        summaryMetrics={[
          { label: 'Total Arrived Trucks', value: `${filteredTrucks.length} Vehicles` },
          { label: 'Total Freight Disbursed', value: `Rs. ${totalFreight.toLocaleString()}` },
          { label: 'Total Mandi Labor Paid', value: `Rs. ${totalLabor.toLocaleString()}` }
        ]}
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
        <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Arrived Trucks</span>
          <p className="text-lg font-black text-slate-900 dark:text-white">{filteredTrucks.length} Vehicles</p>
          <p className="text-[10px] text-slate-400">Truck arrivals in report view</p>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Freight Disbursed</span>
          <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">Rs. {totalFreight.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400">Sum of truck freight charges</p>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Labor / Unloading Charges</span>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">Rs. {totalLabor.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400">Sum of unloading charges</p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 print:hidden">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter size={15} className="text-[#4F46E5]" />
          <span>Logistics Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Logistics Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-bold outline-none focus:border-[#4F46E5]"
            >
              <option value="All">All Statuses</option>
              <option value="Arrived">Arrived</option>
              <option value="Unloading">Unloading</option>
              <option value="Cleared">Cleared</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-semibold outline-none focus:border-[#4F46E5]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-semibold outline-none focus:border-[#4F46E5]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Search Keywords</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Truck #, Driver, Transporter..."
                className="w-full bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 font-semibold outline-none focus:border-[#4F46E5]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Logistics Table */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Logistics Truck Movement Entries ({filteredTrucks.length})
          </h3>
          {(statusFilter !== 'All' || startDate || endDate || searchTerm) && (
            <button
              onClick={() => { setStatusFilter('All'); setStartDate(''); setEndDate(''); setSearchTerm(''); }}
              className="text-[10px] font-bold text-[#4F46E5] hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0F172A]/50 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 uppercase font-black tracking-wider">
                <th className="py-3.5 px-4">Truck Number</th>
                <th className="py-3.5 px-4">Arrival Date</th>
                <th className="py-3.5 px-4">Driver Name</th>
                <th className="py-3.5 px-4">Transporter Company</th>
                <th className="py-3.5 px-4">Supplier Name</th>
                <th className="py-3.5 px-4 text-right">Freight Charges</th>
                <th className="py-3.5 px-4 text-right">Labor Charges</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching Logistics Truck Records...
                  </td>
                </tr>
              ) : filteredTrucks.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 italic">
                    No truck logistics records found.
                  </td>
                </tr>
              ) : (
                filteredTrucks.map((t, index) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#4F46E5] dark:text-indigo-400">{t.truckNumber}</td>
                    <td className="py-3.5 px-4">{t.arrivalDate || t.date}</td>
                    <td className="py-3.5 px-4 font-bold">{t.driverName || 'N/A'}</td>
                    <td className="py-3.5 px-4">{t.transporter || 'N/A'}</td>
                    <td className="py-3.5 px-4 font-bold">{t.supplierName || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      Rs. {(t.freightAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      Rs. {(t.laborCharges || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {t.status || 'Cleared'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredTrucks.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800/90 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-[11px] text-slate-900 dark:text-white">
                  <td colSpan="5" className="py-3 px-4 font-black">TOTALS ({filteredTrucks.length} Trucks)</td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">Rs. {totalFreight.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">Rs. {totalLabor.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">-</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
