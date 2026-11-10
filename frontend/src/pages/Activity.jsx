import React, { useState, useEffect } from 'react';
import { 
  History, 
  Bot, 
  User, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Filter,
  ShieldCheck
} from 'lucide-react';
import { getActivityLog } from '../api/client';

export default function Activity({ onSelectSubscription }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getActivityLog({
        entity_type: entityFilter || undefined,
        limit: 100,
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load activity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  const getActorBadge = (actor) => {
    if (actor === 'mcp:claude') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <Bot className="w-3.5 h-3.5" />
          Claude via MCP
        </span>
      );
    }
    if (actor === 'savings_engine') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Sparkles className="w-3.5 h-3.5" />
          Savings Engine
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <User className="w-3.5 h-3.5" />
        Dashboard User
      </span>
    );
  };

  const getActionBadge = (action) => {
    const styles = {
      created: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      updated: 'bg-amber-50 text-amber-700 border-amber-200',
      status_changed: 'bg-rose-50 text-rose-700 border-rose-200',
      deleted: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${styles[action] || 'bg-slate-100 text-slate-700'}`}>
        {action.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Immutable Audit Trail</h2>
            <p className="text-xs text-slate-500">
              Complete history of mutations executed via Web Dashboard and Claude's external MCP connection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Filter Entity:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg outline-none bg-white font-semibold text-slate-700"
          >
            <option value="">All Entities</option>
            <option value="subscription">Subscriptions</option>
            <option value="review">Reviews</option>
            <option value="savings">Savings Opportunities</option>
            <option value="category">Categories</option>
            <option value="payment">Payments</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-4">Entity Type</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Actor / System</th>
                <th className="py-3.5 px-6">Modifications & Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">Loading audit history...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No activity entries recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.performed_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                      {log.entity_type}
                    </td>
                    <td className="py-4 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-4 px-4">{getActorBadge(log.performed_by)}</td>
                    <td className="py-4 px-6">
                      {log.changes ? (
                        <div className="space-y-1 font-mono text-[11px]">
                          {Object.entries(log.changes).map(([field, diff]) => (
                            <div key={field} className="flex items-center gap-1.5 text-slate-600">
                              <span className="font-semibold text-slate-800">{field}:</span>
                              {diff.old !== null && (
                                <>
                                  <span className="text-rose-600 line-through">{String(diff.old)}</span>
                                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                </>
                              )}
                              <span className="text-emerald-600 font-bold">{String(diff.new)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No details recorded</span>
                      )}
                    </td>
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
