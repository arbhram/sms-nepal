import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, CalendarCheck, Award, Megaphone, LogOut, X, KeyRound, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/axios.js';
import PortalTopbar from '../../components/layout/PortalTopbar.jsx';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'My Academics',
    items: [
      { to: '/student/fees', icon: Wallet, label: 'My Fees' },
      { to: '/student/attendance', icon: CalendarCheck, label: 'Attendance' },
      { to: '/student/exams', icon: Award, label: 'Exams & Results' },
      { to: '/student/report-card', icon: FileText, label: 'Report Card' },
      { to: '/student/notices', icon: Megaphone, label: 'Notice Board' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/student/change-password', icon: KeyRound, label: 'Change Password' },
    ],
  },
];

export default function StudentPortal() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get('/student-portal/profile').then(({ data }) => setProfile(data)).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        {/* Logo */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
          <img src="/wephas-logo.svg" alt="wePhas" className="w-36 h-auto object-contain" />
          <p className="text-[10px] text-slate-400 uppercase tracking-wider whitespace-nowrap shrink-0">Student Portal</p>
          <button className="ml-auto lg:hidden p-1 rounded hover:bg-slate-100" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Profile card */}
        {profile && (
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                {profile.fullName?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{profile.fullName}</p>
                <p className="text-xs text-slate-400">{profile.class?.name}{profile.section ? ` · ${profile.section}` : ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          {NAV_SECTIONS.map(({ label, items }) => (
            <div key={label} className="mb-5">
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
              <div className="space-y-0.5">
                {items.map(({ to, icon: Icon, label: itemLabel }) => (
                  <NavLink
                    key={to} to={to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon size={16} /> {itemLabel}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 w-full transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <PortalTopbar
          onMenuClick={() => setOpen(true)}
          title="Student Portal"
          settingsPath="/student/change-password"
        />
        <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
          <Outlet context={{ profile }} />
        </main>
      </div>
    </div>
  );
}
