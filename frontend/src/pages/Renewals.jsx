import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { getUpcomingRenewals } from '../api/client';

export default function Renewals({ onSelectSubscription, onRecordReview }) {
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [daysWindow, setDaysWindow] = useState(90);

  const fetchRenewals = async () => {
    setLoading(true);
    try {
      const data = await getUpcomingRenewals(daysWindow);
      setRenewals(data);
    } catch (err) {
      console.error('Failed to fetch renewals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenewals();
  }, [daysWindow]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(parseFloat(val) || 0);
  };

  const urgencyGroups = [
    { id: 'critical', label: 'Critical (Under 7 Days)', color: 'rose', bg: 'bg-rose-500' },
    { id: 'high', label: 'High Urgency (8 – 30 Days)', color: 'amber', bg: 'bg-amber-500' },
    { id: 'medium', label: 'Approaching (31 – 60 Days)', color: 'indigo', bg: 'bg-indigo-500' },
    { id: 'low', label: 'Planned (60+ Days)', color: 'slate', bg: 'bg-slate-400' },
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Renewal Pipeline & Expiration Schedule</h2>
          <p className="text-xs text-slate-500">Track and review contract renewals before auto-renew billing commits</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Time Horizon:</span>
          <select
            value={daysWindow}
            onChange={(e) => setDaysWindow(Number(e.target.value))}
            className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg outline-none bg-white font-semibold text-slate-700"
          >
            <option value={30}>Next 30 Days</option>
            <option value={60}>Next 60 Days</option>
            <option value={90}>Next 90 Days</option>
            <option value={180}>Next 6 Months</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading renewal pipeline...</div>
      ) : (
        <div className="space-y-6">
          {urgencyGroups.map((group) => {
            const items = renewals.filter((r) => r.urgency === group.id);
            if (items.length === 0) return null;

            return (
              <div key={group.id} className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
                <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${group.bg}`} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      {group.label}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {items.length} {items.length === 1 ? 'contract' : 'contracts'}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {items.map((sub) => (
                    <div 
                      key={sub.id} 
                      className="p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => onSelectSubscription(sub.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm shrink-0">
                          {sub.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                            {sub.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {sub.vendor} • {sub.owner} • Category: <span className="text-slate-700 font-medium">{sub.category_name || 'Uncategorized'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-900 block">
                            {formatCurrency(sub.cost_per_cycle)}
                          </span>
                          <span className="text-[11px] text-slate-400 capitalize">
                            /{sub.billing_cycle}
                          </span>
                        </div>

                        <div className="text-right min-w-[120px]">
                          <span className="text-xs font-bold text-slate-800 block">
                            {sub.next_renewal_date}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                            group.id === 'critical' ? 'bg-rose-100 text-rose-700' :
                            group.id === 'high' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {sub.days_remaining <= 0 ? 'Due Today' : `${sub.days_remaining} days left`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onRecordReview(sub)}
                            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => onSelectSubscription(sub.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
