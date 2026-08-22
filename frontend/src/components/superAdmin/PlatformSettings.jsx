import React, { useState, useEffect } from 'react';
import { 
  Settings, Activity, Download, Server, Database, 
  ShieldCheck, AlertCircle, Save, CheckCircle, RefreshCw, KeyRound
} from 'lucide-react';
import api from '../../utils/api.js';
import ChangePassword from '../settings/ChangePassword.jsx';

export default function PlatformSettings({ onShowToast }) {
  const [activeSubTab, setActiveSubTab] = useState('settings'); // 'settings' | 'telemetry' | 'backup' | 'password'
  const [settings, setSettings] = useState({
    platformName: 'MandiOS Cloud ERP',
    supportEmail: 'support@mandios.com',
    supportPhone: '03001234567',
    maintenanceMode: false,
    defaultTrialDays: 30,
    allowSelfRegistration: false,
  });
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchTelemetry();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/super-admin/settings');
      if (res.data) setSettings(res.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/system-health');
      if (res.data) setTelemetry(res.data);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/super-admin/settings', settings);
      if (onShowToast) onShowToast('Global settings updated successfully!', 'success');
    } catch (err) {
      if (onShowToast) onShowToast('Failed to update settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadFullBackup = () => {
    window.location.href = '/api/super-admin/backup/export-all';
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tabs */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            Platform Configuration & System Health
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control global application parameters, system telemetry, and database snapshots
          </p>
        </div>

        {/* Tab Controls */}
        <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-xl flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'settings' 
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Global Settings
          </button>
          <button
            onClick={() => setActiveSubTab('telemetry')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'telemetry' 
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            System Telemetry
          </button>
          <button
            onClick={() => setActiveSubTab('backup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'backup' 
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Database Backup
          </button>
          <button
            onClick={() => setActiveSubTab('password')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'password' 
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Change Password
          </button>
        </div>
      </div>

      {/* VIEW 1: GLOBAL SETTINGS FORM */}
      {activeSubTab === 'settings' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platformName || ''}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Support Email Address
                </label>
                <input
                  type="email"
                  value={settings.supportEmail || ''}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Support Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={settings.supportPhone || ''}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Trial Period (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.defaultTrialDays || 30}
                onChange={(e) => setSettings({ ...settings, defaultTrialDays: Number(e.target.value) })}
                className="w-full sm:w-48 px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(settings.maintenanceMode)}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Maintenance Mode</div>
                  <div className="text-[11px] text-slate-500">Only Super Admins can access the platform when enabled</div>
                </div>
              </label>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving Changes...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 2: SYSTEM TELEMETRY */}
      {activeSubTab === 'telemetry' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  System Status: {telemetry?.status || 'Operational'}
                </h3>
                <p className="text-xs text-slate-500">
                  Uptime: {telemetry?.server?.uptime || 'N/A'} • Node: {telemetry?.server?.nodeVersion}
                </p>
              </div>
            </div>
            <button
              onClick={fetchTelemetry}
              className="p-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Database Record Counts */}
          {telemetry?.counts && (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Total Database Storage Records
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {Object.entries(telemetry.counts).map(([key, val]) => (
                  <div key={key} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: DATABASE BACKUP */}
      {activeSubTab === 'backup' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Full Database Snapshot Export</h3>
              <p className="text-xs text-slate-500">Download a full JSON archive of all tenant collections and platform records.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Full Multi-Tenant Complete Backup</span>
            </div>
            <p>Includes businesses, users, stock entries, sales, invoices, ledgers, payments, expenses, trucks, and audit trails.</p>
          </div>

          <button
            onClick={handleDownloadFullBackup}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Full JSON Backup
          </button>
        </div>
      )}

      {/* VIEW 4: CHANGE PASSWORD */}
      {activeSubTab === 'password' && (
        <ChangePassword showToast={onShowToast} />
      )}
    </div>
  );
}
