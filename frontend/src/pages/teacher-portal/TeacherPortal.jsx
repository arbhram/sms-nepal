import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, Award, Megaphone, LogOut, X, KeyRound, BookMarked } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/axios.js';
import PortalTopbar from '../../components/layout/PortalTopbar.jsx';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Teaching',
    items: [
      { to: '/teacher/students', icon: Users, label: 'My Students' },
      { to: '/teacher/attendance', icon: CalendarCheck, label: 'Attendance' },
      { to: '/teacher/exams', icon: Award, label: 'Exams' },
      { to: '/teacher/gradebook', icon: BookMarked, label: 'Gradebook' },
      { to: '/teacher/notices', icon: Megaphone, label: 'Notice Board' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/teacher/change-password', icon: KeyRound, label: 'Change Password' },
    ],
  },
];

export default function TeacherPortal() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get('/teacher-portal/profile').then(({ data }) => setProfile(data)).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        {/* Logo */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
          <img src="/wephas-logo.png" alt="wePhas" className="w-36 h-auto object-contain mix-blend-multiply" />
          <p className="text-[10px] text-slate-400 uppercase tracking-wider whitespace-nowrap shrink-0">Teacher Portal</p>
          <button className="ml-auto lg:hidden p-1 rounded hover:bg-slate-100" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Profile card */}
        {profile && (
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                {profile.fullName?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{profile.fullName}</p>
                <p className="text-xs text-slate-400">{profile.subject || profile.teacherId}</p>
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
                        isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
          title="Teacher Portal"
          settingsPath="/teacher/change-password"
        />
        <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
          <Outlet context={{ profile }} />
        </main>
      </div>
    </div>
  );
}
