import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, X, Users, User, ChevronRight, Trash2 } from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader } from '../../components/ui/Misc.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { currentBSYear } from '../../utils/nepaliDate.js';

const NEPALI_MONTHS = [
  'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

const STATUS_STYLES = {
  draft:   'bg-slate-100 text-slate-600',
  accrued: 'bg-amber-50 text-amber-700',
  paid:    'bg-emerald-50 text-emerald-700',
};

const fmt = n => `NPR ${Number(n || 0).toLocaleString()}`;

export default function PayrollList() {
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [view, setView] = useState('month');           // 'month' | 'teacher'
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [teacherHistory, setTeacherHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterYear, setFilterYear] = useState(currentBSYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ month: NEPALI_MONTHS[0], academicYear: currentBSYear(), scope: 'all' });
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filterStatus) params.status = filterStatus;
      if (filterYear)   params.academicYear = filterYear;
      const { data } = await api.get('/payroll', { params });
      setPayrolls(data.payrolls || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load payrolls'); }
    finally { setLoading(false); }
  }, [filterStatus, filterYear]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/teachers', { params: { limit: 200, status: 'active' } })
      .then(r => setTeachers(r.data.teachers || r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (view === 'teacher' && selectedTeacher) {
      setHistoryLoading(true);
      api.get(`/payroll/teacher/${selectedTeacher}`)
        .then(r => setTeacherHistory(r.data || []))
        .catch(() => toast.error('Failed to load salary history'))
        .finally(() => setHistoryLoading(false));
    }
  }, [view, selectedTeacher]);

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        month: `${form.month} ${form.academicYear}`,
        academicYear: form.academicYear,
      };
      const { data } = await api.post('/payroll', payload);
      toast.success(`Payroll run created for ${payload.month}`);
      setModalOpen(false);
      navigate(`/payroll/${data._id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
    finally { setCreating(false); }
  };

  const handleDelete = (p) => {
    setConfirm({
      title: 'Delete payroll run?',
      message: `Delete the draft payroll for "${p.month}"? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.delete(`/payroll/${p._id}`);
          toast.success('Deleted');
          load();
        } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
      },
    });
  };

  return (
    <div>
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}

      <PageHeader
        title="Payroll"
        subtitle={`${total} payroll runs`}
        action={
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={15} /> New Payroll Run
          </button>
        }
      />

      {/* View toggle */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { id: 'month',   label: 'By Month',   icon: Users },
          { id: 'teacher', label: 'By Teacher',  icon: User },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setView(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── BY MONTH VIEW ─────────────────────────────── */}
      {view === 'month' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input py-1.5 text-sm w-auto">
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="accrued">Accrued</option>
              <option value="paid">Paid</option>
            </select>
            <input value={filterYear} onChange={e => setFilterYear(e.target.value)} className="input py-1.5 text-sm w-28 font-mono" placeholder="Year" />
          </div>

          {loading ? <Loader /> : (
            <div className="card overflow-hidden">
              {payrolls.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">No payroll runs found. Create one to get started.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {payrolls.map(p => (
                    <div key={p._id}
                      onClick={() => navigate(`/payroll/${p._id}`)}
                      className="flex items-center gap-4 px-4 py-4 hover:bg-slate-50/60 cursor-pointer transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800">{p.month}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{p.lines?.length || 0} teachers · {p.payrollNumber}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-slate-800">{fmt(p.totalNet)}</div>
                        <div className="text-xs text-slate-400">net payable</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {p.status === 'draft' && (
                          <button onClick={e => { e.stopPropagation(); handleDelete(p); }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400">
                            <Trash2 size={13} />
                          </button>
                        )}
                        <ChevronRight size={16} className="text-slate-300" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── BY TEACHER VIEW ───────────────────────────── */}
      {view === 'teacher' && (
        <>
          <div className="mb-4">
            <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} className="input max-w-xs">
              <option value="">Select a teacher…</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.fullName} — {t.subject}</option>)}
            </select>
          </div>

          {!selectedTeacher ? (
            <div className="card p-12 text-center text-slate-400 text-sm">Select a teacher to view their salary history.</div>
          ) : historyLoading ? <Loader /> : teacherHistory.length === 0 ? (
            <div className="card p-12 text-center text-slate-400 text-sm">No salary records found for this teacher.</div>
          ) : (
            <>
              {/* Summary card */}
              {(() => {
                const paid = teacherHistory.filter(h => h.status === 'paid');
                const totalPaid = paid.reduce((s, h) => s + (h.line?.netSalary || 0), 0);
                return (
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    {[
                      { label: 'Total Paid', value: fmt(totalPaid), sub: `${paid.length} months` },
                      { label: 'Latest Basic', value: fmt(teacherHistory[0]?.line?.basicSalary), sub: 'most recent' },
                      { label: 'Latest Net', value: fmt(teacherHistory[0]?.line?.netSalary), sub: 'after deductions' },
                    ].map(({ label, value, sub }) => (
                      <div key={label} className="card p-4">
                        <div className="text-xs text-slate-400 mb-1">{label}</div>
                        <div className="text-lg font-bold font-display text-slate-800">{value}</div>
                        <div className="text-xs text-slate-400">{sub}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        {['Month', 'Basic Salary', 'Allowances', 'Deductions', 'TDS', 'PF', 'Net Salary', 'Status', 'Paid Via'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {teacherHistory.map(h => (
                        <tr key={h._id} className="hover:bg-slate-50/60 cursor-pointer" onClick={() => navigate(`/payroll/${h._id}`)}>
                          <td className="px-4 py-3 font-medium text-slate-800">{h.month}</td>
                          <td className="px-4 py-3 font-mono">{fmt(h.line?.basicSalary)}</td>
                          <td className="px-4 py-3 font-mono text-emerald-600">{h.line?.allowances > 0 ? `+${fmt(h.line.allowances)}` : '—'}</td>
                          <td className="px-4 py-3 font-mono text-rose-500">{h.line?.deductions > 0 ? `−${fmt(h.line.deductions)}` : '—'}</td>
                          <td className="px-4 py-3 font-mono text-rose-500">{h.line?.tds > 0 ? `−${fmt(h.line.tds)}` : '—'}</td>
                          <td className="px-4 py-3 font-mono text-rose-500">{h.line?.pf > 0 ? `−${fmt(h.line.pf)}` : '—'}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">{fmt(h.line?.netSalary)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[h.status]}`}>{h.status}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{h.paymentMethod || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-20">
            <form onSubmit={create} className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-lg">New Payroll Run</h3>
                <button type="button" onClick={() => setModalOpen(false)} className="p-1 rounded hover:bg-slate-100"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Month *</label>
                  <select required value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} className="input">
                    {NEPALI_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Academic Year *</label>
                  <input required value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))} className="input font-mono" placeholder="2082" />
                </div>
                <p className="text-xs text-slate-400">This will auto-generate salary lines for all active teachers based on their base salary. You can edit individual amounts on the next screen.</p>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary disabled:opacity-50">{creating ? 'Creating…' : 'Create & Review'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
