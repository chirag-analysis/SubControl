import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  CreditCard, 
  CalendarClock, 
  Users, 
  Sparkles, 
  FileText, 
  ShieldAlert,
  CheckCircle,
  PlusCircle
} from 'lucide-react';
import { getSubscription, cancelSubscription } from '../api/client';

export default function SubscriptionDetail({ 
  subscriptionId, 
  onBack, 
  onEdit, 
  onRecordReview 
}) {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const data = await getSubscription(subscriptionId);
      setSub(data);
    } catch (err) {
      console.error('Failed to load subscription detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subscriptionId) {
      loadDetail();
    }
  }, [subscriptionId]);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p>Subscription not found.</p>
        <button onClick={onBack} className="mt-4 text-xs font-semibold text-indigo-600">
          Go Back
        </button>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(parseFloat(val) || 0);
  };

  const hasLicenses = sub.license_count !== null && sub.license_count > 0;
  const utilPct = hasLicenses && sub.used_licenses !== null
    ? Math.round((sub.used_licenses / sub.license_count) * 100)
    : null;

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      {/* Back button & Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Subscriptions
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onRecordReview(sub)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Record Renewal Review
          </button>
          <button
            onClick={() => onEdit(sub)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-2xl shrink-0">
              {sub.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">{sub.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                  {sub.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Vendor: <span className="font-semibold text-slate-700">{sub.vendor}</span> • 
                Category: <span className="font-semibold text-slate-700">{sub.category_name || 'Uncategorized'}</span> • 
                Owner: <span className="font-semibold text-slate-700">{sub.owner}</span>
              </p>
              {sub.description && (
                <p className="text-xs text-slate-600 mt-3 max-w-2xl leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {sub.description}
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right min-w-[200px]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Recurring Cost</span>
            <span className="text-2xl font-extrabold text-slate-900 block mt-0.5">
              {formatCurrency(sub.cost_per_cycle)}
            </span>
            <span className="text-[11px] text-slate-500 capitalize">
              Billed {sub.billing_cycle} via {sub.payment_method || 'Credit Card'}
            </span>
          </div>
        </div>

        {/* Quick Details Grid */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Contract Start</span>
            <span className="text-xs font-semibold text-slate-800">{sub.start_date}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Next Renewal</span>
            <span className="text-xs font-semibold text-slate-800">{sub.next_renewal_date || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Currency</span>
            <span className="text-xs font-semibold text-slate-800">{sub.currency}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">End Date</span>
            <span className="text-xs font-semibold text-slate-800">{sub.end_date || 'Active Contract'}</span>
          </div>
        </div>
      </div>

      {/* Licenses & Deterministic Savings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* License Utilization */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              License Capacity & Utilization
            </h3>
            {utilPct !== null && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${utilPct < 70 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {utilPct}% Utilized
              </span>
            )}
          </div>

          {hasLicenses ? (
            <div className="space-y-4">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${utilPct < 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${utilPct}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Seats</span>
                  <span className="text-base font-bold text-slate-900">{sub.license_count}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Active Seats</span>
                  <span className="text-base font-bold text-slate-900">{sub.used_licenses}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Idle Seats</span>
                  <span className="text-base font-bold text-amber-600">{sub.license_count - sub.used_licenses}</span>
                </div>
              </div>

              {utilPct < 70 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <strong>Idle Capacity Alert:</strong> Over 30% of paid licenses are currently unassigned. Consider downsizing at the next renewal.
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              This subscription does not use per-seat licensing.
            </div>
          )}
        </div>

        {/* Notes & Contract Terms */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Notes & Negotiation Context
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
              {sub.notes || 'No specific notes recorded for this contract.'}
            </p>
          </div>
          <div className="text-[11px] text-slate-400 pt-4 border-t border-slate-100 flex justify-between">
            <span>Created: {new Date(sub.created_at).toLocaleDateString()}</span>
            <span>Last Updated: {new Date(sub.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            Payment History ({sub.payments?.length || 0})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-semibold">
                <th className="py-3 px-6">Payment Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Invoice Reference</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sub.payments?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No payment transactions recorded yet.
                  </td>
                </tr>
              ) : (
                sub.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-6 font-medium text-slate-800">{p.payment_date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{p.invoice_reference || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renewal Reviews History */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-indigo-600" />
            Renewal Review Decisions ({sub.reviews?.length || 0})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-semibold">
                <th className="py-3 px-6">Review Date</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Reviewer</th>
                <th className="py-3 px-4">Previous vs Proposed</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sub.reviews?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No renewal reviews recorded for this contract.
                  </td>
                </tr>
              ) : (
                sub.reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-6 font-medium text-slate-800">{r.review_date}</td>
                    <td className="py-3 px-4 font-bold capitalize">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        r.decision === 'approve' ? 'bg-emerald-100 text-emerald-800' :
                        r.decision === 'cancel' ? 'bg-rose-100 text-rose-800' :
                        r.decision === 'downgrade' ? 'bg-amber-100 text-amber-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {r.decision}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{r.reviewer}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {formatCurrency(r.previous_cost)} → {r.proposed_cost ? formatCurrency(r.proposed_cost) : 'Same'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{r.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
