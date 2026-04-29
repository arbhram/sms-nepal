import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, GraduationCap, Mail, Phone, KeyRound, Copy } from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, EmptyState, Badge } from '../../components/ui/Misc.jsx';

function PasswordModal({ email, password, onClose }) {
  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><KeyRound size={20} className="text-blue-600" /></div>
          <h3 className="font-display font-bold text-slate-900 text-lg">Teacher Password</h3>
        </div>
        <p className="text-slate-500 text-sm mb-5">Share these credentials with the teacher.</p>
        {[['Email / Login', email], ['Password', password]].map(([label, val]) => (
          <div key={label} className="mb-3">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <div className="flex items-center gap-2 bg-slate-50 border rounded-lg px-3 py-2">
              <span className="flex-1 font-mono text-sm text-slate-800">{val}</span>
              <button onClick={() => copy(val)} className="text-slate-400 hover:text-slate-700"><Copy size={14} /></button>
            </div>
          </div>
        ))}
        <button onClick={onClose} className="btn-primary w-full mt-4">Done</button>
      </div>
    </div>
  );
}

export default function TeacherList() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [credentials, setCredentials] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/teachers', { params: search ? { search } : {} });
      setTeachers(data);
    } catch {
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [search]);

  const handleResetPassword = async (id) => {
    try {
      const { data } = await api.post(`/teachers/${id}/reset-password`);
      setCredentials({ email: data.loginEmail, password: data.password });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}?`)) return;
    try {
      await api.delete(`/teachers/${id}`);
      toast.success('Teacher deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      {credentials && (
        <PasswordModal
          email={credentials.email}
          password={credentials.password}
          onClose={() => setCredentials(null)}
        />
      )}
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} teacher${teachers.length !== 1 ? 's' : ''} on staff`}
        action={
          <Link to="/teachers/new" className="btn-primary">
            <Plus size={16} /> Add Teacher
          </Link>
        }
      />

      <div className="card p-4 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="input pl-10"
            placeholder="Search by name, subject, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : teachers.length === 0 ? (
        <div className="card">
          <EmptyState title="No teachers yet" subtitle="Add your first teacher to get started." icon={GraduationCap} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((t) => (
            <div key={t._id} className="card p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-violet text-white flex items-center justify-center font-display font-bold text-lg">
                  {t.fullName?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-slate-900 truncate">{t.fullName}</div>
                  <div className="text-xs text-slate-500 font-mono">{t.teacherId}</div>
                </div>
                <Badge color={t.status === 'active' ? 'green' : 'red'}>{t.status}</Badge>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Badge color="violet">{t.subject}</Badge>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <Phone size={12} /> {t.phone}
                </div>
                {t.email && (
                  <div className="flex items-center gap-2 text-slate-500 text-xs truncate">
                    <Mail size={12} /> {t.email}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <div className="text-sm">
                  <div className="text-xs text-slate-400">Salary</div>
                  <div className="font-semibold text-slate-800">NPR {(t.salary || 0).toLocaleString()}</div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleResetPassword(t._id)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                    title="Reset Password"
                  >
                    <KeyRound size={15} />
                  </button>
                  <Link to={`/teachers/${t._id}/edit`} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
                    <Edit2 size={15} />
                  </Link>
                  <button
                    onClick={() => handleDelete(t._id, t.fullName)}
                    className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
