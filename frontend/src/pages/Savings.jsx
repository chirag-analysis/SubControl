import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Layers, 
  RefreshCw,
  TrendingDown,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { getSavingsOpportunities, detectSavings, updateSavingsStatus } from '../api/client';

export default function Savings({ onSelectSubscription }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('identified');

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const data = await getSavingsOpportunities({
        status: filterStatus || undefined,
      });
      setOpportunities(data);
    } catch (err) {
      console.error('Failed to fetch savings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [filterStatus]);

  const handleRunDetection = async () => {
    setDetecting(true);
    try {
      await detectSavings();
      await fetchOpportunities();
    } catch (err) {
      alert('Error running savings detection: ' + err.message);
    } finally {
      setDetecting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateSavingsStatus(id, newStatus);
      fetchOpportunities();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(parseFloat(val) || 0);
  };

  const totalIdentified = opportunities.reduce(
    (acc, o) => acc + (parseFloat(o.estimated_savings) || 0),
    0
  );

  const getTypeBadge = (type) => {
    const badges = {
      unused_licenses: { label: 'Unused Licenses', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
      duplicate_tool: { label: 'Duplicate Tool Overlap', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
      annual_switch: { label: 'Annual Billing Switch', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      negotiation: { label: 'High-Cost Renewal Leverage', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    };
    const b = badges[type] || { label: type, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${b.bg}`}>
        {b.label}
      </span>
    );
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Banner Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-indigo-500/30 rounded-lg border border-indigo-400/30">
              <Sparkles className="w-4 h-4 text-indigo-300" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Deterministic Intelligence Engine
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Recurring Spend Optimization</h2>
          <p className="text-xs text-indigo-200/80 mt-1 max-w-xl">
            Continuously evaluates license seat utilization, multi-tool category redundancies, and annual discount arbitrage without AI hallucinations.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-semibold text-indigo-200 block">Identified Potential</span>
            <span className="text-2xl font-black text-white">{formatCurrency(totalIdentified)}<span className="text-xs font-normal text-indigo-200">/yr</span></span>
          </div>

          <button
            onClick={handleRunDetection}
            disabled={detecting}
            className="flex items-center gap-2 px-4 py-3 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl font-bold text-xs shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${detecting ? 'animate-spin' : ''}`} />
            {detecting ? 'Analyzing...' : 'Run Detection Now'}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          {['identified', 'in_progress', 'realized', 'dismissed', ''].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === '' ? 'All' : st.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 font-medium">{opportunities.length} opportunities</span>
      </div>

      {/* Opportunities List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading savings opportunities...</div>
      ) : opportunities.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-card">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-900">No active savings opportunities</h4>
          <p className="text-xs text-slate-500 mt-1">All spend is currently optimized according to deterministic rules.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {opportunities.map((opp) => (
            <div 
              key={opp.id} 
              className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>{getTypeBadge(opp.opportunity_type)}</div>
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-600 block">
                      +{formatCurrency(opp.estimated_savings)}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Annual Est.</span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-1.5">
                  {opp.subscription_name}
                </h4>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                  {opp.description}
                </p>
              </div>

              {/* Status & Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Detected {new Date(opp.detected_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  {opp.status === 'identified' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(opp.id, 'in_progress')}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors"
                      >
                        Start Review
                      </button>
                      <button
                        onClick={() => handleStatusChange(opp.id, 'dismissed')}
                        className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        Dismiss
                      </button>
                    </>
                  )}

                  {opp.status === 'in_progress' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(opp.id, 'realized')}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                      >
                        Mark Realized
                      </button>
                      <button
                        onClick={() => handleStatusChange(opp.id, 'dismissed')}
                        className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        Dismiss
                      </button>
                    </>
                  )}

                  {(opp.status === 'realized' || opp.status === 'dismissed') && (
                    <span className="text-xs font-semibold capitalize text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {opp.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
