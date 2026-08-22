import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

/**
 * Universal High-Fidelity Printable & On-Screen Report Header
 * Displays Business Name, Owner/Proprietor, Phone/WhatsApp, Address, Reg Code, and Report Specific Metadata.
 */
export default function PrintReportHeader({
  title,
  subtitle,
  period,
  dateRange,
  filters = [],
  summaryMetrics = [],
  customDetails = null,
  businessProfile: initialProfile = null,
  className = ''
}) {
  const [profile, setProfile] = useState(initialProfile);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      return;
    }

    let isMounted = true;
    const fetchBiz = async () => {
      try {
        const res = await api.get('/settings/business');
        if (isMounted && res.data) {
          setProfile(res.data);
        }
      } catch (e) {
        // Fallback default values
        if (isMounted) {
          setProfile({
            businessName: 'Sabzi & Fruit Mandi Trade Brokerage',
            ownerName: 'Mian Rashid (Admin)',
            mobileNumber: '0300-1234567',
            whatsAppNumber: '0311-7654321',
            email: 'admin@mandi.com',
            address: 'New Sabzi & Fruit Mandi',
            city: 'Lahore',
            country: 'Pakistan',
            businessCode: 'MR-01'
          });
        }
      }
    };

    fetchBiz();
    return () => { isMounted = false; };
  }, [initialProfile]);

  const bizName = profile?.businessName || profile?.name || 'Sabzi & Fruit Mandi Trade Brokerage';
  const owner = profile?.ownerName ? `Proprietor: ${profile.ownerName}` : '';
  const phone = [profile?.mobileNumber, profile?.whatsAppNumber || profile?.phone].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' / ');
  const email = profile?.email || '';
  const location = [profile?.address, profile?.city, profile?.country].filter(Boolean).join(', ');
  const code = profile?.businessCode || profile?.arthiCode || profile?.code || 'MANDI-OS';

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`hidden print:block text-slate-900 border-b-2 border-slate-900 pb-3 mb-4 ${className}`}>
      {/* Top Organization Brand Bar */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3">
          {profile?.logo ? (
            <img
              src={profile.logo}
              alt="Logo"
              className="h-14 w-14 object-contain rounded border border-slate-300 bg-white p-0.5 shrink-0"
            />
          ) : (
            <div className="h-12 w-12 rounded bg-slate-900 text-white flex items-center justify-center font-black text-xl shrink-0 border border-slate-700">
              {bizName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight text-slate-950 leading-tight">
              {bizName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 text-[10px] font-semibold text-slate-700 mt-0.5">
              {owner && <span className="font-bold text-slate-900">{owner}</span>}
              {phone && <span>📞 {phone}</span>}
              {email && <span>✉️ {email}</span>}
            </div>
            {location && (
              <p className="text-[10px] text-slate-600 mt-0.5">
                📍 {location}
              </p>
            )}
          </div>
        </div>

        {/* Business Identifier & Watermark Badge */}
        <div className="text-right shrink-0">
          <div className="inline-block bg-slate-100 border border-slate-300 px-2 py-1 rounded text-right">
            <p className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500">Mandi Trade Reg</p>
            <p className="text-[11px] font-mono font-black text-slate-900">{code}</p>
          </div>
          <p className="text-[8px] font-medium text-slate-400 mt-0.5">MandiOS Brokerage ERP</p>
        </div>
      </div>

      {/* Report Title & Parameter Strip */}
      <div className="mt-3 pt-2.5 border-t border-slate-300 flex justify-between items-end gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-slate-900 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider">
              Official Report
            </span>
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">
              {title}
            </h2>
          </div>

          {(subtitle || period || dateRange || filters.length > 0) && (
            <div className="text-[10px] font-medium text-slate-700 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              {period && <span className="font-bold text-indigo-950">Period: {period}</span>}
              {dateRange && <span className="font-bold text-indigo-950">Date: {dateRange}</span>}
              {subtitle && <span>{subtitle}</span>}
              {filters.map((f, idx) => (
                <span key={idx} className="text-slate-600">
                  <strong className="text-slate-800">{f.label}:</strong> {f.value}
                </span>
              ))}
            </div>
          )}

          {customDetails}
        </div>

        <div className="text-right shrink-0 text-[9px] text-slate-500">
          <p>Generated: <span className="font-bold text-slate-700">{dateStr}</span></p>
        </div>
      </div>

      {/* Summary KPI Pills (If provided) */}
      {summaryMetrics && summaryMetrics.length > 0 && (
        <div className="grid grid-flow-col auto-cols-fr gap-2 mt-2.5 pt-2 border-t border-dashed border-slate-300 text-center text-[10px]">
          {summaryMetrics.map((metric, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 px-2 py-1 rounded">
              <span className="font-semibold text-slate-600 block text-[8px] uppercase tracking-wider">{metric.label}</span>
              <span className="font-black text-slate-950 text-[11px]">{metric.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
