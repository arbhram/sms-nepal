import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, ClipboardList, Calendar, X, Trash2 } from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, EmptyState, Badge } from '../../components/ui/Misc.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [form, setForm] = useState({
    name: '', class: '', startDate: '', endDate: '',
    subjects: 'Mathematics, Science, English, Nepali, Social Studies',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [e, c] = await Promise.all([api.get('/exams'), api.get('/classes')]);
      setExams(e.data);
      setClasses(c.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      const subjects = form.subjects.split(',').map((s) => ({
        name: s.trim(),
        fullMarks: 100,
        passMarks: 40,
      }));
      await api.post('/exams', { ...form, subjects });
      toast.success('Exam created');
      setModalOpen(false);
      setForm({ name: '', class: '', startDate: '', endDate: '', subjects: 'Mathematics, Science, English, Nepali, Social Studies' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Create failed'); }
  };

  const remove = (ex) => {
    setConfirmState({
      title: `Delete "${ex.name}"?`,
      message: 'All associated student results will also be permanently deleted.',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await api.delete(`/exams/${ex._id}`);
          toast.success('Exam deleted');
          load();
        } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
      },
    });
  };

  return (
    <div>
      {confirmState && (
        <ConfirmModal {...confirmState} onCancel={() => setConfirmState(null)} />
      )}
      <PageHeader
        title="Exams & Results"
        subtitle="Schedule exams and manage results"
        action={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> Schedule Exam</button>}
      />

      {loading ? <Loader /> : exams.length === 0 ? (
        <div className="card"><EmptyState title="No exams scheduled" icon={ClipboardList} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((ex) => {
            const status = new Date(ex.startDate) > new Date() ? 'upcoming' : new Date(ex.endDate) < new Date() ? 'completed' : 'ongoing';
            return (
              <div key={ex._id} className="card p-5 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-violet text-white flex items-center justify-center">
                    <ClipboardList size={20} />
                  </div>
                  <Badge color={status === 'upcoming' ? 'blue' : status === 'ongoing' ? 'yellow' : 'green'}>
                    {status}
                  </Badge>
                </div>
                <div className="font-display font-bold text-lg text-slate-900">{ex.name}</div>
                <div className="text-sm text-slate-500 mt-1">{ex.class?.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3">
                  <Calendar size={13} />
                  {new Date(ex.startDate).toLocaleDateString()}
                  {ex.endDate && ` — ${new Date(ex.endDate).toLocaleDateString()}`}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                  {(ex.subjects || []).slice(0, 5).map((s, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {s.name}
                    </span>
                  ))}
                  {ex.subjects?.length > 5 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      +{ex.subjects.length - 5}
                    </span>
                  )}
                </div>
                <div className="flex justify-end mt-3">
                  <button onClick={() => remove(ex)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
          <form onSubmit={create} className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">Schedule Exam</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 rounded hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Exam Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="First Terminal Examination" />
              </div>
              <div>
                <label className="label">Class *</label>
                <select required value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} className="input">
                  <option value="">Select class...</option>
                  {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date *</label>
                  <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Subjects (comma separated)</label>
                <textarea value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} className="input" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create</button>
            </div>
          </form>
          </div>
        </div>
      )}
    </div>
  );
}
