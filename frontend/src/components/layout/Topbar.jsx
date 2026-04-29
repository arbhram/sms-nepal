import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import NotificationDropdown from '../ui/NotificationDropdown.jsx';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-100">
      <div className="flex items-center gap-4 px-4 lg:px-8 py-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
          <Menu size={20} />
        </button>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search students, teachers, classes..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 border-transparent text-sm focus:bg-white focus:border-brand-200 focus:ring-2 focus:ring-brand-100 outline-none transition"
          />
        </div>

        <NotificationDropdown userId={user?._id} />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-slate-100"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</div>
              <div className="text-[11px] text-slate-500 capitalize">{user?.role}</div>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
