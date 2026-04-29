export default function StatCard({ title, value, icon: Icon, gradient = 'bg-gradient-brand', trend, subtitle }) {
  return (
    <div className="card p-5 overflow-hidden relative group hover:shadow-lg transition-shadow">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${gradient} opacity-10 group-hover:scale-110 transition`} />
      <div className="flex items-start justify-between mb-4 relative">
        <div className={`w-11 h-11 rounded-xl ${gradient} flex items-center justify-center text-white shadow-card`}>
          {Icon && <Icon size={20} />}
        </div>
        {trend && (
          <span className={`badge ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="relative">
        <div className="text-3xl font-display font-bold text-slate-900 tracking-tight">{value}</div>
        <div className="text-sm text-slate-500 mt-1">{title}</div>
        {subtitle && <div className="text-xs text-slate-400 mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}
