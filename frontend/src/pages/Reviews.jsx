import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  ArrowDownCircle, 
  RefreshCw, 
  Clock,
  DollarSign
} from 'lucide-react';
import { getReviews, createReview, getSubscriptions } from '../api/client';

export default function Reviews({ onSelectSubscription }) {
  const [reviews, setReviews] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [selectedSubId, setSelectedSubId] = useState('');
  const [decision, setDecision] = useState('approve');
  const [reviewer, setReviewer] = useState('');
  const [proposedCost, setProposedCost] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revData, subData] = await Promise.all([
        getReviews(),
        getSubscriptions({ status: 'active' }),
      ]);
      setReviews(revData);
      setSubscriptions(subData);
      if (subData.length > 0 && !selectedSubId) {
        setSelectedSubId(subData[0].id);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubId || !reviewer) return;

    setSubmitting(true);
    try {
      await createReview({
        subscription_id: selectedSubId,
        review_date: new Date().toISOString().split('T')[0],
        decision,
        reviewer,
        notes: notes || null,
        proposed_cost: proposedCost ? parseFloat(proposedCost) : null,
      });
      setShowModal(false);
      setNotes('');
      setProposedCost('');
      fetchData();
    } catch (err) {
      alert('Failed to submit review: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(parseFloat(val));
  };

  const getDecisionBadge = (dec) => {
    const config = {
      approve: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
      cancel: { bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
      downgrade: { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: ArrowDownCircle },
      renegotiate: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: RefreshCw },
      pending: { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock },
    };
    const c = config[dec] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${c.bg}`}>
        <Icon className="w-3.5 h-3.5" />
        {dec}
      </span>
    );
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Action Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Renewal Review Governance</h2>
          <p className="text-xs text-slate-500">Record and audit contract renewal decisions, cost modifications, and cancellations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Record New Review
        </button>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6">Subscription</th>
                <th className="py-3.5 px-4">Review Date</th>
                <th className="py-3.5 px-4">Decision</th>
                <th className="py-3.5 px-4">Reviewer</th>
                <th className="py-3.5 px-4">Previous Cost</th>
                <th className="py-3.5 px-4">Proposed / Revised</th>
                <th className="py-3.5 px-6">Rationale & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading reviews...</td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No renewal reviews recorded yet. Click "Record New Review" to begin.
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr 
                    key={r.id} 
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    onClick={() => onSelectSubscription(r.subscription_id)}
                  >
                    <td className="py-4 px-6 font-bold text-slate-900 hover:text-indigo-600">
                      {r.subscription_name || 'Subscription'}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-600">{r.review_date}</td>
                    <td className="py-4 px-4">{getDecisionBadge(r.decision)}</td>
                    <td className="py-4 px-4 font-medium text-slate-700">{r.reviewer}</td>
                    <td className="py-4 px-4 font-medium text-slate-600">{formatCurrency(r.previous_cost)}</td>
                    <td className="py-4 px-4 font-bold text-slate-900">{formatCurrency(r.proposed_cost)}</td>
                    <td className="py-4 px-6 text-slate-500 max-w-sm truncate">{r.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Record Renewal Decision</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Subscription</label>
                <select
                  value={selectedSubId}
                  onChange={(e) => setSelectedSubId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-medium"
                  required
                >
                  {subscriptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatCurrency(s.cost_per_cycle)}/{s.billing_cycle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Decision</label>
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="approve">Approve (Renew)</option>
                    <option value="cancel">Cancel (Terminate)</option>
                    <option value="downgrade">Downgrade (Reduce Tier)</option>
                    <option value="renegotiate">Renegotiate (Request Discount)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reviewer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Finance Team / Head of IT"
                    value={reviewer}
                    onChange={(e) => setReviewer(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Proposed / Negotiated Cost (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Leave blank if unchanged"
                    value={proposedCost}
                    onChange={(e) => setProposedCost(e.target.value)}
                    className="w-full text-xs pl-7 pr-3 py-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Justification & Notes</label>
                <textarea
                  rows={3}
                  placeholder="Reasoning for this renewal approval, cancellation, or rate negotiation..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
