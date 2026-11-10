import React from 'react';
import { Plus, Database, Sparkles } from 'lucide-react';

export default function Header({ title, subtitle, onNewSubscription, onRunDetection }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {onRunDetection && (
          <button
            onClick={onRunDetection}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200/80 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Run Savings Engine
          </button>
        )}

        <button
          onClick={onNewSubscription}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/30 transition-all hover:shadow"
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>

        <div className="h-4 w-px bg-slate-200 ml-1" />

        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-md border border-slate-200/60 font-mono">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>PostgreSQL:5432</span>
        </div>
      </div>
    </header>
  );
}
