import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, BookOpen, Users as UsersIcon, Edit2, Trash2, X, UserCheck } from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, EmptyState } from '../../components/ui/Misc.jsx';

export default function ClassList() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', sections: 'A, B', defaultFee: 0, admissionFee: 0, transportFee: 0,
    classTeacher: '', description: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: cls }, { data: tch }] = await Promise.all([
        api.get('/classes'),
        api.get('/teachers'),
      ]);
      setClasses(cls);
      setTeachers(Array.isArray(tch) ? tch : tch.teachers || []);
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', sections: 'A, B', defaultFee: 0, admissionFee: 0, transportFee: 0, classTeacher: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name,
      sections: (c.sections || []).join(', '),
      defaultFee: c.defaultFee || 0,
      admissionFee: c.admissionFee || 0,
      transportFee: c.transportFee || 0,
      classTeacher: c.classTeacher?._id || c.classTeacher || '',
      description: c.description || '',
    });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        sections: form.sections.split(',').map((s) => s.trim()).filter(Boolean),
        defaultFee: Number(form.defaultFee),
        admissionFee: Number(form.admissionFee),
        transportFee: Number(form.transportFee),
        classTeacher: form.classTeacher || null,
      };
      if (editing) await api.put(`/classes/${editing._id}`, payload);
      else await api.post('/classes', payload);
      toast.success(editing ? 'Class updated' : 'Class created');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const remove = async (c) => {
    if (!confirm(`Delete ${c.name}?`)) return;
    try {
      await api.delete(`/classes/${c._id}`);
      toast.success('Class removed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Classes & Sections"
        subtitle="Manage academic levels, sections, fees, and class teachers"
        action={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Class</button>}
      />

      {loading ? (
        <Loader />
      ) : classes.length === 0 ? (
        <div className="card"><EmptyState title="No classes yet" icon={BookOpen} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <div key={c._id} className="card p-5 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-mint text-white flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => remove(c)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="font-display font-bold text-lg text-slate-900">{c.name}</div>
              <div className="text-xs text-slate-500 mt-1">
                Sections: {(c.sections || []).join(', ') || '—'}
              </div>
              {c.classTeacher && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600 mt-1">
                  <UserCheck size={12} />
                  <span>Class Teacher: {c.classTeacher.fullName}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <div>
                  <div className="font-semibold text-slate-700">Monthly</div>
                  <div>NPR {(c.defaultFee || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-700">Admission</div>
                  <div>NPR {(c.admissionFee || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-700">Transport</div>
                  <div>NPR {(c.transportFee || 0).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 text-sm mt-3">
                <UsersIcon size={14} /> {c.studentCount || 0} students
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">{editing ? 'Edit Class' : 'New Class'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 rounded hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Class Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Class 10" />
              </div>
              <div>
                <label className="label">Sections (comma separated)</label>
                <input value={form.sections} onChange={(e) => setForm({ ...form, sections: e.target.value })} className="input" placeholder="A, B, C" />
              </div>
              <div>
                <label className="label">Class Teacher</label>
                <select value={form.classTeacher} onChange={(e) => setForm({ ...form, classTeacher: e.target.value })} className="input">
                  <option value="">— No class teacher —</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>{t.fullName} ({t.teacherId})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Monthly Fee (NPR)</label>
                  <input type="number" value={form.defaultFee} onChange={(e) => setForm({ ...form, defaultFee: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Admission Fee (NPR)</label>
                  <input type="number" value={form.admissionFee} onChange={(e) => setForm({ ...form, admissionFee: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Transport Fee (NPR)</label>
                  <input type="number" value={form.transportFee} onChange={(e) => setForm({ ...form, transportFee: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
