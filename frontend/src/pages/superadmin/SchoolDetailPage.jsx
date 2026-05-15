import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';

// ── helpers ───────────────────────────────────────────────────────────────────
function PlanBadge({ plan }) {
  const map = {
    trial:      'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    starter:    'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    pro:        'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
    enterprise: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[plan] || 'bg-slate-100 text-slate-600'}`}>
      {plan}
    </span>
  );
}

// ── Edit School Modal ─────────────────────────────────────────────────────────
function EditSchoolModal({ school, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:        school.name        || '',
    email:       school.email       || '',
    phone:       school.phone       || '',
    address:     school.address     || '',
    city:        school.city        || '',
    plan:        school.plan        || 'trial',
    timezone:    school.timezone    || 'Asia/Kathmandu',
    currency:    school.currency    || 'NPR',
    customDomain: school.customDomain || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch(`/superadmin/schools/${school._id}`, form);
      toast.success('School updated');
      onSaved(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="font-semibold text-slate-900 mb-5">Edit School</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: 'name',    l: 'School Name',   req: true },
              { k: 'email',   l: 'Contact Email' },
              { k: 'phone',   l: 'Phone' },
              { k: 'city',    l: 'City' },
              { k: 'address', l: 'Address' },
              { k: 'customDomain', l: 'Custom Domain' },
            ].map(({ k, l, req }) => (
              <div key={k} className={k === 'address' || k === 'customDomain' ? 'col-span-2' : ''}>
                <label className="block text-xs text-slate-500 mb-1">{l}{req && ' *'}</label>
                <input value={form[k]} onChange={set(k)} required={req}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Plan</label>
              <select value={form.plan} onChange={set('plan')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-teal-500 bg-white">
                <option value="trial">Trial</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Timezone</label>
              <input value={form.timezone} onChange={set('timezone')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Currency</label>
              <input value={form.currency} onChange={set('currency')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-teal-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm transition disabled:opacity-50">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Reset Password Modal ──────────────────────────────────────────────────────
function ResetPasswordModal({ schoolId, user, onClose }) {
  const [tempPassword, setTempPassword] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleReset = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(
        `/superadmin/schools/${schoolId}/users/${user._id}/reset-password`,
        { reason },
      );
      setTempPassword(data.tempPassword);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="font-semibold text-slate-900 mb-1">Reset Password</h2>
        <p className="text-xs text-slate-500 mb-4">
          For <span className="text-slate-900 font-medium">{user.email}</span>
        </p>
        {tempPassword ? (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700 mb-2 font-medium">Temporary password — shown once only</p>
              <p className="font-mono text-lg text-amber-900 tracking-widest text-center select-all">{tempPassword}</p>
            </div>
            <p className="text-xs text-slate-500">Share this with the user and ask them to change it on first login.</p>
            <button onClick={onClose}
              className="w-full py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition">
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Reason (optional)</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. User forgot password"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-teal-500" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleReset} disabled={loading}
                className="flex-1 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm transition disabled:opacity-50">
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────
function OverviewTab({ school, onEdit }) {
  const fields = [
    { label: 'Subdomain',    value: school.subdomain },
    { label: 'Email',        value: school.email || '—' },
    { label: 'Phone',        value: school.phone || '—' },
    { label: 'City',         value: school.city  || '—' },
    { label: 'Address',      value: school.address || '—' },
    { label: 'Timezone',     value: school.timezone },
    { label: 'Currency',     value: school.currency },
    { label: 'Custom Domain',value: school.customDomain || '—' },
    { label: 'Created',      value: new Date(school.createdAt).toLocaleDateString() },
    { label: 'Trial ends',   value: school.trialEndsAt ? new Date(school.trialEndsAt).toLocaleDateString() : '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-semibold text-slate-900">{school.name}</h2>
            <PlanBadge plan={school.plan} />
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${school.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${school.isActive ? 'bg-emerald-500' : 'bg-rose-400'}`} />
              {school.isActive ? 'Active' : 'Suspended'}
            </span>
          </div>
          {school.lastLoginBy && (
            <p className="text-xs text-slate-500">
              Last login: <span className="text-slate-700">{school.lastLoginBy.name || school.lastLoginBy.email}</span>
              {school.lastLogin && ` on ${new Date(school.lastLogin).toLocaleDateString()}`}
            </p>
          )}
        </div>
        <button onClick={onEdit}
          className="text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
          Edit
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Users',    value: school.userCount    ?? '—' },
          { label: 'Students', value: school.studentCount ?? '—' },
          { label: 'Teachers', value: school.teacherCount ?? '—' },
          { label: 'Fees collected', value: school.feesCollected != null ? `NPR ${school.feesCollected.toLocaleString()}` : '—' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Details</h3>
        </div>
        <dl className="divide-y divide-slate-100">
          {fields.map(({ label, value }) => (
            <div key={label} className="px-5 py-3 flex items-center">
              <dt className="w-36 text-xs text-slate-500 shrink-0">{label}</dt>
              <dd className="text-sm text-slate-900 font-mono">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

// ── Tab: Branding ─────────────────────────────────────────────────────────────
function BrandingTab({ school, onSchoolUpdated }) {
  const [primaryColor,   setPrimaryColor]   = useState(school.primaryColor   || '#0c7fff');
  const [secondaryColor, setSecondaryColor] = useState(school.secondaryColor || '#f59e0b');
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleColorSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch(`/superadmin/schools/${school._id}`, {
        primaryColor, secondaryColor,
      });
      toast.success('Colors saved');
      onSchoolUpdated(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save colors');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const { data } = await api.post(`/superadmin/schools/${school._id}/logo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Logo updated');
      onSchoolUpdated(data.school);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      {/* Logo */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-medium text-slate-900 mb-4">School Logo</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
            {school.logoUrl
              ? <img src={school.logoUrl} alt="logo" className="w-full h-full object-contain" />
              : <span className="text-slate-400 text-2xl font-bold">{school.name?.[0]}</span>
            }
          </div>
          <div>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="text-sm px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-medium transition disabled:opacity-50">
              {uploading ? 'Uploading…' : 'Upload logo'}
            </button>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP up to 5 MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>
      </div>

      {/* Colors */}
      <form onSubmit={handleColorSave} className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-medium text-slate-900 mb-4">Brand Colors</h3>
        <div className="space-y-4">
          {[
            { label: 'Primary color',   value: primaryColor,   set: setPrimaryColor },
            { label: 'Secondary color', value: secondaryColor, set: setSecondaryColor },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex items-center gap-4">
              <input type="color" value={value} onChange={(e) => set(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">{label}</label>
                <input
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  pattern="^#[0-9a-fA-F]{6}$"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                />
              </div>
              <div className="w-8 h-8 rounded-lg border border-slate-200 shrink-0" style={{ backgroundColor: value }} />
            </div>
          ))}
        </div>
        <button type="submit" disabled={saving}
          className="mt-5 w-full py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm transition disabled:opacity-50">
          {saving ? 'Saving…' : 'Save colors'}
        </button>
      </form>
    </div>
  );
}

// ── Tab: Users ────────────────────────────────────────────────────────────────
function UsersTab({ schoolId }) {
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page,  setPage]      = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [role,   setRole]     = useState('');
  const [resetTarget, setResetTarget] = useState(null);
  const LIMIT = 20;

  const fetchUsers = async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: LIMIT });
      if (search) params.set('search', search);
      if (role)   params.set('role', role);
      const { data } = await api.get(`/superadmin/schools/${schoolId}/users?${params}`);
      setUsers(data.users ?? data);
      setTotal(data.total ?? (data.users ?? data).length);
      setPage(pg);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(1); }, [schoolId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchUsers(1); }, [role]);      // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleActive = async (u) => {
    try {
      const { data } = await api.patch(
        `/superadmin/schools/${schoolId}/users/${u._id}`,
        { isActive: !u.isActive },
      );
      setUsers((prev) => prev.map((x) => x._id === u._id ? { ...x, isActive: data.user.isActive } : x));
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); fetchUsers(1); }} className="flex gap-2 flex-1 min-w-[200px]">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500" />
          <button type="submit"
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
            Search
          </button>
        </form>
        <select value={role} onChange={(e) => setRole(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:border-teal-500">
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider bg-slate-50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-slate-900">{u.name || '—'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.isActive !== false ? 'text-emerald-600' : 'text-rose-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.isActive !== false ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                    {u.isActive !== false ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setResetTarget(u)}
                      className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition">
                      Reset pwd
                    </button>
                    <button onClick={() => handleToggleActive(u)}
                      className={`text-xs px-2 py-1 rounded-lg border transition ${
                        u.isActive !== false
                          ? 'border-rose-200 text-rose-500 hover:bg-rose-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}>
                      {u.isActive !== false ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{total} users</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => fetchUsers(page - 1)}
                className="px-2 py-1 rounded border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition">←</button>
              <span>Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => fetchUsers(page + 1)}
                className="px-2 py-1 rounded border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition">→</button>
            </div>
          </div>
        )}
      </div>

      {resetTarget && (
        <ResetPasswordModal
          schoolId={schoolId}
          user={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}

// ── Tab: Activity (audit log for this school) ─────────────────────────────────
function ActivityTab({ schoolId }) {
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page,  setPage]      = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const fetchLogs = async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ schoolId, page: pg, limit: LIMIT });
      const { data } = await api.get(`/superadmin/audit-log?${params}`);
      setLogs(data.logs);
      setTotal(data.total);
      setPage(pg);
    } catch {
      toast.error('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(1); }, [schoolId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider bg-slate-50">
              <th className="px-4 py-3 text-left font-medium">Action</th>
              <th className="px-4 py-3 text-left font-medium">By</th>
              <th className="px-4 py-3 text-left font-medium">Target</th>
              <th className="px-4 py-3 text-left font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs">Loading…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs">No activity yet</td></tr>
            ) : logs.map((l) => (
              <tr key={l._id} className="border-b border-slate-50 hover:bg-slate-50/60">
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{l.action}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{l.actorName || '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{l.targetName || '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {new Date(l.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
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
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = ['Overview', 'Branding', 'Users', 'Activity'];

export default function SchoolDetailPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [school, setSchool]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('Overview');
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    api.get(`/superadmin/schools/${id}`)
      .then(({ data }) => setSchool(data))
      .catch((err) => {
        if (err.response?.status === 401) navigate('/superadmin/login');
        else toast.error('Failed to load school');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">School not found.</p>
      </div>
    );
  }

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
          <span className="text-sm font-medium text-slate-900">{school.name}</span>
        </div>
        <Link to="/superadmin/audit-log"
          className="text-xs text-slate-500 hover:text-slate-900 transition px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300">
          Audit Log
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                tab === t
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Overview' && (
          <OverviewTab school={school} onEdit={() => setShowEdit(true)} />
        )}
        {tab === 'Branding' && (
          <BrandingTab school={school} onSchoolUpdated={setSchool} />
        )}
        {tab === 'Users' && (
          <UsersTab schoolId={id} />
        )}
        {tab === 'Activity' && (
          <ActivityTab schoolId={id} />
        )}
      </main>

      {showEdit && (
        <EditSchoolModal
          school={school}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setSchool((prev) => ({ ...prev, ...updated }))}
        />
      )}
    </div>
  );
}
