import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Users, Mail, Phone, Edit2, Trash2, KeyRound, Copy, X, Search } from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, EmptyState } from '../../components/ui/Misc.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';

function PasswordModal({ email, password, onClose }) {
  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><KeyRound size={20} className="text-indigo-600" /></div>
            <h3 className="font-display font-bold text-slate-900 text-lg">Parent Account Created</h3>
          </div>
          <p className="text-slate-500 text-sm mb-5">Share these login credentials with the parent. The password cannot be recovered later.</p>
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
    </div>
  );
}

const BLANK = { name: '', email: '', phone: '', linkedStudents: [] };

export default function ParentList() {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([api.get('/parents'), api.get('/students', { params: { limit: 500 } })]);
      setParents(p.data);
      setStudents(s.data.students || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(BLANK); setStudentSearch(''); setModalOpen(true); };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      email: p.email,
      phone: p.phone || '',
      linkedStudents: (p.linkedStudents || []).map((s) => s._id || s),
    });
    setStudentSearch('');
    setModalOpen(true);
  };

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    return s.fullName?.toLowerCase().includes(q) || s.studentId?.toLowerCase().includes(q) || s.class?.name?.toLowerCase().includes(q);
  });

  const toggleStudent = (id) => {
    setForm((prev) => ({
      ...prev,
      linkedStudents: prev.linkedStudents.includes(id)
        ? prev.linkedStudents.filter((s) => s !== id)
        : [...prev.linkedStudents, id],
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/parents/${editing._id}`, form);
        toast.success('Parent updated');
        setModalOpen(false);
        load();
      } else {
        const { data } = await api.post('/parents', form);
        setCredentials({ email: data.email, password: data.password });
        setModalOpen(false);
        load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (id) => {
    try {
      const { data } = await api.post(`/parents/${id}/reset-password`);
      setCredentials({ email: data.loginEmail, password: data.password });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    }
  };

  const handleDelete = (parent) => {
    setConfirmState({
      title: `Delete ${parent.name}?`,
      message: 'The parent login account will be permanently removed.',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await api.delete(`/parents/${parent._id}`);
          toast.success('Parent removed');
          load();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Delete failed');
        }
      },
    });
  };

  return (
    <div>
      {confirmState && <ConfirmModal {...confirmState} onCancel={() => setConfirmState(null)} />}
      {credentials && <PasswordModal email={credentials.email} password={credentials.password} onClose={() => setCredentials(null)} />}

      <PageHeader
        title="Parents"
        subtitle={`${parents.length} parent account${parents.length !== 1 ? 's' : ''}`}
        action={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Parent</button>}
      />

      {loading ? <Loader /> : parents.length === 0 ? (
        <div className="card"><EmptyState title="No parent accounts yet" subtitle="Add a parent to give them portal access." icon={Users} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parents.map((p) => (
            <div key={p._id} className="card p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-display font-bold text-lg">
                  {p.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-slate-900 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{(p.linkedStudents || []).length} child{(p.linkedStudents || []).length !== 1 ? 'ren' : ''} linked</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500 mb-3">
                <div className="flex items-center gap-2"><Mail size={11} /> {p.email}</div>
                {p.phone && <div className="flex items-center gap-2"><Phone size={11} /> {p.phone}</div>}
              </div>

              {(p.linkedStudents || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {p.linkedStudents.map((s) => (
                    <span key={s._id} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                      {s.fullName}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-1 pt-3 border-t border-slate-100">
                <button onClick={() => handleResetPassword(p._id)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600" title="Reset Password">
                  <KeyRound size={14} />
                </button>
                <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(p)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg">{editing ? 'Edit Parent' : 'Add Parent'}</h3>
                <button type="button" onClick={() => setModalOpen(false)} className="p-1 rounded hover:bg-slate-100"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Ram Bahadur Shrestha" />
                </div>
                <div>
                  <label className="label">Email (Login) *</label>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="parent@example.com" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="98XXXXXXXX" />
                </div>
                <div>
                  <label className="label">Linked Children</label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search by name, ID or class…"
                      className="input pl-8 py-2 text-xs"
                    />
                  </div>
                  <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">{studentSearch ? 'No students match' : 'No students found'}</p>
                    ) : filteredStudents.map((s) => (
                      <label key={s._id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.linkedStudents.includes(s._id)}
                          onChange={() => toggleStudent(s._id)}
                          className="rounded border-slate-300 accent-brand-600"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-800">{s.fullName}</span>
                          <span className="text-xs text-slate-400 ml-2">{s.studentId}</span>
                        </div>
                        {s.class?.name && <span className="text-xs text-slate-400">{s.class.name}</span>}
                      </label>
                    ))}
                  </div>
                  {form.linkedStudents.length > 0 && (
                    <p className="text-xs text-indigo-600 mt-1">{form.linkedStudents.length} student{form.linkedStudents.length !== 1 ? 's' : ''} selected</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
