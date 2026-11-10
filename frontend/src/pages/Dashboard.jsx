import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CalendarClock, 
  TrendingUp, 
  Sparkles, 
  Users, 
  ArrowUpRight,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { 
  getOverview, 
  getSpendTrend, 
  getSpendByCategory, 
  getUpcomingRenewals, 
  getTopVendors,
  detectSavings
} from '../api/client';

export default function Dashboard({ setCurrentTab, onSelectSubscription }) {
  const [overview, setOverview] = useState(null);
  const [spendTrend, setSpendTrend] = useState([]);
  const [categorySpend, setCategorySpend] = useState([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, trend, cat, renewals, vendors] = await Promise.all([
        getOverview(),
        getSpendTrend(),
        getSpendByCategory(),
        getUpcomingRenewals(30),
        getTopVendors(5),
      ]);
      setOverview(ov);
      setSpendTrend(trend);
      setCategorySpend(cat);
      setUpcomingRenewals(renewals);
      setTopVendors(vendors);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const CATEGORY_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading spend intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Normalized Monthly Spend"
          value={formatCurrency(overview?.total_monthly_spend)}
          subtext={`Annualized: ${formatCurrency(overview?.total_annual_spend)}`}
          icon={CreditCard}
          color="indigo"
          trend={{ label: 'Active MRR', positive: true }}
        />

        <MetricCard
          title="Active Subscriptions"
          value={overview?.active_subscriptions || 0}
          subtext={`Across ${categorySpend.length} spend categories`}
          icon={TrendingUp}
          color="emerald"
        />

        <MetricCard
          title="Identified Savings"
          value={formatCurrency(overview?.potential_annual_savings)}
          subtext={`${overview?.active_savings_count || 0} deterministic opportunities`}
          icon={Sparkles}
          color="violet"
          trend={{ label: 'Save ~14%', positive: true }}
        />

        <MetricCard
          title="Renewals (Next 30 Days)"
          value={overview?.upcoming_renewals_30d || 0}
          subtext={`License util: ${overview?.license_utilization_rate || 0}%`}
          icon={CalendarClock}
          color={overview?.upcoming_renewals_30d > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spend Trend Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recurring Spend Trajectory</h3>
              <p className="text-xs text-slate-500">Historical payments and projected monthly commitments</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              12 Months Window
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  formatter={(val) => [formatCurrency(val), 'Projected Monthly Spend']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="projected_spend" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#spendColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by Category Breakdown */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Spend by Category</h3>
              <span className="text-xs text-slate-400 font-medium">Monthly</span>
            </div>
            <div className="space-y-3.5">
              {categorySpend.map((cat, idx) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[150px]">{cat.category}</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(cat.monthly_spend)}/mo</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${cat.percentage}%`, 
                        backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] 
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setCurrentTab('subscriptions')}
            className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-between group"
          >
            <span>Explore all categories</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Bottom Row: Upcoming Renewals & Top Vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Renewals List (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Approaching Renewals</h3>
              <p className="text-xs text-slate-500">Subscriptions renewing in the next 30 days requiring review</p>
            </div>
            <button
              onClick={() => setCurrentTab('renewals')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View All Renewals
            </button>
          </div>

          {upcomingRenewals.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No renewals approaching within 30 days.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingRenewals.slice(0, 4).map((sub) => {
                const isUrgent = sub.days_remaining <= 7;
                return (
                  <div key={sub.id} className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isUrgent ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                        <CalendarClock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{sub.name}</h4>
                        <span className="text-[11px] text-slate-500">{sub.vendor} • {sub.owner}</span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {formatCurrency(sub.cost_per_cycle)}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {sub.days_remaining <= 0 ? 'Due Today' : `In ${sub.days_remaining} days`}
                        </span>
                      </div>
                      <button
                        onClick={() => onSelectSubscription(sub.id)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Vendors Ranked */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Top Vendors by Spend</h3>
            <span className="text-xs text-slate-400 font-medium">Annual</span>
          </div>

          <div className="space-y-3">
            {topVendors.map((v, i) => (
              <div key={v.vendor} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block truncate max-w-[130px]">{v.vendor}</span>
                    <span className="text-[10px] text-slate-400">{v.subscription_count} contract(s)</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 block">{formatCurrency(v.annual_spend)}</span>
                  <span className="text-[10px] text-slate-500">{formatCurrency(v.monthly_spend)}/mo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
