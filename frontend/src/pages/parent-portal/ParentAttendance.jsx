import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users } from 'lucide-react';
import api from '../../api/axios.js';

const STATUS_STYLES = {
  Present: 'bg-emerald-100 text-emerald-700',
  Absent: 'bg-rose-100 text-rose-700',
  Late: 'bg-amber-100 text-amber-700',
  Leave: 'bg-blue-100 text-blue-700',
};

export default function ParentAttendance() {
  const { activeChild } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeChild) return;
    setLoading(true);
    api.get(`/parent-portal/children/${activeChild._id}/attendance`)
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeChild?._id]);

  if (!activeChild) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Users size={40} className="text-slate-300" />
        <p className="text-slate-500 font-medium">No children linked to your account</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500 mt-0.5">{activeChild.fullName}</p>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Present', value: data.summary?.Present ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Absent', value: data.summary?.Absent ?? 0, color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Leave', value: data.summary?.Leave ?? 0, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Late', value: data.summary?.Late ?? 0, color: 'text-slate-700', bg: 'bg-slate-50' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-4 text-center border border-slate-100`}>
                <div className={`text-3xl font-display font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Attendance rate</span>
              <span className="font-bold text-slate-900">{data.percentage}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
                style={{ width: `${data.percentage}%` }}
              />
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Date', 'Status', 'Remarks'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : !data || data.records.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No attendance records found.</td></tr>
            ) : data.records.map((r) => (
              <tr key={r._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-700">{new Date(r.date).toLocaleDateString('en-NP', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[r.status] || 'bg-slate-100 text-slate-600'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{r.remarks || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
