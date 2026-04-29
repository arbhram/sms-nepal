import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Wallet,
  CalendarCheck,
  ClipboardList,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/teachers', label: 'Teachers', icon: GraduationCap },
  { to: '/classes', label: 'Classes', icon: BookOpen },
  { to: '/fees', label: 'Fees', icon: Wallet },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/exams', label: 'Exams', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 w-72 h-screen bg-white border-r border-slate-100 transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold text-lg shadow-card">
              SN
            </div>
            <div>
              <div className="font-display font-bold text-slate-900">SMS Nepal</div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider">
                School Manager
              </div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-84px)]">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-gradient-brand text-white shadow-card'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-violet-50 border border-brand-100">
            <div className="text-xs font-semibold text-brand-700 uppercase tracking-wider mb-1">
              Pro Tip
            </div>
            <div className="text-sm text-slate-600 leading-snug">
              Use <kbd className="px-1.5 py-0.5 rounded bg-white shadow-sm text-xs">⌘K</kbd> anywhere
              to search students.
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
