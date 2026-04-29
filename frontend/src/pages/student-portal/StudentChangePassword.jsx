import { useState } from 'react';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff } from 'lucide-react';
import api from '../../api/axios.js';

export default function StudentChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return toast.error('New passwords do not match');
    if (form.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password updated successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ name, label, showKey }) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          type={show[showKey] ? 'text' : 'password'}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          className="input pl-9 pr-9"
          placeholder="••••••••"
          required
        />
        <button type="button" onClick={() => setShow({ ...show, [showKey]: !show[showKey] })}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-md">
      <h1 className="text-2xl font-display font-bold text-slate-900">Change Password</h1>
      <div className="bg-white rounded-xl border p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field name="currentPassword" label="Current Password" showKey="current" />
          <Field name="newPassword" label="New Password" showKey="new" />
          <Field name="confirmPassword" label="Confirm New Password" showKey="confirm" />
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
