import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import SpokeSpinner from '../common/SpokeSpinner.jsx';
import ChangePassword from './ChangePassword.jsx';

export default function BusinessProfile({ showToast }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    logo: '',
    mobileNumber: '',
    whatsAppNumber: '',
    email: '',
    address: '',
    city: '',
    country: '',
    businessCode: '',
    tenantId: '',
    currency: 'PKR',
    currencySymbol: 'Rs.',
    timeZone: 'UTC+5',
    dateFormat: 'YYYY-MM-DD'
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/business');
      if (res.data) {
        setFormData(res.data);
      }
    } catch (err) {
      showToast?.('Failed to load business profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings/business', formData);
      showToast?.('Business profile settings saved successfully!');
    } catch (err) {
      showToast?.('Failed to update business profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl animate-fade-in">
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-lg space-y-6">
        <div>
          <h3 className="text-base font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">User Account & Business Profile</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">View logged-in user details and system business profile configuration.</p>
        </div>

        {/* User Account Profile Card */}
        {user && (
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-indigo-800/40">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                <span>👤</span> Active User Profile
              </span>
              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                user.role === 'Admin' ? 'bg-rose-500/20 text-rose-500' :
                user.role === 'Clerk' ? 'bg-amber-500/20 text-amber-500' :
                user.role === 'Customer' ? 'bg-blue-500/20 text-blue-500' :
                'bg-purple-500/20 text-purple-500'
              }`}>
                Role: {user.role}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</span>
                <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">{user.name}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">System Designation</span>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{user.role} Account</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Status</span>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Active Session
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Registered Business Flat Data Card */}
        <div className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span>🏢</span> Registered Business Profile
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-1 rounded-full border border-amber-500/20">
              🔒 Registered System Data
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Business Name */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Business Name</span>
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5 truncate">{formData.businessName || 'N/A'}</p>
            </div>

            {/* Owner Name */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Owner Name</span>
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5 truncate">{formData.ownerName || 'N/A'}</p>
            </div>

            {/* Email Address */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5 truncate">{formData.email || 'N/A'}</p>
            </div>

            {/* Tenant ID */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tenant ID / Code</span>
              <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                {formData.businessCode ? `${formData.businessCode} (${formData.tenantId})` : formData.tenantId || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Editable Profile Settings */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-4">Contact & Locale Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mobile Number</label>
              <input
                type="text"
                name="mobileNumber"
                value={formData.mobileNumber || ''}
                onChange={handleChange}
                placeholder="e.g. +92 300 1234567"
                className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">WhatsApp Contact Number</label>
              <input
                type="text"
                name="whatsAppNumber"
                value={formData.whatsAppNumber || ''}
                onChange={handleChange}
                placeholder="e.g. +92 300 1234567"
                className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                placeholder="e.g. Shop 12, New Fruit Market"
                className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">City</label>
              <input
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                placeholder="e.g. Lahore"
                className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country || ''}
                onChange={handleChange}
                placeholder="e.g. Pakistan"
                className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Currency Unit</label>
              <input
                type="text"
                name="currency"
                value={formData.currency || ''}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* Currency Symbol */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Currency Symbol</label>
              <input
                type="text"
                name="currencySymbol"
                value={formData.currencySymbol || ''}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* Time Zone */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">System Time Zone</label>
              <input
                type="text"
                name="timeZone"
                value={formData.timeZone || ''}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[#4F46E5]"
              />
            </div>

            {/* Date Format */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">System Date Format</label>
              <select
                name="dateFormat"
                value={formData.dateFormat || ''}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[#4F46E5]"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              </select>
            </div>
          </div>
        </div>

        {/* Business Logo URL */}
        <div className="space-y-1.5 text-xs">
          <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Logo URL / Base64</label>
          <input
            type="text"
            name="logo"
            value={formData.logo || ''}
            onChange={handleChange}
            placeholder="e.g. https://domain.com/logo.png"
            className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[#4F46E5]"
          />
        </div>

        {user?.role === 'Admin' ? (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#4F46E5] hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <SpokeSpinner size={16} color="#FFFFFF" />
                  <span>SAVING PROFILE...</span>
                </>
              ) : (
                <span>SAVE SETTINGS</span>
              )}
            </button>
          </div>
        ) : (
          <div className="flex justify-end pt-2">
            <span className="text-xs text-slate-400 italic">
              🔒 Read-only view. Contact Admin to update business settings.
            </span>
          </div>
        )}
      </div>

      {/* Admin Security & Password Change Section */}
      <ChangePassword showToast={showToast} />
    </form>
  );
}

