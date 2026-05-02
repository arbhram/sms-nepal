import { useState, useEffect } from 'react';
import { Megaphone, Trash2, Plus, X } from 'lucide-react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';

const AUDIENCE_LABELS = {
  teacher: { label: 'Teachers Only', color: 'bg-blue-100 text-blue-700' },
  student: { label: 'Students Only', color: 'bg-green-100 text-green-700' },
  both: { label: 'Everyone', color: 'bg-purple-100 text-purple-700' },
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', audience: 'both' });
  const [posting, setPosting] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const fetchNotices = async () => {
    try {
      const { data } = await api.get('/notices');
      setNotices(data);
    } catch (_) {
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return toast.error('Title and content are required');
    setPosting(true);
    try {
      const { data } = await api.post('/notices', form);
      setNotices([data, ...notices]);
      setForm({ title: '', content: '', audience: 'both' });
      setShowForm(false);
      toast.success('Notice posted');
    } catch (_) {
      toast.error('Failed to post notice');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmState({
      title: 'Delete this notice?',
      message: 'This will also remove the associated bell notification.',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await api.delete(`/notices/${id}`);
          setNotices(notices.filter((n) => n._id !== id));
          toast.success('Notice deleted');
        } catch (_) {
          toast.error('Failed to delete notice');
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {confirmState && (
        <ConfirmModal {...confirmState} onCancel={() => setConfirmState(null)} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Notice Board</h1>
          <p className="text-sm text-slate-500 mt-0.5">Post announcements for teachers, students, or everyone</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-brand text-white rounded-xl text-sm font-medium shadow-card hover:opacity-90 transition"
        >
          <Plus size={16} /> Post Notice
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">New Notice</h2>
            <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handlePost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Notice title"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write the notice..."
                rows={4}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Post For</label>
              <div className="flex gap-3">
                {[
                  { value: 'both', label: 'Everyone' },
                  { value: 'teacher', label: 'Teachers Only' },
                  { value: 'student', label: 'Students Only' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="audience"
                      value={value}
                      checked={form.audience === value}
                      onChange={() => setForm({ ...form, audience: value })}
                      className="accent-brand-600"
                    />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition">
                Cancel
              </button>
              <button type="submit" disabled={posting} className="px-5 py-2 bg-gradient-brand text-white rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
                {posting ? 'Posting...' : 'Post Notice'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : notices.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No notices posted yet</p>
          <p className="text-sm text-slate-400 mt-1">Post the first notice using the button above</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => {
            const { label, color } = AUDIENCE_LABELS[n.audience] || AUDIENCE_LABELS.both;
            return (
              <div key={n._id} className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                      <span className="text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                      {n.postedBy?.name && <span className="text-xs text-slate-400">by {n.postedBy.name}</span>}
                    </div>
                    <h3 className="font-semibold text-slate-900">{n.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(n._id)}
                    className="flex-shrink-0 p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
