import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import api from '../../api/axios.js';

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const typeColor = {
  fee: 'bg-amber-100 text-amber-700',
  payment: 'bg-green-100 text-green-700',
  class_assigned: 'bg-blue-100 text-blue-700',
  enrollment: 'bg-purple-100 text-purple-700',
  attendance: 'bg-rose-100 text-rose-700',
  exam: 'bg-indigo-100 text-indigo-700',
  general: 'bg-slate-100 text-slate-600',
};

export default function NotificationDropdown({ userId }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
      setUnread(data.filter((n) => !n.readBy.includes(userId)).length);
    } catch (_) {}
  };

  const fetchUnread = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnread(data.count);
    } catch (_) {}
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => n._id === id ? { ...n, readBy: [...n.readBy, userId] } : n)
    );
    setUnread((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await api.put('/notifications/mark-all-read');
    setNotifications((prev) => prev.map((n) => ({ ...n, readBy: [...n.readBy, userId] })));
    setUnread(0);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl hover:bg-slate-100"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-semibold text-slate-900 text-sm">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">No notifications</div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readBy.includes(userId);
                return (
                  <div
                    key={n._id}
                    onClick={() => isUnread && markRead(n._id)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer transition hover:bg-slate-50 ${isUnread ? 'bg-brand-50/40' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${typeColor[n.type] || typeColor.general}`}>
                          {n.type.replace('_', ' ')}
                        </span>
                        {isUnread && <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-sm font-medium text-slate-900 leading-tight">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {isUnread && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(n._id); }}
                        className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                      >
                        <Check size={13} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
