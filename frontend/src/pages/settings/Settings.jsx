import { useState } from 'react';
import toast from 'react-hot-toast';
import { Save, User } from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Settings() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    password: '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, phone: form.phone };
      if (form.password) payload.password = form.password;
      await api.put('/auth/me', payload);
      await refresh();
      toast.success('Profile updated');
      setForm({ ...form, password: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile and preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-brand text-white flex items-center justify-center text-3xl font-display font-bold shadow-card">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="mt-4 font-display font-bold text-slate-900">{user?.name}</div>
            <div className="text-sm text-slate-500">{user?.email}</div>
            <span className="mt-3 badge bg-brand-50 text-brand-700 capitalize">
              <User size={12} /> {user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={submit} className="card p-6 lg:col-span-2">
          <h3 className="font-display font-bold text-lg mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Email (read-only)</label>
              <input value={user?.email || ''} readOnly className="input bg-slate-50" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">New Password (leave blank to keep)</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
