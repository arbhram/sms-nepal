import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { GraduationCap, Wallet, CalendarCheck, Award, Megaphone, LogOut, Menu, X, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/axios.js';

const NAV = [
  { to: '/student/dashboard', icon: GraduationCap, label: 'Dashboard' },
  { to: '/student/fees', icon: Wallet, label: 'My Fees' },
  { to: '/student/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/student/exams', icon: Award, label: 'Exams & Results' },
  { to: '/student/notices', icon: Megaphone, label: 'Notice Board' },
  { to: '/student/change-password', icon: KeyRound, label: 'Change Password' },
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
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        <div className="p-5 border-b flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">S</div>
          <div>
            <p className="font-display font-bold text-slate-900 text-sm leading-tight">Student Portal</p>
            <p className="text-xs text-slate-400">SMS Nepal</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>

        {profile && (
          <div className="p-4 border-b">
            <p className="font-semibold text-slate-800 text-sm truncate">{profile.fullName}</p>
            <p className="text-xs text-slate-500">{profile.class?.name} — {profile.section}</p>
            <p className="text-xs text-slate-400 mt-0.5">{profile.studentId}</p>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50'}`
              }
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setOpen(true)}><Menu size={20} /></button>
          <span className="font-display font-bold text-slate-900">Student Portal</span>
        </header>
        <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
          <Outlet context={{ profile }} />
        </main>
      </div>
    </div>
  );
}
