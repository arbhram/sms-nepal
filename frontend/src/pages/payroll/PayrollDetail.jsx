import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, Banknote, Edit2, Save, X } from 'lucide-react';
import api from '../../api/axios.js';
import { Loader } from '../../components/ui/Misc.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { formatBS } from '../../utils/nepaliDate.js';

const fmt  = n => `NPR ${Number(n || 0).toLocaleString()}`;
const fmtN = n => Number(n || 0).toLocaleString();

const STATUS_STEPS = ['draft', 'accrued', 'paid'];
const STATUS_LABELS = { draft: 'Draft', accrued: 'Salary Accrued', paid: 'Salary Paid' };

const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Cheque'];

export default function PayrollDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editLine, setEditLine] = useState({});
  const [saving, setSaving] = useState(false);
  const [accruing, setAccruing] = useState(false);
  const [disbursing, setDisbursing] = useState(false);
  const [disburseForm, setDisburseForm] = useState({ paymentMethod: 'Bank Transfer', paidDate: new Date().toISOString().slice(0, 10) });
  const [disburseOpen, setDisburseOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/payroll/${id}`);
      setPayroll(data);
    } catch { toast.error('Failed to load payroll'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  // ── Inline edit a single teacher line ──
  const startEdit = (idx, line) => {
    setEditingIdx(idx);
    setEditLine({
      basicSalary: line.basicSalary,
      allowances:  line.allowances  || 0,
      deductions:  line.deductions  || 0,
      tds:         line.tds         || 0,
      pf:          line.pf          || 0,
    });
  };

  const computeNet = (l) =>
    (Number(l.basicSalary) || 0) + (Number(l.allowances) || 0)
    - (Number(l.deductions) || 0) - (Number(l.tds) || 0) - (Number(l.pf) || 0);

  const saveLine = async () => {
    const updatedLines = payroll.lines.map((l, i) => {
      if (i !== editingIdx) return l;
      const net = computeNet(editLine);
      return { ...l, ...editLine, netSalary: net };
    });
    setSaving(true);
    try {
      const { data } = await api.put(`/payroll/${id}`, { lines: updatedLines });
      setPayroll(data);
      setEditingIdx(null);
      toast.success('Updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  // ── Accrue ──
  const handleAccrue = () => {
    setConfirm({
      title: 'Accrue salary?',
      message: `This posts the salary expense journal (Dr Salary Expense, Cr Salary Payable) for ${payroll.month}. You cannot edit the payroll after this.`,
      onConfirm: async () => {
        setConfirm(null);
        setAccruing(true);
        try {
          await api.post(`/payroll/${id}/accrue`);
          toast.success('Salary accrued — journal posted');
          load();
        } catch (err) { toast.error(err.response?.data?.message || 'Accrual failed'); }
        finally { setAccruing(false); }
      },
    });
  };

  // ── Disburse ──
  const handleDisburse = async (e) => {
    e.preventDefault();
    setDisbursing(true);
    try {
      await api.post(`/payroll/${id}/disburse`, disburseForm);
      toast.success('Salary disbursed — payment journal posted');
      setDisburseOpen(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Disbursement failed'); }
    finally { setDisbursing(false); }
  };

  if (loading) return <Loader />;
  if (!payroll) return <div className="p-8 text-center text-slate-400">Payroll not found</div>;

  const stepIdx = STATUS_STEPS.indexOf(payroll.status);

  return (
    <div>
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}

      {/* Back + header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/payroll')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display font-bold text-xl text-slate-900">{payroll.month} Payroll</h1>
          <p className="text-sm text-slate-400">{payroll.payrollNumber} · {payroll.lines.length} teachers</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="card p-4 mb-5">
        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((step, i) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`flex flex-col items-center flex-1 ${i <= stepIdx ? 'text-brand-600' : 'text-slate-300'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${i < stepIdx ? 'bg-brand-600 text-white' : i === stepIdx ? 'bg-brand-50 text-brand-600 border-2 border-brand-600' : 'bg-slate-100 text-slate-300'}`}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium text-center">{STATUS_LABELS[step]}</span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mb-4 ${i < stepIdx ? 'bg-brand-500' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Gross Total',  value: fmt(payroll.totalGross),      color: 'text-slate-800' },
          { label: 'Deductions',   value: fmt(payroll.totalDeductions),  color: 'text-rose-600' },
          { label: 'Net Payable',  value: fmt(payroll.totalNet),         color: 'text-emerald-600' },
          { label: 'Teachers',     value: payroll.lines.length,          color: 'text-slate-800' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <div className="text-xs text-slate-400 mb-1">{label}</div>
            <div className={`text-lg font-bold font-display ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Journal refs */}
      {(payroll.accrualJournalRef || payroll.paymentJournalRef) && (
        <div className="flex gap-3 mb-5 flex-wrap">
          {payroll.accrualJournalRef && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
              <CheckCircle size={14} className="text-amber-600" />
              <span className="text-amber-700">Accrual journal: <span className="font-mono font-semibold">{payroll.accrualJournalRef.journalNumber}</span></span>
            </div>
          )}
          {payroll.paymentJournalRef && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm">
              <Banknote size={14} className="text-emerald-600" />
              <span className="text-emerald-700">Payment journal: <span className="font-mono font-semibold">{payroll.paymentJournalRef.journalNumber}</span></span>
            </div>
          )}
        </div>
      )}

      {/* Teacher lines table */}
      <div className="card overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Salary Breakdown</h3>
          {payroll.status === 'draft' && <span className="text-xs text-slate-400">Click edit to adjust individual amounts</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Teacher</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Basic</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Allowances</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deductions</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">TDS</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">PF</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Net</th>
                {payroll.status === 'draft' && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payroll.lines.map((line, idx) => (
                <tr key={line._id || idx} className="hover:bg-slate-50/40">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {line.teacher?.fullName || line.teacherName}
                  </td>
                  {editingIdx === idx ? (
                    <>
                      {['basicSalary', 'allowances', 'deductions', 'tds', 'pf'].map(field => (
                        <td key={field} className="px-2 py-2">
                          <input
                            type="number" min="0"
                            value={editLine[field]}
                            onChange={e => setEditLine(f => ({ ...f, [field]: e.target.value }))}
                            className="input py-1 text-sm font-mono text-right w-24"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2 text-right font-mono font-bold text-emerald-600">
                        {fmtN(computeNet(editLine))}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1">
                          <button onClick={saveLine} disabled={saving} className="p-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100">
                            <Save size={13} />
                          </button>
                          <button onClick={() => setEditingIdx(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">{fmtN(line.basicSalary)}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600">{line.allowances > 0 ? `+${fmtN(line.allowances)}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-rose-500">{line.deductions > 0 ? `−${fmtN(line.deductions)}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-rose-500">{line.tds > 0 ? `−${fmtN(line.tds)}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-rose-500">{line.pf > 0 ? `−${fmtN(line.pf)}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{fmtN(line.netSalary)}</td>
                      {payroll.status === 'draft' && (
                        <td className="px-4 py-3">
                          <button onClick={() => startEdit(idx, line)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                            <Edit2 size={13} />
                          </button>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right font-mono">{fmtN(payroll.lines.reduce((s, l) => s + (l.basicSalary || 0), 0))}</td>
                <td className="px-4 py-3 text-right font-mono text-emerald-600">
                  {payroll.lines.reduce((s, l) => s + (l.allowances || 0), 0) > 0
                    ? `+${fmtN(payroll.lines.reduce((s, l) => s + (l.allowances || 0), 0))}` : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-rose-500">
                  {payroll.lines.reduce((s, l) => s + (l.deductions || 0), 0) > 0
                    ? `−${fmtN(payroll.lines.reduce((s, l) => s + (l.deductions || 0), 0))}` : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-rose-500">
                  {payroll.lines.reduce((s, l) => s + (l.tds || 0), 0) > 0
                    ? `−${fmtN(payroll.lines.reduce((s, l) => s + (l.tds || 0), 0))}` : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-rose-500">
                  {payroll.lines.reduce((s, l) => s + (l.pf || 0), 0) > 0
                    ? `−${fmtN(payroll.lines.reduce((s, l) => s + (l.pf || 0), 0))}` : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-emerald-700">{fmtN(payroll.totalNet)}</td>
                {payroll.status === 'draft' && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        {payroll.status === 'draft' && (
          <button onClick={handleAccrue} disabled={accruing} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            <CheckCircle size={15} />
            {accruing ? 'Accruing…' : 'Accrue Salary'}
          </button>
        )}
        {payroll.status === 'accrued' && (
          <button onClick={() => setDisburseOpen(true)} className="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Banknote size={15} />
            Disburse Salary
          </button>
        )}
        {payroll.status === 'paid' && (
          <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
            <CheckCircle size={16} />
            Paid on {payroll.paidDate ? formatBS(payroll.paidDate) : '—'} via {payroll.paymentMethod}
          </div>
        )}
      </div>

      {/* Disburse Modal */}
      {disburseOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-24">
            <form onSubmit={handleDisburse} className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-lg">Disburse Salary</h3>
                <button type="button" onClick={() => setDisburseOpen(false)} className="p-1 rounded hover:bg-slate-100"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-emerald-600 mb-1">Total to disburse</div>
                  <div className="text-2xl font-bold font-display text-emerald-700">{fmt(payroll.totalNet)}</div>
                </div>
                <div>
                  <label className="label">Payment Method *</label>
                  <select required value={disburseForm.paymentMethod} onChange={e => setDisburseForm(f => ({ ...f, paymentMethod: e.target.value }))} className="input">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Payment Date *</label>
                  <input required type="date" value={disburseForm.paidDate} onChange={e => setDisburseForm(f => ({ ...f, paidDate: e.target.value }))} className="input" />
                </div>
                <p className="text-xs text-slate-400">This posts the final payment journal: Dr Salary Payable → Cr Bank/Cash</p>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setDisburseOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={disbursing} className="btn-primary bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                  {disbursing ? 'Processing…' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
