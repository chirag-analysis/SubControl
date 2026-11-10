import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  XCircle,
  Users,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { getSubscriptions, cancelSubscription } from '../api/client';

export default function Subscriptions({ 
  categories, 
  onSelectSubscription, 
  onEditSubscription,
  refreshTrigger 
}) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('cost_per_cycle');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await getSubscriptions({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        category_id: categoryFilter || undefined,
        sort_by: sortBy,
        order: sortOrder,
      });
      setSubscriptions(data);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [searchTerm, statusFilter, categoryFilter, sortBy, sortOrder, refreshTrigger]);

  const handleCancel = async (id, name) => {
    const reason = prompt(`Cancel subscription for "${name}"?\nPlease provide a reason (optional):`);
    if (reason !== null) {
      try {
        await cancelSubscription(id, reason);
        fetchSubscriptions();
      } catch (err) {
        alert('Failed to cancel subscription: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      paused: 'bg-amber-50 text-amber-700 border-amber-200',
      cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
      trial: 'bg-blue-50 text-blue-700 border-blue-200',
      pending_review: 'bg-violet-50 text-violet-700 border-violet-200',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${styles[status] || styles.active}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatCost = (val, cycle) => {
    const num = parseFloat(val);
    return (
      <div>
        <span className="font-bold text-slate-900">${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        <span className="text-[10px] text-slate-400 block lowercase">/{cycle}</span>
      </div>
    );
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Control Bar: Filters & Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by tool name, vendor, description, owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white font-medium text-slate-700"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white font-medium text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="pending_review">Pending Review</option>
            <option value="trial">Trial</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2 py-1 bg-white">
            <span className="text-[11px] text-slate-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-transparent outline-none font-medium text-slate-700 cursor-pointer"
            >
              <option value="cost_per_cycle">Cost</option>
              <option value="name">Name</option>
              <option value="next_renewal_date">Renewal Date</option>
              <option value="created_at">Date Added</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6">Subscription & Vendor</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Recurring Spend</th>
                <th className="py-3.5 px-4">License Utilization</th>
                <th className="py-3.5 px-4">Next Renewal</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading subscriptions...</span>
                    </div>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No subscriptions found matching the selected filters.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const hasLicenses = sub.license_count !== null && sub.license_count > 0;
                  const utilPct = hasLicenses && sub.used_licenses !== null
                    ? Math.round((sub.used_licenses / sub.license_count) * 100)
                    : null;
                  const isLowUtil = utilPct !== null && utilPct < 70;

                  return (
                    <tr 
                      key={sub.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onSelectSubscription(sub.id)}
                    >
                      {/* Subscription & Vendor */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm shrink-0">
                            {sub.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">
                              {sub.name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {sub.vendor} • {sub.owner}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="text-slate-600 font-medium bg-slate-100 px-2.5 py-1 rounded-md text-[11px]">
                          {sub.category_name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Recurring Cost */}
                      <td className="py-4 px-4">
                        {formatCost(sub.cost_per_cycle, sub.billing_cycle)}
                      </td>

                      {/* License Utilization */}
                      <td className="py-4 px-4">
                        {hasLicenses ? (
                          <div className="w-36">
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-slate-600 font-medium">
                                {sub.used_licenses} / {sub.license_count}
                              </span>
                              <span className={`font-semibold ${isLowUtil ? 'text-amber-600' : 'text-slate-700'}`}>
                                {utilPct}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isLowUtil ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${utilPct}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Seat-less / Flat plan</span>
                        )}
                      </td>

                      {/* Next Renewal */}
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {sub.next_renewal_date ? (
                          <div>
                            <span className="block">{sub.next_renewal_date}</span>
                            <span className="text-[10px] text-slate-400 capitalize">{sub.payment_method || 'Standard'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {getStatusBadge(sub.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectSubscription(sub.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditSubscription(sub)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {sub.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancel(sub.id, sub.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Cancel Subscription"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
