import { useEffect, useState } from 'react';
import api from '../../api/axios.js';

const STATUS_COLOR = { Present: 'bg-green-100 text-green-700', Absent: 'bg-rose-100 text-rose-700', Late: 'bg-yellow-100 text-yellow-700', Leave: 'bg-blue-100 text-blue-700' };

export default function StudentAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student-portal/attendance').then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-display font-bold text-slate-900">My Attendance</h1>

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(data.summary).map(([status, count]) => (
            <div key={status} className="bg-white rounded-xl border p-4">
              <p className="text-2xl font-display font-bold text-slate-900">{count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{status}</p>
            </div>
          ))}
          <div className="bg-white rounded-xl border p-4 col-span-2 lg:col-span-4">
            <p className="text-xs text-slate-500 mb-2">Attendance Rate</p>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${data.percentage}%` }} />
            </div>
            <p className="text-sm font-semibold text-slate-800 mt-1">{data.percentage}%</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              {['Date', 'Status', 'Remarks'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : !data?.records?.length ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No attendance records found.</td></tr>
            ) : data.records.map((r) => (
              <tr key={r._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-700">{new Date(r.date).toLocaleDateString('en-NP', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[r.status]}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{r.remarks || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
