import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, CalendarCheck, Award, Megaphone, LogOut, X, KeyRound, ChevronDown, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/axios.js';
import PortalTopbar from '../../components/layout/PortalTopbar.jsx';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/parent/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: "Child's Progress",
    items: [
      { to: '/parent/fees', icon: Wallet, label: "Fees" },
      { to: '/parent/attendance', icon: CalendarCheck, label: 'Attendance' },
      { to: '/parent/exams', icon: Award, label: 'Exams & Results' },
      { to: '/parent/report-card', icon: FileText, label: 'Report Card' },
      { to: '/parent/notices', icon: Megaphone, label: 'Notice Board' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/parent/change-password', icon: KeyRound, label: 'Change Password' },
    ],
  },
];

export default function ParentPortal() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  useEffect(() => {
    api.get('/parent-portal/children').then(({ data }) => {
      setChildren(data);
      if (data.length > 0) setActiveChildId(data[0]._id);
    }).catch(() => {});
  }, []);

  const activeChild = children.find((c) => c._id === activeChildId) || null;
  const handleLogout = () => { logout(); navigate('/login'); };

  const switchChild = (id) => {
    setActiveChildId(id);
    setSwitcherOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        {/* Logo */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
          <img src="/wephas-logo.svg" alt="wePhas" className="w-36 h-auto object-contain" />
          <p className="text-[10px] text-slate-400 uppercase tracking-wider whitespace-nowrap shrink-0">Parent Portal</p>
          <button className="ml-auto lg:hidden p-1 rounded hover:bg-slate-100" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Child switcher */}
        {children.length > 0 && (
          <div className="px-3 py-3 border-b border-slate-100">
            <p className="px-2 mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Viewing Child</p>
            {children.length === 1 ? (
              <div className="flex items-center gap-2.5 px-2 py-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                  {activeChild?.fullName?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-800 truncate">{activeChild?.fullName}</p>
                  <p className="text-xs text-slate-400">{activeChild?.class?.name}{activeChild?.section ? ` · ${activeChild.section}` : ''}</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setSwitcherOpen((v) => !v)}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 transition text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                    {activeChild?.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 truncate">{activeChild?.fullName}</p>
                    <p className="text-xs text-slate-400">{activeChild?.class?.name}{activeChild?.section ? ` · ${activeChild.section}` : ''}</p>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 flex-shrink-0 transition-transform ${switcherOpen ? 'rotate-180' : ''}`} />
                </button>
                {switcherOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                    {children.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => switchChild(c._id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition text-left ${c._id === activeChildId ? 'bg-indigo-50' : ''}`}
                      >
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                          {c.fullName?.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 truncate">{c.fullName}</p>
                          <p className="text-xs text-slate-400">{c.class?.name}</p>
                        </div>
                        {c._id === activeChildId && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {children.length === 0 && (
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-xs text-slate-400 text-center">No children linked yet</p>
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
                        isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
          title="Parent Portal"
          settingsPath="/parent/change-password"
        />
        <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
          <Outlet context={{ children, activeChild, activeChildId, setActiveChildId: switchChild }} />
        </main>
      </div>
    </div>
  );
}
