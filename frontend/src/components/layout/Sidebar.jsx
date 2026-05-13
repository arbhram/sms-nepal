import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Wallet,
  CalendarCheck, ClipboardList, BarChart3, Megaphone, Settings, X, UserCheck,
  LayoutList, UserCog, BookMarked, ScrollText, Scale, TrendingUp, Landmark,
} from 'lucide-react';

const SECTIONS = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Academic',
    items: [
      { to: '/students', label: 'Students', icon: Users },
      { to: '/teachers', label: 'Teachers', icon: GraduationCap },
      { to: '/parents', label: 'Parents', icon: UserCheck },
      { to: '/classes', label: 'Classes', icon: BookOpen },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/fees', label: 'Fee Ledger', icon: Wallet },
      { to: '/fees/structures', label: 'Fee Structures', icon: LayoutList },
      { to: '/fees/assignments', label: 'Fee Assignments', icon: UserCog },
      { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
      { to: '/exams', label: 'Exams', icon: ClipboardList },
    ],
  },
  {
    label: 'Payroll',
    items: [
      { to: '/payroll', label: 'Payroll Runs', icon: Landmark },
    ],
  },
  {
    label: 'Accounting',
    items: [
      { to: '/accounting/chart-of-accounts', label: 'Chart of Accounts', icon: BookMarked },
      { to: '/accounting/journals',          label: 'Journals',           icon: ScrollText },
      { to: '/accounting/trial-balance',     label: 'Trial Balance',      icon: Scale },
      { to: '/accounting/reports',           label: 'Financial Reports',  icon: TrendingUp },
    ],
  },
  {
    label: 'Reports & Comms',
    items: [
      { to: '/gradebook', label: 'Gradebook', icon: ClipboardList },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/notices', label: 'Notice Board', icon: Megaphone },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 w-64 h-screen bg-white border-r border-slate-100 flex flex-col transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <img src="/wephas-logo.svg" alt="wePhas" className="h-10 w-auto object-contain" />
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-slate-100 shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          {SECTIONS.map(({ label, items }) => (
            <div key={label} className="mb-5">
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                {label}
              </p>
              <div className="space-y-0.5">
                {items.map(({ to, label: itemLabel, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon size={16} />
                    {itemLabel}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
