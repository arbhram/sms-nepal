import { useState, useEffect } from 'react';
import { Megaphone } from 'lucide-react';
import api from '../../api/axios.js';

const AUDIENCE_LABELS = {
  student: { label: 'Students', color: 'bg-green-100 text-green-700' },
  both: { label: 'Everyone', color: 'bg-purple-100 text-purple-700' },
};

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function StudentNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notices')
      .then(({ data }) => setNotices(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold text-slate-900">Notice Board</h1>
        <p className="text-sm text-slate-500 mt-0.5">Announcements from the administration</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading...</div>
      ) : notices.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No notices yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => {
            const { label, color } = AUDIENCE_LABELS[n.audience] || AUDIENCE_LABELS.both;
            return (
              <div key={n._id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                  <span className="text-xs text-slate-400">{formatDate(n.createdAt)}</span>
                </div>
                <h3 className="font-semibold text-slate-900">{n.title}</h3>
                <p className="text-sm text-slate-600 mt-1.5 whitespace-pre-wrap leading-relaxed">{n.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
