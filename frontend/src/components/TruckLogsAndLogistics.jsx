import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useConfirm } from '../context/ConfirmContext.jsx';
import DialogAlert from './common/DialogAlert.jsx';
import {
  Truck, Clock, CheckSquare, Plus, Pencil, Trash, X, Search, RefreshCw
} from 'lucide-react';
import SpokeSpinner from './common/SpokeSpinner.jsx';

export default function TruckLogsAndLogistics({ suppliers: propSuppliers = [], showToast, className = '' }) {
  const confirm = useConfirm();
  const [trucks, setTrucks] = useState([]);
  const [suppliers, setSuppliers] = useState(propSuppliers);
  const [loading, setLoading] = useState(true);
  const [truckFilter, setTruckFilter] = useState('All'); // 'All', 'Arrived', 'Waiting', 'Completed', 'Dispatched'
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalAlert, setModalAlert] = useState(null);
  const [formData, setFormData] = useState({
    truckNumber: '',
    driverName: '',
    supplierId: '',
    supplierName: '',
    quantityLoaded: '',
    status: 'Arrived',
    arrivalDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Sync suppliers from props or fetch if not provided
  useEffect(() => {
    if (propSuppliers && propSuppliers.length > 0) {
      setSuppliers(propSuppliers);
    } else {
      fetchSuppliers();
    }
  }, [propSuppliers]);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      const data = Array.isArray(res.data) ? res.data : (res.data?.suppliers || []);
      setSuppliers(data);
    } catch (err) {
      console.warn('Suppliers list fallback for truck logs:', err?.response?.data?.error || err.message);
      setSuppliers([]);
    }
  };

  const fetchTrucks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trucks');
      const data = Array.isArray(res.data) ? res.data : (res.data?.trucks || []);
      setTrucks(data);
    } catch (err) {
      console.warn('Truck logs fallback:', err?.response?.data?.error || err.message);
      setTrucks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, []);

  const notify = (msg, type = 'success') => {
    if (showToast) showToast(msg, type);
  };

  // Quick update for status directly from dropdown
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/trucks/${id}`, { status: newStatus });
      notify(`Vehicle status updated to ${newStatus}`);
      fetchTrucks();
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to update vehicle status', 'error');
    }
  };

  const openModal = (mode, truck = null) => {
    setModalMode(mode);
    setSelectedTruck(truck);
    setModalAlert(null);
    if (mode === 'edit' && truck) {
      setFormData({
        truckNumber: truck.truckNumber || '',
        driverName: truck.driverName || '',
        supplierId: truck.supplierId || '',
        supplierName: truck.supplierName || '',
        quantityLoaded: truck.quantityLoaded || '',
        status: truck.status || 'Arrived',
        arrivalDate: truck.arrivalDate || new Date().toISOString().split('T')[0],
        description: truck.description || truck.notes || ''
      });
    } else {
      setFormData({
        truckNumber: '',
        driverName: '',
        supplierId: '',
        supplierName: '',
        quantityLoaded: '',
        status: 'Arrived',
        arrivalDate: new Date().toISOString().split('T')[0],
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTruck(null);
    setModalAlert(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSupplierSelect = (e) => {
    const supId = e.target.value;
    const selectedSup = suppliers.find(s => (s.id || s._id) === supId);
    setFormData(prev => ({
      ...prev,
      supplierId: supId,
      supplierName: selectedSup ? selectedSup.name : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setModalAlert(null);
    try {
      const payload = {
        ...formData,
        arrivalDate: formData.arrivalDate || new Date().toISOString().split('T')[0]
      };

      if (modalMode === 'add') {
        await api.post('/trucks', payload);
        notify('Gate vehicle arrival logged successfully!');
      } else if (selectedTruck) {
        const id = selectedTruck.id || selectedTruck._id;
        await api.put(`/trucks/${id}`, payload);
        notify('Vehicle log updated successfully!');
      }
      closeModal();
      fetchTrucks();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to save vehicle entry';
      setModalAlert({ type: 'error', message: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, truckNumber) => {
    const confirmed = await confirm({
      title: `Delete Vehicle Log?`,
      message: `Are you sure you want to delete vehicle entry "${truckNumber}"? This action cannot be undone.`,
      confirmText: 'Delete Entry',
      type: 'danger'
    });
    if (!confirmed) {
      return;
    }
    try {
      await api.delete(`/trucks/${id}`);
      notify('Vehicle log deleted successfully.');
      fetchTrucks();
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to delete vehicle record', 'error');
    }
  };

  // Metrics computation
  const todayStr = new Date().toISOString().split('T')[0];
  const arrivedToday = trucks.filter(t => t.arrivalDate === todayStr || t.status === 'Arrived').length;
  const waitingCount = trucks.filter(t => t.status === 'Waiting').length;
  const completedCount = trucks.filter(t => t.status === 'Completed').length;
  const dispatchedCount = trucks.filter(t => t.status === 'Dispatched').length;

  // Filter & Search trucks list
  const filteredTrucks = trucks.filter(t => {
    const matchesFilter = truckFilter === 'All' || t.status === truckFilter;
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = !searchLower ||
      (t.truckNumber && t.truckNumber.toLowerCase().includes(searchLower)) ||
      (t.driverName && t.driverName.toLowerCase().includes(searchLower)) ||
      (t.supplierName && t.supplierName.toLowerCase().includes(searchLower)) ||
      (t.description && t.description.toLowerCase().includes(searchLower));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className={`space-y-6 animate-fade-in ${className}`}>
      
      {/* Truck Logs Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Arrived Today</span>
            <h3 className="text-2xl font-black mt-1 text-sky-500">{arrivedToday}</h3>
            <span className="text-[10px] opacity-60">Arrived at Mandi gates</span>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl">
            <Truck size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Awaiting Unloading</span>
            <h3 className="text-2xl font-black mt-1 text-amber-500">{waitingCount}</h3>
            <span className="text-[10px] opacity-60">Waiting inside Mandi</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Clock size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Completed Unloads</span>
            <h3 className="text-2xl font-black mt-1 text-emerald-500">{completedCount}</h3>
            <span className="text-[10px] opacity-60">All crates recorded</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckSquare size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Dispatched Empty</span>
            <h3 className="text-2xl font-black mt-1 text-slate-500">{dispatchedCount}</h3>
            <span className="text-[10px] opacity-60">Exited Mandi gates</span>
          </div>
          <div className="p-3 bg-slate-500/10 text-slate-500 rounded-xl">
            <Truck size={20} />
          </div>
        </div>
      </div>

      {/* Main Table & Filter Container */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
              <span>Gate Logistics - Active Truck Logs</span>
              {loading && <RefreshCw size={14} className="animate-spin text-indigo-500" />}
            </h4>
            <p className="text-xs text-slate-500">Track and log vehicle arrivals, waiting times, and cargo details</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="flex items-center px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <Search size={14} className="text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search truck, driver..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent border-0 outline-none text-xs text-slate-700 dark:text-slate-200 w-36 sm:w-48 placeholder-slate-400"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
              {['All', 'Arrived', 'Waiting', 'Completed', 'Dispatched'].map(st => (
                <button
                  key={st}
                  onClick={() => setTruckFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${truckFilter === st ? 'bg-[#4F46E5] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Action Button */}
            <button
              onClick={() => openModal('add')}
              className="flex items-center space-x-2 bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-500/10"
            >
              <Plus size={14} />
              <span>LOG NEW VEHICLE ARRIVAL</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                <th className="py-2.5 px-3">Arrival Date</th>
                <th className="py-2.5 px-3">Truck Number</th>
                <th className="py-2.5 px-3">Driver Name</th>
                <th className="py-2.5 px-3">Supplier Name</th>
                <th className="py-2.5 px-3">Crate Load Count</th>
                <th className="py-2.5 px-3">Cargo Description</th>
                <th className="py-2.5 px-3">Current Status</th>
                <th className="py-2.5 px-3">Update Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
              {filteredTrucks.map((t) => (
                <tr key={t.id || t._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">{t.arrivalDate}</td>
                  <td className="py-3 px-3 font-bold text-indigo-500 dark:text-indigo-400 uppercase">{t.truckNumber}</td>
                  <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-200">{t.driverName || 'N/A'}</td>
                  <td className="py-3 px-3 font-medium">{t.supplierName || 'N/A'}</td>
                  <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">{t.quantityLoaded || 0} Crates</td>
                  <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{t.description || t.notes || 'N/A'}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold 
                      ${t.status === 'Arrived' ? 'bg-sky-500/10 text-sky-400' : 
                        t.status === 'Waiting' ? 'bg-amber-500/10 text-amber-400' : 
                        t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 
                        'bg-slate-500/10 text-slate-400'}`}>
                      {t.status || 'Arrived'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <select
                      value={t.status || 'Arrived'}
                      onChange={(e) => handleStatusUpdate(t.id || t._id, e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-indigo-500 hover:border-indigo-400 transition-colors"
                    >
                      <option value="Arrived">Arrived</option>
                      <option value="Waiting">Waiting</option>
                      <option value="Completed">Completed</option>
                      <option value="Dispatched">Dispatched</option>
                    </select>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => openModal('edit', t)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                        title="Edit Vehicle Log"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id || t._id, t.truckNumber)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        title="Delete Vehicle Log"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTrucks.length === 0 && (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400 font-semibold">
                    {loading ? 'Loading vehicle logs...' : 'No vehicle logs matching chosen filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT GATE LOGISTICS VEHICLE/TRUCK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 p-6 space-y-6 shadow-2xl relative">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X size={18} />
            </button>
            
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                {modalMode === 'add' ? 'Log Gate Vehicle Entry' : 'Update Gate Vehicle Record'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Track incoming trucks, grower assignments, and crate loads
              </p>
            </div>

            <DialogAlert alert={modalAlert} onDismiss={() => setModalAlert(null)} />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                    Truck / Vehicle Number *
                  </label>
                  <input
                    required
                    type="text"
                    name="truckNumber"
                    value={formData.truckNumber || ''}
                    onChange={handleFormChange}
                    placeholder="e.g. MH-12-PQ-9999"
                    className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none text-xs focus:border-[#4F46E5] uppercase text-slate-800 dark:text-slate-100"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                    Driver Name & Phone *
                  </label>
                  <input
                    required
                    type="text"
                    name="driverName"
                    value={formData.driverName || ''}
                    onChange={handleFormChange}
                    placeholder="e.g. Driver Ramesh"
                    className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none text-xs focus:border-[#4F46E5] text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                    Assign Orchard Supplier *
                  </label>
                  <select
                    required
                    name="supplierId"
                    value={formData.supplierId || ''}
                    onChange={handleSupplierSelect}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none text-xs focus:border-[#4F46E5] text-slate-800 dark:text-slate-100"
                  >
                    <option value="">-- Choose Grower --</option>
                    {suppliers.map(s => (
                      <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                    Total Loaded Crate Count *
                  </label>
                  <input
                    required
                    type="number"
                    name="quantityLoaded"
                    value={formData.quantityLoaded || ''}
                    onChange={handleFormChange}
                    placeholder="e.g. 350"
                    className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none text-xs focus:border-[#4F46E5] text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                    Gate Status *
                  </label>
                  <select
                    required
                    name="status"
                    value={formData.status || 'Arrived'}
                    onChange={handleFormChange}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none text-xs focus:border-[#4F46E5] text-slate-800 dark:text-slate-100"
                  >
                    <option value="Arrived">Arrived</option>
                    <option value="Waiting">Waiting inside</option>
                    <option value="Completed">Completed Unloading</option>
                    <option value="Dispatched">Dispatched Empty</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                    Arrival Date *
                  </label>
                  <input
                    required
                    type="date"
                    name="arrivalDate"
                    value={formData.arrivalDate || ''}
                    onChange={handleFormChange}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none text-xs focus:border-[#4F46E5] text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
                  Cargo Fruit / Notes
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleFormChange}
                  placeholder="e.g. Kashmiri Apples Red Quality"
                  className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 outline-none text-xs focus:border-[#4F46E5] text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-indigo-500/20 flex items-center space-x-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <SpokeSpinner size={16} color="#FFFFFF" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Gate Entry</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
