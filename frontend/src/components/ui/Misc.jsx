import { Inbox, Loader2 } from 'lucide-react';

export function EmptyState({ title = 'No data', subtitle, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <Icon size={28} />
      </div>
      <div className="font-display font-semibold text-slate-900">{title}</div>
      {subtitle && <div className="text-sm text-slate-500 mt-1 max-w-sm">{subtitle}</div>}
    </div>
  );
}

export function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
      <Loader2 className="animate-spin" size={18} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Badge({ children, color = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    yellow: 'bg-amber-50 text-amber-700',
    blue: 'bg-brand-50 text-brand-700',
    violet: 'bg-violet-50 text-violet-700',
  };
  return <span className={`badge ${colors[color] || colors.slate}`}>{children}</span>;
}
