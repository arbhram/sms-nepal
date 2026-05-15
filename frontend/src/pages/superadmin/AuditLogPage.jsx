import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

function superAdminApi() {
  const token = localStorage.getItem('superAdminToken');
  return axios.create({ headers: { Authorization: `Bearer ${token}` } });
}

export default function AuditLogPage() {
  const navigate = useNavigate();
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page,  setPage]      = useState(1);
  const [loading, setLoading] = useState(true);

  const [action,   setAction]   = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [from,     setFrom]     = useState('');
  const [to,       setTo]       = useState('');

  const LIMIT = 50;

  const fetchLogs = async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: LIMIT });
      if (action)   params.set('action',   action);
      if (schoolId) params.set('schoolId', schoolId);
      if (from)     params.set('from',     from);
      if (to)       params.set('to',       to);

      const { data } = await superAdminApi().get(`/api/superadmin/audit-log?${params}`);
      setLogs(data.logs);
      setTotal(data.total);
      setPage(pg);
    } catch (err) {
      if (err.response?.status === 401) navigate('/superadmin/login');
      else toast.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const pages = Math.ceil(total / LIMIT);

  const actionColor = (a) => {
    if (a.includes('suspend') || a.includes('delet') || a.includes('disabl')) return 'text-rose-600 bg-rose-50 ring-rose-200';
    if (a.includes('creat') || a.includes('restor') || a.includes('activ') || a.includes('enabl')) return 'text-emerald-700 bg-emerald-50 ring-emerald-200';
    if (a.includes('reset') || a.includes('logo') || a.includes('updat')) return 'text-amber-700 bg-amber-50 ring-amber-200';
    return 'text-slate-700 bg-slate-100 ring-slate-200';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ABAB5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <Link to="/superadmin/dashboard" className="text-sm text-slate-500 hover:text-slate-900 transition">
            Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-900">Audit Log</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900">Audit Log</h1>
          <p className="text-sm text-slate-500 mt-1">All super admin actions across the platform.</p>
        </div>

        {/* Filters */}
        <form onSubmit={handleSearch} className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs text-slate-500 mb-1">Action contains</label>
              <input value={action} onChange={(e) => setAction(e.target.value)}
                placeholder="e.g. school.suspended"
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500" />
            </div>
            <div className="min-w-[200px]">
              <label className="block text-xs text-slate-500 mb-1">School ID</label>
              <input value={schoolId} onChange={(e) => setSchoolId(e.target.value)}
                placeholder="MongoDB ObjectId"
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 bg-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 bg-white" />
            </div>
            <button type="submit"
              className="px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium transition">
              Filter
            </button>
            <button type="button" onClick={() => { setAction(''); setSchoolId(''); setFrom(''); setTo(''); setTimeout(() => fetchLogs(1), 0); }}
              className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition">
              Clear
            </button>
          </div>
        </form>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Events</h2>
            <span className="text-xs text-slate-400">{total} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-medium">Action</th>
                  <th className="px-5 py-3 text-left font-medium">Actor</th>
                  <th className="px-5 py-3 text-left font-medium">Target</th>
                  <th className="px-5 py-3 text-left font-medium">Changes</th>
                  <th className="px-5 py-3 text-left font-medium">IP</th>
                  <th className="px-5 py-3 text-left font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-xs">Loading…</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-xs">No events found</td></tr>
                ) : logs.map((l) => (
                  <tr key={l._id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-mono font-medium ring-1 ${actionColor(l.action)}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">{l.actorName || '—'}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {l.targetName && <span className="font-medium text-slate-700">{l.targetName}</span>}
                      {l.targetType && <span className="text-slate-400"> ({l.targetType})</span>}
                      {!l.targetName && '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400 max-w-xs">
                      {l.changes?.after
                        ? <span className="font-mono">{JSON.stringify(l.changes.after).slice(0, 80)}</span>
                        : l.reason || '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400 font-mono">{l.ipAddress || '—'}</td>
                    <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{total} events</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => fetchLogs(page - 1)}
                  className="px-2 py-1 rounded border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition">←</button>
                <span>Page {page} of {pages}</span>
                <button disabled={page >= pages} onClick={() => fetchLogs(page + 1)}
                  className="px-2 py-1 rounded border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition">→</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
