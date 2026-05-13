import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Settings, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import NotificationDropdown from '../ui/NotificationDropdown.jsx';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-100">
      <div className="flex items-center gap-3 px-4 lg:px-6 h-16">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search students, teachers..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-brand-300 focus:ring-2 focus:ring-brand-100 outline-none transition"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 ml-auto">
          <NotificationDropdown userId={user?._id} />

          <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <Mail size={18} />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1" />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-50 transition"
            >
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</div>
                <div className="text-[11px] text-emerald-600 font-medium">Online</div>
              </div>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/settings'); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <Settings size={15} /> Settings
                  </button>
                  <div className="border-t border-slate-100" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut size={15} /> Log Out
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => navigate('/settings')}
            className="hidden sm:block p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
