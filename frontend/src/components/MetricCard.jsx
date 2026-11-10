import React from 'react';

export default function MetricCard({ title, value, subtext, icon: Icon, trend, color = 'indigo' }) {
  const colorStyles = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-lg border ${colorStyles[color] || colorStyles.indigo}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {subtext && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span className={`font-semibold ${trend.positive ? 'text-emerald-600' : 'text-slate-600'}`}>
              {trend.label}
            </span>
          )}
          <span className="text-slate-500">{subtext}</span>
        </div>
      )}
    </div>
  );
}
