import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { 
  Shield, 
  UserCheck, 
  Users, 
  BookOpen, 
  Package, 
  Banknote, 
  BarChart3, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff, 
  Sprout, 
  ShoppingBag, 
  ChevronDown, 
  ChevronUp, 
  KeyRound,
  X,
  MessageCircle
} from 'lucide-react';
import SpokeSpinner from './common/SpokeSpinner.jsx';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('Admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showDemoAccs, setShowDemoAccs] = useState(false);

  const isKhataRole = role === 'Customer' || role === 'Supplier';

  const ROLES = [
    { 
      id: 'Admin', 
      label: 'Admin', 
      urdu: 'آڑھتی / مالک', 
      sublabel: 'Shop Owner', 
      icon: Shield 
    },
    { 
      id: 'Clerk', 
      label: 'Clerk', 
      urdu: 'منشی / کیشیئر', 
      sublabel: 'Desk Operator', 
      icon: UserCheck 
    },
    { 
      id: 'Customer', 
      label: 'Customer', 
      urdu: 'خریدار کھاتہ', 
      sublabel: 'Buyer Khata', 
      icon: ShoppingBag 
    },
    { 
      id: 'Supplier', 
      label: 'Supplier', 
      urdu: 'زمیندار کھاتہ', 
      sublabel: 'Farmer Khata', 
      icon: Sprout 
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const activeRole = role;
    const result = await login(identifier.trim(), password, activeRole);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setError('');
    setRole(selectedRole);
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#1E293B] grid grid-cols-1 md:grid-cols-12 font-sans transition-colors duration-200">
      
      {/* Left Green Brand Panel (Full Height edge-to-edge) */}
      <div className="md:col-span-5 lg:col-span-5 bg-[#008717] p-8 sm:p-12 lg:p-16 text-slate-950 flex flex-col justify-between relative overflow-hidden select-none min-h-[420px] md:min-h-screen">
        
        {/* Top: Brand Header */}
        <div className="max-w-md">
          {/* Logo Badge & Brand Name */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-black/90 dark:bg-black flex items-center justify-center shadow-md">
              <Sprout className="w-6 h-6 text-[#00E528]" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-black dark:text-slate-950 tracking-tight">
              MandiOS
            </h1>
          </div>

          {/* Tagline */}
          <p className="mt-5 sm:mt-6 text-sm sm:text-base lg:text-lg font-semibold text-black/90 dark:text-slate-950 leading-snug">
            Sabzi and fruit commission trade engine
          </p>

          {/* Feature Highlights with Clean Icons */}
          <div className="mt-10 sm:mt-12 lg:mt-16 space-y-6 sm:space-y-7">
            <div className="flex items-center gap-4 text-black/90 dark:text-slate-950">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 text-black/90 dark:text-slate-950" />
              <span className="font-semibold text-sm sm:text-base lg:text-lg">Khata management</span>
            </div>

            <div className="flex items-center gap-4 text-black/90 dark:text-slate-950">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 text-black/90 dark:text-slate-950" />
              <span className="font-semibold text-sm sm:text-base lg:text-lg">Bardana tracking</span>
            </div>

            <div className="flex items-center gap-4 text-black/90 dark:text-slate-950">
              <Banknote className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 text-black/90 dark:text-slate-950" />
              <span className="font-semibold text-sm sm:text-base lg:text-lg">Peshgi advances</span>
            </div>

            <div className="flex items-center gap-4 text-black/90 dark:text-slate-950">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 text-black/90 dark:text-slate-950" />
              <span className="font-semibold text-sm sm:text-base lg:text-lg">Reports hub</span>
            </div>
          </div>
        </div>
 {/* WhatsApp Business Registration Section */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs font-semibold  dark:text-slate-300 mb-2">
              اگر کسی بزنس نے رجسٹر کروانا ہو تو یہاں کلک کریں:
            </p>
            <a
              id="whatsapp-business-register-btn"
              href="https://wa.me/923704380337?text=Assalam%20o%20Alaikum%2C%20MandiOS%20par%20apna%20business%20commission%20shop%20register%20karwana%20hai."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer no-underline group"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <span>Chat on WhatsApp </span>
            </a>
          </div>

        {/* Bottom Footer Note */}
        <div className="mt-12 pt-6 border-t border-black/10">
          <p className="text-xs sm:text-sm font-semibold text-black/80 dark:text-slate-950">
            Built for Pakistan's mandis
          </p>
        </div>
      </div>

      {/* Right Form Panel (Full Height edge-to-edge) */}
      <div className="md:col-span-7 lg:col-span-7 p-6 sm:p-10 lg:p-16 flex flex-col justify-between relative bg-white dark:bg-[#1E293B] min-h-screen overflow-y-auto">
        
        {/* Top Right Dark Mode Toggle */}
        <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-10">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 flex items-center justify-center transition-all shadow-xs cursor-pointer"
            title="Toggle dark mode"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Centered Content Container */}
        <div className="w-full max-w-lg mx-auto my-auto py-8">
          {/* Form Header */}
          <div className="mb-6 pr-12">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              Sign in
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              Welcome back to MandiOS
            </h2>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between animate-in fade-in">
              <span>⚠️ {error}</span>
              <button 
                type="button" 
                onClick={() => setError('')}
                className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            
            {/* Role Selection Group */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  Select Role / کردار منتخب کریں
                </label>

                {/* Optional Super Admin Quick Toggle */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect(role === 'super_admin' ? 'Admin' : 'super_admin')}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    role === 'super_admin'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {role === 'super_admin' ? '✓ Super Admin' : 'Super Admin?'}
                </button>
              </div>
              
              {/* 4 Direct 1-Click Role Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      id={`login-role-btn-${r.id.toLowerCase()}`}
                      onClick={() => handleRoleSelect(r.id)}
                      className={`p-3 sm:p-3.5 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-150 cursor-pointer relative ${
                        isSelected
                          ? 'bg-[#E8F8EA] dark:bg-emerald-950/60 border-[#008717] dark:border-emerald-500 text-[#008717] dark:text-emerald-300 shadow-sm ring-1 ring-[#008717]/30'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Top Icon */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${
                        isSelected 
                          ? 'bg-[#008717] text-white shadow-xs' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        <Icon size={16} />
                      </div>

                      {/* English Label */}
                      <span className="text-xs sm:text-sm font-bold tracking-tight">
                        {r.label}
                      </span>

                      {/* Urdu Subtitle */}
                      <span className={`text-[10px] mt-0.5 font-medium ${
                        isSelected ? 'text-[#008717] dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {r.urdu}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email / Khata ID Field */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {role === 'Customer' ? 'Customer Khata ID (خریدار کھاتہ نمبر)' :
                 role === 'Supplier' ? 'Supplier Khata ID (زمیندار کھاتہ نمبر)' :
                 role === 'super_admin' ? 'Super Admin Email Address' :
                 role === 'Clerk' ? 'Clerk Email Address' :
                 'Admin Email Address'}
              </label>
              <div className="relative">
                <input
                  required
                  id="login-identifier-input"
                  type={isKhataRole ? "text" : "email"}
                  value={identifier}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIdentifier(isKhataRole ? val.toUpperCase() : val);
                    if (val.trim().toLowerCase().includes('superadmin')) {
                      setRole('super_admin');
                    }
                  }}
                  placeholder={
                    role === 'Customer' ? 'e.g. SFM-C-1' :
                    role === 'Supplier' ? 'e.g. SFM-S-1' :
                    role === 'super_admin' ? 'superadmin@mandios.com' :
                    role === 'Clerk' ? 'clerk@mandi.com' :
                    'admin@mandi.com'
                  }
                  className={`w-full px-4 py-3 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008717] focus:border-[#008717] transition-all ${
                    isKhataRole ? 'font-mono font-semibold uppercase tracking-wide' : 'font-normal'
                  }`}
                />
              </div>
              {isKhataRole && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Enter your assigned Khata ID issued by your Arthi (e.g. {role === 'Customer' ? 'SFM-C-1' : 'SFM-S-1'})
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008717] focus:border-[#008717] transition-all tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs sm:text-sm font-semibold text-[#008717] hover:text-[#006e13] dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#008717] hover:bg-[#007514] active:bg-[#006612] text-white font-bold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <SpokeSpinner size={18} color="#FFFFFF" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in to MandiOS</span>
                )}
              </button>
            </div>
          </form>

          {/* Bottom Register Prompt */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              New here? <button type="button" onClick={() => setShowForgotModal(true)} className="text-slate-600 dark:text-slate-300 hover:underline font-medium cursor-pointer">Contact your arthi to get registered.</button>
            </p>
          </div>

         
          {/* Quick Demo Accs Accordion for Easy Testing */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowDemoAccs(!showDemoAccs)}
              className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer py-1"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <KeyRound size={13} className="text-[#008717] dark:text-emerald-400" />
                Demo Credentials (Click to Auto-fill)
              </span>
              {showDemoAccs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showDemoAccs && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-left animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={() => {
                    setRole('Admin');
                    setIdentifier('admin@mandi.com');
                    setPassword('admin123');
                  }}
                  className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 text-left transition-all cursor-pointer"
                >
                  <p className="font-bold text-[11px] text-emerald-700 dark:text-emerald-400">Admin</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate">admin@mandi.com</p>
                  <p className="text-[9px] text-slate-400">admin123</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('Clerk');
                    setIdentifier('clerk@mandi.com');
                    setPassword('clerk123');
                  }}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-slate-400 text-left transition-all cursor-pointer"
                >
                  <p className="font-bold text-[11px] text-slate-700 dark:text-slate-300">Clerk</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate">clerk@mandi.com</p>
                  <p className="text-[9px] text-slate-400">clerk123</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('Customer');
                    setIdentifier('SFM-C-1');
                    setPassword('customer123');
                  }}
                  className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:border-blue-400 text-left transition-all cursor-pointer"
                >
                  <p className="font-bold text-[11px] text-blue-700 dark:text-blue-400">Buyer Khata</p>
                  <p className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-300">SFM-C-1</p>
                  <p className="text-[9px] text-slate-400">customer123</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('Supplier');
                    setIdentifier('SFM-S-1');
                    setPassword('supplier123');
                  }}
                  className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 hover:border-purple-400 text-left transition-all cursor-pointer"
                >
                  <p className="font-bold text-[11px] text-purple-700 dark:text-purple-400">Supplier Khata</p>
                  <p className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-300">SFM-S-1</p>
                  <p className="text-[9px] text-slate-400">supplier123</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('super_admin');
                    setIdentifier('superadmin@mandios.com');
                    setPassword('super123');
                  }}
                  className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 text-left transition-all cursor-pointer col-span-2 sm:col-span-1"
                >
                  <p className="font-bold text-[11px] text-indigo-700 dark:text-indigo-400">Super Admin</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate">superadmin@mandios.com</p>
                  <p className="text-[9px] text-slate-400">super123</p>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:block" />
      </div>

      {/* Forgot Password / Registration Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-[#008717] dark:text-emerald-400">
                <Sprout className="w-6 h-6" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Mandi Account Assistance</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              MandiOS accounts are securely managed by your Arthi Commission Shop Administrator.
            </p>

            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                • Password Reset:
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Please contact your Mandi Admin or desk operator to generate a new PIN / password.
              </p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 pt-1">
                • New Party Registration:
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                To link your Khata as a Customer or Supplier, ask the Arthi to register your mobile number and issue your Khata ID.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="mt-5 w-full py-2.5 px-4 bg-[#008717] hover:bg-[#007514] text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
