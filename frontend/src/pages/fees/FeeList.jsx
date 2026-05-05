import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Wallet, CreditCard, X, Printer, TrendingUp, AlertCircle,
  Layers, Trash2, Clock, CheckCircle2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, EmptyState, Badge } from '../../components/ui/Misc.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { formatBS } from '../../utils/nepaliDate.js';

// ─── constants ────────────────────────────────────────────────────────────────
const FEE_TYPES = ['Admission', 'Monthly', 'Exam', 'Transport', 'Hostel', 'Library', 'Identity Card', 'Custom'];
const METHODS = ['Cash', 'Bank Transfer', 'eSewa', 'Khalti', 'FonePay'];
const PAGE_LIMIT = 50;

const STATUS_META = {
  Paid:    { color: 'green',  icon: CheckCircle2, label: 'Paid' },
  Partial: { color: 'yellow', icon: Clock,         label: 'Partial' },
  Unpaid:  { color: 'slate',  icon: AlertCircle,   label: 'Unpaid' },
};

const emptyItem = () => ({ type: 'Monthly', description: '', amount: '' });
const totalOf = (items) => items.reduce((s, it) => s + Number(it.amount || 0), 0);
const fmt = (n) => `NPR ${Number(n || 0).toLocaleString()}`;

// ─── helpers ──────────────────────────────────────────────────────────────────
function addItem(setter) {
  setter((p) => ({ ...p, feeItems: [...p.feeItems, emptyItem()] }));
}
function removeItem(setter, idx) {
  setter((p) => ({ ...p, feeItems: p.feeItems.filter((_, i) => i !== idx) }));
}
function updateItem(setter, idx, field, value) {
  setter((p) => {
    const items = [...p.feeItems];
    items[idx] = { ...items[idx], [field]: value };
    return { ...p, feeItems: items };
  });
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center p-4 pt-8">
        <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} max-h-[85vh] flex flex-col`}>
          <div className="flex items-center justify-between px-7 py-5 border-b">
            <h3 className="font-display font-bold text-xl">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={20} /></button>
          </div>
          <div className="overflow-y-auto flex-1 px-7 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Fee items editor ─────────────────────────────────────────────────────────
function FeeItemsEditor({ items, setter }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="label mb-0">Fee Items *</label>
        <button type="button" onClick={() => addItem(setter)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          <Plus size={12} /> Add Item
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <select value={item.type} onChange={(e) => updateItem(setter, idx, 'type', e.target.value)} className="input flex-shrink-0 w-36">
              {FEE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input placeholder="Description (optional)" value={item.description} onChange={(e) => updateItem(setter, idx, 'description', e.target.value)} className="input flex-1 min-w-0" />
            <input required type="number" min="0" placeholder="Amount" value={item.amount} onChange={(e) => updateItem(setter, idx, 'amount', e.target.value)} className="input w-28 flex-shrink-0" />
            {items.length > 1 && (
              <button type="button" onClick={() => removeItem(setter, idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg flex-shrink-0">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 text-right text-sm font-semibold text-slate-700">
        Total: {fmt(totalOf(items))}
      </div>
    </div>
  );
}

// ─── Payment history ──────────────────────────────────────────────────────────
function PaymentHistory({ fee, onDelete }) {
  if (!fee.payments?.length) {
    return <p className="text-xs text-slate-400 italic">No payments recorded yet.</p>;
  }
  return (
    <div className="space-y-1">
      {fee.payments.map((p) => (
        <div key={p._id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-emerald-700">{fmt(p.amount)}</span>
              <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{p.paymentMethod}</span>
              {p.remarks && <span className="text-xs text-slate-500 truncate">{p.remarks}</span>}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {formatBS(p.paidDate)} · {p.receiptNumber}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDelete(p._id)}
            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 flex-shrink-0"
            title="Remove this payment"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Print receipt ────────────────────────────────────────────────────────────
function printReceipt(fee, payment) {
  const itemRows = (fee.feeItems || [])
    .map((it) => `<div class="row"><span>${it.type}${it.description ? ' — ' + it.description : ''}</span><span>NPR ${Number(it.amount).toLocaleString()}</span></div>`)
    .join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt ${payment?.receiptNumber || fee.receiptNumber}</title>
<style>
  body{font-family:sans-serif;padding:40px;color:#334155}
  .head{text-align:center;padding-bottom:18px;border-bottom:2px solid #0c7fff;margin-bottom:18px}
  .head h1{color:#0c7fff;margin:0;font-size:22px}
  .head p{margin:4px 0;color:#64748b;font-size:13px}
  .row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px dashed #e2e8f0;font-size:14px}
  .label{color:#64748b}
  .box{background:#f8fafc;border-radius:8px;padding:12px 16px;margin:14px 0}
  .balance{font-size:18px;font-weight:700;color:#0c7fff;text-align:right;margin-top:16px}
</style></head><body>
<div class="head"><h1>SMS Nepal</h1><p>Official Payment Receipt</p></div>
<div class="row"><span class="label">Receipt No.</span><strong>${payment?.receiptNumber || fee.receiptNumber}</strong></div>
<div class="row"><span class="label">Student</span><span>${fee.student?.fullName} (${fee.student?.studentId})</span></div>
<div class="row"><span class="label">Category</span><span>${fee.category}${fee.month ? ' — ' + fee.month : ''}</span></div>
${itemRows ? '<div class="box">' + itemRows + '</div>' : ''}
<div class="row"><span class="label">Total Assigned</span><span>NPR ${Number(fee.totalAssignedFee).toLocaleString()}</span></div>
${fee.discount ? `<div class="row"><span class="label">Discount</span><span>NPR ${Number(fee.discount).toLocaleString()}</span></div>` : ''}
<div class="row"><span class="label">Amount Paid (this payment)</span><strong>NPR ${Number(payment?.amountPaid || 0).toLocaleString()}</strong></div>
<div class="row"><span class="label">Total Paid</span><span>NPR ${Number(payment?.totalPaid ?? fee.totalPaid).toLocaleString()}</span></div>
<div class="balance">Remaining: NPR ${Number(payment?.remainingBalance ?? fee.remainingBalance).toLocaleString()}</div>
<div class="row" style="margin-top:14px"><span class="label">Payment Method</span><span>${payment?.paymentMethod || fee.payments?.slice(-1)[0]?.paymentMethod || '—'}</span></div>
<div class="row"><span class="label">Date</span><span>${formatBS(payment?.date || Date.now())}</span></div>
<div class="row"><span class="label">Status</span><strong>${payment?.status || fee.status}</strong></div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '', 'width=600,height=750');
  w.addEventListener('load', () => { w.print(); URL.revokeObjectURL(url); });
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FeeList() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [summary, setSummary] = useState({ totalCollected: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [filter, setFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);

  // Create form state
  const [newFee, setNewFee] = useState({ student: '', dueDate: '', month: '', feeItems: [emptyItem()] });

  // Bulk form state
  const [bulkFee, setBulkFee] = useState({ classId: '', section: '', dueDate: '', month: '', feeItems: [emptyItem()] });

  // Payment form state
  const [payment, setPayment] = useState({ amount: '', paymentMethod: 'Cash', paidDate: '', remarks: '' });
  const [payLoading, setPayLoading] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const selectedFilterClass = classes.find((c) => c._id === classFilter);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_LIMIT };
      if (filter !== 'all') params.status = filter;
      if (classFilter) params.classId = classFilter;
      if (sectionFilter) params.section = sectionFilter;

      const [f, s, sum, cls] = await Promise.all([
        api.get('/fees', { params }),
        api.get('/students', { params: { limit: 500 } }),
        api.get('/fees/summary'),
        api.get('/classes'),
      ]);
      setFees(f.data.fees || []);
      setTotal(f.data.total || 0);
      setCurrentPage(f.data.page || 1);
      setStudents(s.data.students || []);
      setSummary(sum.data);
      setClasses(cls.data || []);
    } catch {
      toast.error('Failed to load fees');
    } finally {
      setLoading(false);
    }
  }, [filter, classFilter, sectionFilter]);

  useEffect(() => {
    setCurrentPage(1);
    load(1);
  }, [filter, classFilter, sectionFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const openPayModal = (fee) => {
    setPayOpen(fee);
    setPayment({ amount: fee.remainingBalance > 0 ? String(fee.remainingBalance) : '', paymentMethod: 'Cash', paidDate: '', remarks: '' });
  };

  // ── Create fee ──────────────────────────────────────────────────────────────
  const createFee = async (e) => {
    e.preventDefault();
    const total = totalOf(newFee.feeItems);
    if (!total) return toast.error('Total amount must be greater than 0');
    try {
      await api.post('/fees', {
        student: newFee.student,
        category: newFee.feeItems.length === 1 ? newFee.feeItems[0].type : 'Custom',
        totalAssignedFee: total,
        feeItems: newFee.feeItems.map((it) => ({ ...it, amount: Number(it.amount) })),
        dueDate: newFee.dueDate || undefined,
        month: newFee.month || undefined,
      });
      toast.success('Fee record created');
      setCreateOpen(false);
      setNewFee({ student: '', dueDate: '', month: '', feeItems: [emptyItem()] });
      load(currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Create failed');
    }
  };

  // ── Bulk assign ─────────────────────────────────────────────────────────────
  const bulkAssign = async (e) => {
    e.preventDefault();
    const total = totalOf(bulkFee.feeItems);
    if (!total) return toast.error('Total amount must be greater than 0');
    if (!bulkFee.classId) return toast.error('Select a class');
    try {
      const { data } = await api.post('/fees/bulk-assign', {
        classId: bulkFee.classId,
        section: bulkFee.section || undefined,
        category: bulkFee.feeItems.length === 1 ? bulkFee.feeItems[0].type : 'Custom',
        totalAssignedFee: total,
        feeItems: bulkFee.feeItems.map((it) => ({ ...it, amount: Number(it.amount) })),
        dueDate: bulkFee.dueDate || undefined,
        month: bulkFee.month || undefined,
      });
      toast.success(data.message);
      setBulkOpen(false);
      setBulkFee({ classId: '', section: '', dueDate: '', month: '', feeItems: [emptyItem()] });
      load(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk assign failed');
    }
  };

  // ── Record payment ──────────────────────────────────────────────────────────
  const recordPayment = async (e) => {
    e.preventDefault();
    const payAmount = Number(payment.amount);
    if (!payAmount || payAmount <= 0) return toast.error('Enter a valid amount');
    if (payAmount > payOpen.remainingBalance + 0.01) {
      return toast.error(`Amount exceeds remaining balance of ${fmt(payOpen.remainingBalance)}`);
    }
    setPayLoading(true);
    try {
      const { data } = await api.post(`/fees/${payOpen._id}/payment`, {
        amount: payAmount,
        paymentMethod: payment.paymentMethod,
        paidDate: payment.paidDate || undefined,
        remarks: payment.remarks || undefined,
      });
      toast.success('Payment recorded');
      setLastReceipt({ fee: data.fee, receipt: data.receipt });
      setPayOpen(data.fee);
      setPayment({ amount: data.fee.remainingBalance > 0 ? String(data.fee.remainingBalance) : '', paymentMethod: 'Cash', paidDate: '', remarks: '' });
      setFees((prev) => prev.map((f) => f._id === data.fee._id ? data.fee : f));
      load(currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPayLoading(false);
    }
  };

  // ── Delete payment ──────────────────────────────────────────────────────────
  const deletePayment = (feeId, paymentId) => {
    setConfirmState({
      title: 'Remove this payment?',
      message: 'Fee totals and status will be recalculated immediately.',
      confirmLabel: 'Remove',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const { data } = await api.delete(`/fees/${feeId}/payment/${paymentId}`);
          toast.success('Payment removed');
          setPayOpen(data.fee);
          setPayment({ amount: data.fee.remainingBalance > 0 ? data.fee.remainingBalance : '', paymentMethod: 'Cash', paidDate: '', remarks: '' });
          setFees((prev) => prev.map((f) => f._id === feeId ? data.fee : f));
        } catch (err) {
          toast.error(err.response?.data?.message || 'Delete failed');
        }
      },
    });
  };

  const selectedBulkClass = classes.find((c) => c._id === bulkFee.classId);
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  return (
    <div>
      {confirmState && (
        <ConfirmModal {...confirmState} onCancel={() => setConfirmState(null)} />
      )}
      <PageHeader
        title="Fee Management"
        subtitle="Assign fees, record payments, and track balances"
        action={
          <div className="flex gap-2">
            <button onClick={() => setBulkOpen(true)} className="btn-secondary">
              <Layers size={16} /> Bulk Assign
            </button>
            <button onClick={() => setCreateOpen(true)} className="btn-primary">
              <Plus size={16} /> New Fee Record
            </button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <SummaryCard icon={TrendingUp} gradient="bg-gradient-mint" label="Total Collected" value={fmt(summary.totalCollected)} />
        <SummaryCard icon={AlertCircle} gradient="bg-gradient-sunset" label="Total Pending" value={fmt(summary.totalPending)} />
        <SummaryCard icon={Wallet} gradient="bg-gradient-brand" label="Fee Records" value={total} />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Status tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          {['all', 'Unpaid', 'Partial', 'Paid'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                filter === f ? 'bg-white shadow-card text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Class filter */}
        <select
          value={classFilter}
          onChange={(e) => { setClassFilter(e.target.value); setSectionFilter(''); }}
          className="input w-40 py-2"
        >
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        {/* Section filter */}
        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="input w-36 py-2"
          disabled={!classFilter}
        >
          <option value="">All Sections</option>
          {(selectedFilterClass?.sections || []).map((s) => <option key={s}>{s}</option>)}
        </select>

        {(classFilter || sectionFilter) && (
          <button
            onClick={() => { setClassFilter(''); setSectionFilter(''); }}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Fee table */}
      {loading ? <Loader /> : fees.length === 0 ? (
        <div className="card"><EmptyState title="No fee records found" icon={Wallet} /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">Assigned</th>
                  <th className="px-5 py-3 text-right">Paid</th>
                  <th className="px-5 py-3 text-right">Remaining</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fees.map((f) => {
                  const sm = STATUS_META[f.status] || STATUS_META.Unpaid;
                  return (
                    <tr key={f._id} className="hover:bg-slate-50/70 text-sm">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-900">{f.student?.fullName}</div>
                        <div className="text-xs text-slate-400 font-mono">{f.student?.studentId}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium">{f.category}</div>
                        {f.month && <div className="text-xs text-slate-400">{f.month}</div>}
                        {f.feeItems?.length > 1 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {f.feeItems.map((it, i) => (
                              <span key={i} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{it.type}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-700">{fmt(f.totalAssignedFee)}</td>
                      <td className="px-5 py-3 text-right font-mono text-emerald-700">{fmt(f.totalPaid)}</td>
                      <td className={`px-5 py-3 text-right font-mono font-semibold ${f.remainingBalance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {fmt(f.remainingBalance)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge color={sm.color}>{f.status}</Badge>
                        {f.payments?.length > 0 && (
                          <div className="text-xs text-slate-400 mt-0.5">{f.payments.length} payment{f.payments.length > 1 ? 's' : ''}</div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {f.status !== 'Paid' && (
                            <button
                              onClick={() => openPayModal(f)}
                              className="btn-primary text-xs py-1.5 px-3"
                            >
                              <CreditCard size={13} /> Pay
                            </button>
                          )}
                          {/* History button — always visible so paid fees can be reviewed */}
                          <button
                            onClick={() => openPayModal(f)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                            title={f.payments?.length > 0 ? 'View payment history' : 'View fee details'}
                          >
                            <Clock size={14} />
                          </button>
                          <button onClick={() => printReceipt(f, null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="Print receipt">
                            <Printer size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-sm text-slate-500">
              <span>Showing {(currentPage - 1) * PAGE_LIMIT + 1}–{Math.min(currentPage * PAGE_LIMIT, total)} of {total} records</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => load(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 bg-slate-100 rounded-lg font-semibold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => load(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create modal ── */}
      {createOpen && (
        <Modal title="New Fee Record" onClose={() => setCreateOpen(false)}>
          <form onSubmit={createFee} className="space-y-4">
            <div>
              <label className="label">Student *</label>
              <select required value={newFee.student} onChange={(e) => setNewFee({ ...newFee, student: e.target.value })} className="input">
                <option value="">Select student...</option>
                {students.map((s) => <option key={s._id} value={s._id}>{s.fullName} ({s.studentId})</option>)}
              </select>
            </div>
            <FeeItemsEditor items={newFee.feeItems} setter={setNewFee} />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Due Date</label><input type="date" value={newFee.dueDate} onChange={(e) => setNewFee({ ...newFee, dueDate: e.target.value })} className="input" /></div>
              <div><label className="label">Month Label</label><input value={newFee.month} onChange={(e) => setNewFee({ ...newFee, month: e.target.value })} className="input" placeholder="e.g. Baishakh 2082" /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Bulk assign modal ── */}
      {bulkOpen && (
        <Modal title="Bulk Fee Assignment" onClose={() => setBulkOpen(false)} wide>
          <form onSubmit={bulkAssign} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Class *</label>
                <select required value={bulkFee.classId} onChange={(e) => setBulkFee({ ...bulkFee, classId: e.target.value, section: '' })} className="input">
                  <option value="">Select class...</option>
                  {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Section (optional)</label>
                <select value={bulkFee.section} onChange={(e) => setBulkFee({ ...bulkFee, section: e.target.value })} className="input">
                  <option value="">All sections</option>
                  {(selectedBulkClass?.sections || []).map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <FeeItemsEditor items={bulkFee.feeItems} setter={setBulkFee} />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Due Date</label><input type="date" value={bulkFee.dueDate} onChange={(e) => setBulkFee({ ...bulkFee, dueDate: e.target.value })} className="input" /></div>
              <div><label className="label">Month Label</label><input value={bulkFee.month} onChange={(e) => setBulkFee({ ...bulkFee, month: e.target.value })} className="input" placeholder="e.g. Baishakh 2082" /></div>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
              Creates one fee record per active student in the selected class/section.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setBulkOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary"><Layers size={14} /> Assign to Class</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Payment modal ── */}
      {payOpen && (
        <Modal title={`Fee Payments — ${payOpen.student?.fullName || ''}`} onClose={() => { setPayOpen(null); setPayment({ amount: '', paymentMethod: 'Cash', paidDate: '', remarks: '' }); }} wide>
          {/* Fee summary bar */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <BalanceCard label="Total Assigned" value={fmt(payOpen.totalAssignedFee)} sub={payOpen.discount ? `Discount: ${fmt(payOpen.discount)}` : null} />
            <BalanceCard label="Total Paid" value={fmt(payOpen.totalPaid)} color="text-emerald-600" />
            <BalanceCard label="Remaining" value={fmt(payOpen.remainingBalance)} color={payOpen.remainingBalance > 0 ? 'text-rose-600' : 'text-slate-400'} />
          </div>

          {/* Fee info */}
          <div className="flex gap-3 mb-4 text-xs text-slate-500">
            <span className="bg-slate-100 rounded-lg px-2 py-1">{payOpen.category}{payOpen.month ? ` — ${payOpen.month}` : ''}</span>
            <Badge color={(STATUS_META[payOpen.status] || STATUS_META.Unpaid).color}>{payOpen.status}</Badge>
          </div>

          {/* Payment history */}
          <div className="mb-5">
            <p className="label mb-2">Payment History</p>
            <PaymentHistory fee={payOpen} onDelete={(pid) => deletePayment(payOpen._id, pid)} />
          </div>

          {/* Add payment form */}
          {payOpen.status !== 'Paid' ? (
            <form onSubmit={recordPayment} className="space-y-3 border-t pt-4">
              <p className="text-sm font-semibold text-slate-700">Record New Payment</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount (NPR) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={payment.amount}
                    onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                    className="input"
                    placeholder={`Max ${fmt(payOpen.remainingBalance)}`}
                  />
                  <p className="text-xs text-slate-400 mt-1">Remaining: {fmt(payOpen.remainingBalance)}</p>
                </div>
                <div>
                  <label className="label">Payment Method</label>
                  <select value={payment.paymentMethod} onChange={(e) => setPayment({ ...payment, paymentMethod: e.target.value })} className="input">
                    {METHODS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date (leave blank for today)</label>
                  <input type="date" value={payment.paidDate} onChange={(e) => setPayment({ ...payment, paidDate: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Remarks (optional)</label>
                  <input value={payment.remarks} onChange={(e) => setPayment({ ...payment, remarks: e.target.value })} className="input" placeholder="e.g. partial payment" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="submit" disabled={payLoading} className="btn-primary">
                  <CreditCard size={14} /> {payLoading ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          ) : (
            <div className="border-t pt-4 text-center text-sm text-emerald-600 font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> This fee is fully paid.
            </div>
          )}
        </Modal>
      )}

      {/* ── Receipt modal after payment ── */}
      {lastReceipt && (
        <Modal title="Payment Recorded" onClose={() => setLastReceipt(null)}>
          <div className="space-y-3">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <p className="font-display font-bold text-lg">Payment Successful</p>
              <p className="text-xs text-slate-400 font-mono mt-1">{lastReceipt.receipt.receiptNumber}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              {[
                ['Student', lastReceipt.receipt.studentName],
                ['Amount Paid', fmt(lastReceipt.receipt.amountPaid)],
                ['Total Paid', fmt(lastReceipt.receipt.totalPaid)],
                ['Remaining', fmt(lastReceipt.receipt.remainingBalance)],
                ['Method', lastReceipt.receipt.paymentMethod],
                ['Date', formatBS(lastReceipt.receipt.date)],
                ['Status', lastReceipt.receipt.status],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold">{val}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => printReceipt(lastReceipt.fee, lastReceipt.receipt)} className="btn-secondary flex-1">
                <Printer size={14} /> Print Receipt
              </button>
              <button onClick={() => setLastReceipt(null)} className="btn-primary flex-1">Done</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── small sub-components ─────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, gradient, label, value }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl ${gradient} text-white flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} />
        </div>
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
          <div className="text-2xl font-display font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function BalanceCard({ label, value, color = 'text-slate-900', sub }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 text-center">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-base font-display font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}
