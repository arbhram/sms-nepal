import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

function superAdminApi() {
  const token = localStorage.getItem('superAdminToken');
  return axios.create({
    headers: { Authorization: `Bearer ${token}` },
  });
}

const EMPTY_FORM = { name: '', subdomain: '', email: '', phone: '', address: '', plan: 'trial', trialDays: '30' };

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
      <div className="bg-slate-800 border border-white/10 rounded-xl w-full max-w-md p-6">
        <h2 className="font-semibold text-white mb-5">Create School</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: 'name',      label: 'School Name',  placeholder: 'Saraswati Public School', required: true },
            { key: 'subdomain', label: 'Subdomain',    placeholder: 'saraswati', required: true },
            { key: 'email',     label: 'Email',        placeholder: 'admin@school.com' },
            { key: 'phone',     label: 'Phone',        placeholder: '9841000000' },
            { key: 'address',   label: 'Address',      placeholder: 'Kathmandu, Nepal' },
          ].map(({ key, label, placeholder, required }) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1">{label}{required && ' *'}</label>
              <input
                value={form[key]}
                onChange={set(key)}
                placeholder={placeholder}
                required={required}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
              {key === 'subdomain' && form.subdomain && (
                <p className="text-xs text-slate-500 mt-1">{form.subdomain}.myschoolsaas.com</p>
              )}
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Plan</label>
              <select value={form.plan} onChange={set('plan')} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
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

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const user = JSON.parse(localStorage.getItem('superAdminUser') || '{}');

  useEffect(() => {
    const api = superAdminApi();
    Promise.all([
      api.get('/api/superadmin/metrics'),
      api.get('/api/superadmin/schools'),
    ])
      .then(([m, s]) => {
        setMetrics(m.data);
        setSchools(s.data);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          navigate('/superadmin/login');
        } else {
          toast.error('Failed to load data');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleToggle = async (school) => {
    const api = superAdminApi();
    const action = school.isActive ? 'suspend' : 'activate';
    try {
      await api.put(`/api/superadmin/schools/${school._id}/${action}`);
      setSchools((prev) =>
        prev.map((s) => (s._id === school._id ? { ...s, isActive: !s.isActive } : s)),
      );
      toast.success(`School ${action}d`);
    } catch {
      toast.error(`Failed to ${action} school`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdminUser');
    navigate('/superadmin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }

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
          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Schools', value: metrics.totalSchools },
              { label: 'Active Schools', value: metrics.activeSchools },
              { label: 'On Trial', value: metrics.trialSchools },
              { label: 'Total Users', value: metrics.totalUsers },
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
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-semibold text-sm">Schools</h2>
            <button
              onClick={() => setShowCreate(true)}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium transition"
            >
              + New School
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-medium">Name</th>
                  <th className="px-5 py-3 text-left font-medium">Subdomain</th>
                  <th className="px-5 py-3 text-left font-medium">Plan</th>
                  <th className="px-5 py-3 text-left font-medium">Users</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((s) => (
                  <tr key={s._id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-5 py-3 font-medium">{s.name}</td>
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs">{s.subdomain}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.plan === 'trial' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {s.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{s.userCount ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs ${s.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {s.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleToggle(s)}
                        className={`text-xs px-3 py-1 rounded-lg border transition ${
                          s.isActive
                            ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                            : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        {s.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showCreate && (
        <CreateSchoolModal
          onClose={() => setShowCreate(false)}
          onCreated={(school) => {
            setSchools((prev) => [{ ...school, userCount: 0 }, ...prev]);
            setMetrics((m) => m ? { ...m, totalSchools: m.totalSchools + 1, activeSchools: m.activeSchools + 1 } : m);
          }}
        />
      )}
    </div>
  );
}
