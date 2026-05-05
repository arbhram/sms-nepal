import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Save, User, KeyRound, School, CalendarCog, ArrowRight,
  CheckCircle2, History, AlertTriangle,
} from 'lucide-react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Loader } from '../../components/ui/Misc.jsx';
import {
  currentAcademicYear, academicYearOptions, formatAcademicYear, nextAcademicYear, formatBS,
} from '../../utils/nepaliDate.js';

const TABS = [
  { key: 'school',   label: 'School Profile',  icon: School },
  { key: 'year',     label: 'Academic Year',    icon: CalendarCog },
  { key: 'account',  label: 'Account',          icon: User },
];

const PROVINCES = [
  'Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim',
];

export default function Settings() {
  const { user, refresh } = useAuth();
  const [tab, setTab] = useState('school');

  // ── School profile ──────────────────────────────────────────────────────────
  const [config, setConfig]     = useState(null);
  const [school, setSchool]     = useState({});
  const [configLoading, setConfigLoading] = useState(true);
  const [savingSchool, setSavingSchool]   = useState(false);

  useEffect(() => {
    api.get('/system-config')
      .then(({ data }) => {
        setConfig(data);
        setSchool({
          schoolName:     data.schoolName || '',
          address:        data.address || '',
          phone:          data.phone || '',
          email:          data.email || '',
          website:        data.website || '',
          district:       data.district || '',
          province:       data.province || '',
          registrationNo: data.registrationNo || '',
          principalName:  data.principalName || '',
        });
      })
      .catch(() => toast.error('Failed to load system config'))
      .finally(() => setConfigLoading(false));
  }, []);

  const saveSchool = async (e) => {
    e.preventDefault();
    setSavingSchool(true);
    try {
      const { data } = await api.put('/system-config', school);
      setConfig(data);
      toast.success('School profile saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSavingSchool(false); }
  };

  // ── Academic year ───────────────────────────────────────────────────────────
  const activeYear  = config?.currentAcademicYear || currentAcademicYear();
  const upgradeYear = nextAcademicYear(activeYear);
  const [copyStructures, setCopyStructures] = useState(true);
  const [upgradeNotes,   setUpgradeNotes]   = useState('');
  const [upgradeConfirm, setUpgradeConfirm] = useState(false);
  const [upgrading, setUpgrading]           = useState(false);

  const doUpgrade = async () => {
    setUpgrading(true);
    try {
      const { data } = await api.post('/system-config/upgrade-year', {
        newYear:            upgradeYear,
        copyFeeStructures:  copyStructures,
        notes:              upgradeNotes,
      });
      setConfig(data.config);
      setUpgradeConfirm(false);
      setUpgradeNotes('');
      toast.success(data.message + (data.structuresCopied ? ` (${data.structuresCopied} fee structure${data.structuresCopied !== 1 ? 's' : ''} copied)` : ''));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upgrade failed');
    } finally { setUpgrading(false); }
  };

  // ── Account ─────────────────────────────────────────────────────────────────
  const [profile, setProfile]     = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwd, setPwd]             = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd,     setSavingPwd]     = useState(false);

  const submitProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/auth/me', { name: profile.name, phone: profile.phone });
      await refresh();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSavingProfile(false); }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirmPassword) return toast.error('Passwords do not match');
    if (pwd.newPassword.length < 6) return toast.error('Minimum 6 characters');
    setSavingPwd(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwd.currentPassword,
        newPassword:     pwd.newPassword,
      });
      toast.success('Password changed');
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSavingPwd(false); }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage school profile, academic year, and your account</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── School Profile ─────────────────────────────────────────────────── */}
      {tab === 'school' && (
        configLoading ? <Loader /> : (
          <form onSubmit={saveSchool} className="space-y-5">
            <div className="card p-6">
              <h3 className="font-display font-bold text-slate-900 mb-5">School Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">School Name</label>
                  <input value={school.schoolName} onChange={(e) => setSchool({ ...school, schoolName: e.target.value })} className="input" placeholder="e.g. Sunrise Secondary School" />
                </div>
                <div>
                  <label className="label">Principal Name</label>
                  <input value={school.principalName} onChange={(e) => setSchool({ ...school, principalName: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Registration No.</label>
                  <input value={school.registrationNo} onChange={(e) => setSchool({ ...school, registrationNo: e.target.value })} className="input" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display font-bold text-slate-900 mb-5">Contact & Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone</label>
                  <input value={school.phone} onChange={(e) => setSchool({ ...school, phone: e.target.value })} className="input" placeholder="01-XXXXXXX" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={school.email} onChange={(e) => setSchool({ ...school, email: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Website</label>
                  <input value={school.website} onChange={(e) => setSchool({ ...school, website: e.target.value })} className="input" placeholder="https://..." />
                </div>
                <div>
                  <label className="label">District</label>
                  <input value={school.district} onChange={(e) => setSchool({ ...school, district: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Province</label>
                  <select value={school.province} onChange={(e) => setSchool({ ...school, province: e.target.value })} className="input">
                    <option value="">Select province…</option>
                    {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label">Full Address</label>
                  <input value={school.address} onChange={(e) => setSchool({ ...school, address: e.target.value })} className="input" placeholder="Ward No., Municipality, District" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={savingSchool} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                <Save size={15} /> {savingSchool ? 'Saving…' : 'Save School Profile'}
              </button>
            </div>
          </form>
        )
      )}

      {/* ── Academic Year ──────────────────────────────────────────────────── */}
      {tab === 'year' && (
        configLoading ? <Loader /> : (
          <div className="space-y-5">
            {/* Current year banner */}
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <CalendarCog size={26} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Active Academic Year</p>
                  <p className="text-3xl font-display font-bold text-slate-900">{formatAcademicYear(activeYear)}</p>
                  <p className="text-sm text-slate-500 mt-0.5">All fee records, gradebooks, and attendance will use this year</p>
                </div>
                <span className="ml-auto flex items-center gap-1.5 text-emerald-600 text-sm font-semibold bg-emerald-50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 size={14} /> Active
                </span>
              </div>
            </div>

            {/* Year overview grid */}
            <div className="grid grid-cols-3 gap-4">
              {academicYearOptions(2, 2).map((yr) => (
                <div
                  key={yr}
                  className={`card p-4 text-center transition-colors ${
                    yr === activeYear
                      ? 'border-brand-200 bg-brand-50/50'
                      : yr < activeYear
                        ? 'bg-slate-50/50 opacity-60'
                        : 'border-dashed'
                  }`}
                >
                  <p className={`text-lg font-bold font-display ${yr === activeYear ? 'text-brand-700' : 'text-slate-600'}`}>
                    {formatAcademicYear(yr)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {yr < activeYear ? 'Past' : yr === activeYear ? 'Current' : 'Future'}
                  </p>
                </div>
              ))}
            </div>

            {/* Upgrade section */}
            <div className="card p-6">
              <h3 className="font-display font-bold text-slate-900 mb-1">Upgrade Academic Year</h3>
              <p className="text-sm text-slate-500 mb-5">
                Move the system to a new academic year. Existing data (fees, attendance, exams) stays in the old year — only new records will use the new year.
              </p>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl mb-5">
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-1">From</p>
                  <p className="text-xl font-bold font-display text-slate-700">{formatAcademicYear(activeYear)}</p>
                </div>
                <ArrowRight size={20} className="text-slate-300 flex-shrink-0" />
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-1">To</p>
                  <p className="text-xl font-bold font-display text-brand-700">{formatAcademicYear(upgradeYear)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={copyStructures}
                    onChange={(e) => setCopyStructures(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-brand-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Copy fee structures to new year</p>
                    <p className="text-xs text-slate-400">All class fee structure templates will be duplicated into {formatAcademicYear(upgradeYear)} (ready to edit). Student assignments are NOT copied — run "Apply to Students" after upgrading.</p>
                  </div>
                </label>

                <div>
                  <label className="label">Notes (optional)</label>
                  <input
                    value={upgradeNotes}
                    onChange={(e) => setUpgradeNotes(e.target.value)}
                    className="input"
                    placeholder={`e.g. Academic year ${formatAcademicYear(upgradeYear)} begins Baishakh 1`}
                  />
                </div>

                {!upgradeConfirm ? (
                  <button
                    onClick={() => setUpgradeConfirm(true)}
                    className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200"
                  >
                    <CalendarCog size={15} /> Upgrade to {formatAcademicYear(upgradeYear)}
                  </button>
                ) : (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-rose-700 text-sm">Confirm year upgrade</p>
                        <p className="text-xs text-rose-600 mt-1">
                          This will set the active year to <strong>{formatAcademicYear(upgradeYear)}</strong>. All new fees, gradebooks, and attendance records will use this year. This action cannot be undone automatically — contact your system admin to revert.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={doUpgrade}
                        disabled={upgrading}
                        className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                      >
                        {upgrading ? 'Upgrading…' : `Yes, upgrade to ${formatAcademicYear(upgradeYear)}`}
                      </button>
                      <button onClick={() => setUpgradeConfirm(false)} className="btn-secondary text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* History */}
            {config?.academicYearHistory?.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History size={16} className="text-slate-400" />
                  <h3 className="font-display font-bold text-slate-900">Year History</h3>
                </div>
                <div className="space-y-2">
                  {[...config.academicYearHistory].reverse().map((h, i) => (
                    <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0 text-sm">
                      <span className="font-semibold text-slate-700 w-20">{formatAcademicYear(h.year)}</span>
                      <span className="text-slate-400 text-xs">
                        Ended {h.endedAt ? formatBS(h.endedAt) : '—'}
                      </span>
                      {h.notes && <span className="text-slate-500 italic">{h.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ── Account ────────────────────────────────────────────────────────── */}
      {tab === 'account' && (
        <div className="space-y-5">
          {/* Avatar card */}
          <div className="card p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-brand text-white flex items-center justify-center text-2xl font-display font-bold shadow-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-display font-bold text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full capitalize">
                <User size={11} /> {user?.role}
              </span>
            </div>
          </div>

          <form onSubmit={submitProfile} className="card p-6">
            <h3 className="font-display font-bold text-lg mb-4">Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Email (read-only)</label>
                <input value={user?.email || ''} readOnly className="input bg-slate-50" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input" />
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                <Save size={15} /> {savingProfile ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </form>

          <form onSubmit={submitPassword} className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound size={16} className="text-slate-500" />
              <h3 className="font-display font-bold text-lg">Change Password</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Current Password</label>
                <input type="password" required value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" required minLength={6} value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" required value={pwd.confirmPassword} onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })} className="input" />
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button type="submit" disabled={savingPwd} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                <KeyRound size={15} /> {savingPwd ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
