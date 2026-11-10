import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  CalendarClock, 
  Sparkles, 
  ClipboardCheck, 
  History,
  Bot,
  Zap,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'renewals', label: 'Renewals', icon: CalendarClock },
    { id: 'savings', label: 'Savings Engine', icon: Sparkles, badge: 'Deterministic' },
    { id: 'reviews', label: 'Renewal Reviews', icon: ClipboardCheck },
    { id: 'activity', label: 'Activity & Audit', icon: History },
  ];

  return (
    <aside className="w-64 bg-sidebar text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
          <span className="font-bold text-white text-lg tracking-tight">SubControl</span>
          <span className="text-[10px] block text-indigo-400 font-medium -mt-1 tracking-wider uppercase">Spend Intelligence</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Platform</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* External MCP Claude Live Integration Pill */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-inner">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              Claude MCP Server
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Connected via stdio to the shared PostgreSQL database. No AI APIs at runtime.
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Protocol: MCP 2.x</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Shared DB
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
