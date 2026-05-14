import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

function superAdminApi() {
  const token = localStorage.getItem('superAdminToken');
  return axios.create({ headers: { Authorization: `Bearer ${token}` } });
}

// ── Create School Modal ───────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', subdomain: '', email: '', phone: '', address: '',
  plan: 'trial', trialDays: '30',
  adminName: '', adminEmail: '', adminPassword: '',
};

function CreateSchoolModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => {
    let v = e.target.value;
    if (k === 'subdomain') v = v.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await superAdminApi().post('/api/superadmin/schools', form);
      toast.success(`School "${data.name}" created`);
      onCreated(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create school');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-slate-800 border border-white/10 rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="font-semibold text-white mb-5">Create School</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: 'name',      label: 'School Name', placeholder: 'Saraswati Public School', required: true },
            { key: 'subdomain', label: 'Subdomain',   placeholder: 'saraswati',               required: true },
            { key: 'email',     label: 'Email',       placeholder: 'admin@school.com' },
            { key: 'phone',     label: 'Phone',       placeholder: '9841000000' },
            { key: 'address',   label: 'Address',     placeholder: 'Kathmandu, Nepal' },
          ].map(({ key, label, placeholder, required }) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1">{label}{required && ' *'}</label>
              <input value={form[key]} onChange={set(key)} placeholder={placeholder} required={required}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
              {key === 'subdomain' && form.subdomain && (
                <p className="text-xs text-slate-500 mt-1">{form.subdomain}.myschoolsaas.com</p>
              )}
            </div>
          ))}
          <hr className="border-white/10" />
          <p className="text-xs text-slate-400 font-medium">Admin Account</p>
          {[
            { key: 'adminName',     label: 'Admin Name',     placeholder: 'Ramesh Sharma' },
            { key: 'adminEmail',    label: 'Admin Email',    placeholder: 'admin@school.com', required: true },
            { key: 'adminPassword', label: 'Admin Password', placeholder: 'min 6 characters', required: true },
          ].map(({ key, label, placeholder, required }) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1">{label}{required && ' *'}</label>
              <input type={key === 'adminPassword' ? 'password' : 'text'}
                value={form[key]} onChange={set(key)} placeholder={placeholder} required={required}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Plan</label>
              <select value={form.plan} onChange={set('plan')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
                <option value="trial">Trial</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Trial days</label>
              <input type="number" value={form.trialDays} onChange={set('trialDays')} min="1" max="365"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white hover:border-white/20 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm transition disabled:opacity-50">
              {saving ? 'Creating…' : 'Create School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Suspend Modal ─────────────────────────────────────────────────────────────
function SuspendModal({ school, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await superAdminApi().post(`/api/superadmin/schools/${school._id}/suspend`, { reason });
      toast.success(`"${school.name}" suspended`);
      onDone(school._id, false);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to suspend school');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-slate-800 border border-white/10 rounded-xl w-full max-w-sm p-6">
        <h2 className="font-semibold text-white mb-1">Suspend School</h2>
        <p className="text-xs text-slate-400 mb-4">This will immediately block all logins for <span className="text-white">{school.name}</span>.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Reason (optional)</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Non-payment"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-medium text-sm transition disabled:opacity-50">
              {saving ? 'Suspending…' : 'Suspend'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Extend Trial Modal ────────────────────────────────────────────────────────
function ExtendTrialModal({ school, onClose, onDone }) {
  const [days, setDays] = useState('14');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await superAdminApi().post(`/api/superadmin/schools/${school._id}/extend-trial`, { days: Number(days) });
      toast.success(`Trial extended by ${days} days`);
      onDone(school._id, data.trialEndsAt);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to extend trial');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-slate-800 border border-white/10 rounded-xl w-full max-w-sm p-6">
        <h2 className="font-semibold text-white mb-1">Extend Trial</h2>
        <p className="text-xs text-slate-400 mb-4"><span className="text-white">{school.name}</span></p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Days to add *</label>
            <input type="number" value={days} onChange={(e) => setDays(e.target.value)} min="1" max="365" required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm transition disabled:opacity-50">
              {saving ? 'Extending…' : 'Extend'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics]       = useState(null);
  const [schools, setSchools]       = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [suspendTarget, setSuspendTarget]     = useState(null);
  const [extendTarget, setExtendTarget]       = useState(null);

  // Filters
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [plan,   setPlan]     = useState('');

  const LIMIT = 10;
  const user = JSON.parse(localStorage.getItem('superAdminUser') || '{}');

  const fetchSchools = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: LIMIT });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (plan)   params.set('plan',   plan);

      const { data } = await superAdminApi().get(`/api/superadmin/schools?${params}`);
      setSchools(data.schools ?? data);
      setTotal(data.total ?? (data.schools ?? data).length);
      setPage(pg);
    } catch (err) {
      if (err.response?.status === 401) navigate('/superadmin/login');
      else toast.error('Failed to load schools');
    } finally {
      setLoading(false);
    }
  }, [search, status, plan, navigate]);

  // Initial load — metrics + schools in parallel
  useEffect(() => {
    const api = superAdminApi();
    Promise.all([
      api.get('/api/superadmin/metrics'),
      api.get('/api/superadmin/schools?limit=10'),
    ])
      .then(([m, s]) => {
        setMetrics(m.data);
        setSchools(s.data.schools ?? s.data);
        setTotal(s.data.total ?? (s.data.schools ?? s.data).length);
      })
      .catch((err) => {
        if (err.response?.status === 401) navigate('/superadmin/login');
        else toast.error('Failed to load data');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Re-fetch when filters change (debounced via useEffect dep)
  useEffect(() => {
    fetchSchools(1);
  }, [status, plan]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSchools(1);
  };

  const handleActivate = async (school) => {
    try {
      await superAdminApi().post(`/api/superadmin/schools/${school._id}/activate`);
      setSchools((prev) => prev.map((s) => s._id === school._id ? { ...s, isActive: true } : s));
      toast.success(`"${school.name}" activated`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdminUser');
    navigate('/superadmin/login');
  };

  const pages = Math.ceil(total / LIMIT);

  const planBadge = (p) => {
    const map = {
      trial:   'bg-amber-500/20 text-amber-300',
      starter: 'bg-sky-500/20 text-sky-300',
      pro:     'bg-violet-500/20 text-violet-300',
    };
    return map[p] || 'bg-white/10 text-slate-300';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navbar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="font-semibold text-sm">Super Admin Console</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{user.name}</span>
          <button onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Schools',  value: metrics.totalSchools  },
              { label: 'Active Schools', value: metrics.activeSchools },
              { label: 'On Trial',       value: metrics.trialSchools  },
              { label: 'Total Users',    value: metrics.totalUsers    },
            ].map((m) => (
              <div key={m.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{m.value}</p>
                <p className="text-xs text-slate-400 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Schools table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or subdomain…"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
              <button type="submit"
                className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition">
                Search
              </button>
            </form>

            {/* Status filter */}
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50">
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="trial">Trial</option>
              <option value="expired">Expired</option>
            </select>

            {/* Plan filter */}
            <select value={plan} onChange={(e) => setPlan(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50">
              <option value="">All plans</option>
              <option value="trial">Trial</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
            </select>

            <button onClick={() => setShowCreate(true)}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium transition whitespace-nowrap">
              + New School
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-medium">Name</th>
                  <th className="px-5 py-3 text-left font-medium">Subdomain</th>
                  <th className="px-5 py-3 text-left font-medium">Plan</th>
                  <th className="px-5 py-3 text-left font-medium">Users</th>
                  <th className="px-5 py-3 text-left font-medium">Trial ends</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500 text-xs">Loading…</td>
                  </tr>
                ) : schools.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500 text-xs">No schools found</td>
                  </tr>
                ) : schools.map((s) => (
                  <tr key={s._id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-5 py-3 font-medium">{s.name}</td>
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs">{s.subdomain}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${planBadge(s.plan)}`}>
                        {s.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{s.userCount ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {s.trialEndsAt ? new Date(s.trialEndsAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs ${s.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {s.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {s.isActive ? (
                          <button onClick={() => setSuspendTarget(s)}
                            className="text-xs px-2 py-1 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition">
                            Suspend
                          </button>
                        ) : (
                          <button onClick={() => handleActivate(s)}
                            className="text-xs px-2 py-1 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition">
                            Activate
                          </button>
                        )}
                        <button onClick={() => setExtendTarget(s)}
                          className="text-xs px-2 py-1 rounded-lg border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 transition">
                          + Trial
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>{total} schools</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => fetchSchools(page - 1)}
                  className="px-2 py-1 rounded border border-white/10 disabled:opacity-30 hover:border-white/20 transition">
                  ←
                </button>
                <span>Page {page} of {pages}</span>
                <button disabled={page >= pages} onClick={() => fetchSchools(page + 1)}
                  className="px-2 py-1 rounded border border-white/10 disabled:opacity-30 hover:border-white/20 transition">
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showCreate && (
        <CreateSchoolModal
          onClose={() => setShowCreate(false)}
          onCreated={(school) => {
            setSchools((prev) => [{ ...school, userCount: 0 }, ...prev]);
            setMetrics((m) => m ? { ...m, totalSchools: m.totalSchools + 1, activeSchools: m.activeSchools + 1 } : m);
          }}
        />
      )}
      {suspendTarget && (
        <SuspendModal
          school={suspendTarget}
          onClose={() => setSuspendTarget(null)}
          onDone={(id) => {
            setSchools((prev) => prev.map((s) => s._id === id ? { ...s, isActive: false } : s));
            setSuspendTarget(null);
          }}
        />
      )}
      {extendTarget && (
        <ExtendTrialModal
          school={extendTarget}
          onClose={() => setExtendTarget(null)}
          onDone={(id, trialEndsAt) => {
            setSchools((prev) => prev.map((s) => s._id === id ? { ...s, trialEndsAt } : s));
            setExtendTarget(null);
          }}
        />
      )}
    </div>
  );
}
