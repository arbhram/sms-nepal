import { useState } from 'react';
import toast from 'react-hot-toast';
import { Save, User, KeyRound } from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Settings() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const submitProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/auth/me', { name: profile.name, phone: profile.phone });
      await refresh();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (pwd.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters');
    }
    setSavingPwd(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      toast.success('Password changed successfully');
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile and preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Avatar card */}
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

        <div className="lg:col-span-2 space-y-5">
          {/* Profile form */}
          <form onSubmit={submitProfile} className="card p-6">
            <h3 className="font-display font-bold text-lg mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Email (read-only)</label>
                <input value={user?.email || ''} readOnly className="input bg-slate-50" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button type="submit" disabled={savingProfile} className="btn-primary">
                <Save size={16} /> {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Change password form */}
          <form onSubmit={submitPassword} className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound size={18} className="text-slate-500" />
              <h3 className="font-display font-bold text-lg">Change Password</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  required
                  value={pwd.currentPassword}
                  onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={pwd.newPassword}
                  onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={pwd.confirmPassword}
                  onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button type="submit" disabled={savingPwd} className="btn-primary">
                <KeyRound size={16} /> {savingPwd ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
