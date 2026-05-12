import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader } from '../../components/ui/Misc.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { formatBS } from '../../utils/nepaliDate.js';

const fmt = n => `NPR ${Number(n || 0).toLocaleString()}`;

const SOURCE_LABELS = {
  fee_invoice: 'Fee Invoice', fee_payment: 'Fee Payment', fee_refund: 'Fee Refund',
  salary_accrual: 'Salary Accrual', salary_payment: 'Salary Payment',
  expense: 'Expense', manual: 'Manual', reversal: 'Reversal', opening_balance: 'Opening Balance',
};

const BLANK_LINE = { account: '', type: 'debit', amount: '', description: '' };

export default function Journals() {
  const [journals, setJournals] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [lines, setLines] = useState([{ ...BLANK_LINE }, { ...BLANK_LINE }]);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), narration: '' });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [filterSource, setFilterSource] = useState('');
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (filterSource) params.source = filterSource;
      const { data } = await api.get('/accounting/journals', { params });
      setJournals(data.journals || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load journals'); }
    finally { setLoading(false); }
  }, [page, filterSource]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/accounting/accounts').then(r => setAccounts(r.data || [])).catch(() => {});
  }, []);

  const addLine = () => setLines(l => [...l, { ...BLANK_LINE }]);
  const removeLine = idx => setLines(l => l.filter((_, i) => i !== idx));
  const updateLine = (idx, field, value) => setLines(l => l.map((ln, i) => i === idx ? { ...ln, [field]: value } : ln));

  const totalDebit  = lines.reduce((s, l) => l.type === 'debit'  ? s + (Number(l.amount) || 0) : s, 0);
  const totalCredit = lines.reduce((s, l) => l.type === 'credit' ? s + (Number(l.amount) || 0) : s, 0);
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const save = async (e) => {
    e.preventDefault();
    if (!isBalanced) { toast.error('Journal must be balanced (debits = credits)'); return; }
    setSaving(true);
    try {
      await api.post('/accounting/journals', {
        date: form.date,
        narration: form.narration,
        lines: lines.map(l => ({ account: l.account, type: l.type, amount: Number(l.amount), description: l.description })),
      });
      toast.success('Journal posted');
      setModalOpen(false);
      setLines([{ ...BLANK_LINE }, { ...BLANK_LINE }]);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Post failed'); }
    finally { setSaving(false); }
  };

  const handleReverse = (j) => {
    setConfirm({
      title: 'Reverse this journal?',
      message: `This will create a new reversal entry for ${j.journalNumber}. The original entry remains unchanged.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.post(`/accounting/journals/${j._id}/reverse`, { narration: `Reversal of ${j.journalNumber}` });
          toast.success('Journal reversed');
          load();
        } catch (err) { toast.error(err.response?.data?.message || 'Reversal failed'); }
      },
    });
  };

  if (loading && page === 1) return <Loader />;

  const pages = Math.ceil(total / LIMIT);

  return (
    <div>
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}

      <PageHeader
        title="Journals"
        subtitle={`${total} entries`}
        action={
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Manual Entry
          </button>
        }
      />

      {/* Filter */}
      <div className="mb-4 flex items-center gap-3">
        <select value={filterSource} onChange={e => { setFilterSource(e.target.value); setPage(1); }} className="input py-1.5 text-sm w-auto">
          <option value="">All Sources</option>
          {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {journals.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No journal entries found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {journals.map(j => (
              <div key={j._id}>
                <div
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 cursor-pointer transition-colors"
                  onClick={() => setExpandedId(expandedId === j._id ? null : j._id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-slate-800">{j.journalNumber}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{SOURCE_LABELS[j.source] || j.source}</span>
                      {j.status === 'reversed' && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">Reversed</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{j.narration}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-slate-700">{fmt(j.totalDebit)}</div>
                    <div className="text-xs text-slate-400">{formatBS(j.date)}</div>
                  </div>
                  {expandedId === j._id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </div>

                {expandedId === j._id && (
                  <div className="bg-slate-50/50 border-t border-slate-100 px-4 py-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-400">
                          <th className="text-left pb-1 font-semibold">Account</th>
                          <th className="text-right pb-1 font-semibold">Debit</th>
                          <th className="text-right pb-1 font-semibold">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(j.lines || []).map((l, i) => (
                          <tr key={i}>
                            <td className="py-1 text-slate-600">
                              <span className="font-mono mr-1 text-slate-400">{l.accountCode}</span> {l.accountName}
                              {l.description && <span className="text-slate-400 ml-1">— {l.description}</span>}
                            </td>
                            <td className="py-1 text-right font-mono text-slate-700">{l.type === 'debit' ? fmt(l.amount) : ''}</td>
                            <td className="py-1 text-right font-mono text-slate-700">{l.type === 'credit' ? fmt(l.amount) : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {j.status === 'posted' && j.source === 'manual' && (
                      <div className="mt-2 flex justify-end">
                        <button onClick={() => handleReverse(j)} className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium">
                          <RotateCcw size={12} /> Reverse
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Prev</button>
          <span className="text-sm text-slate-500">{page} / {pages}</span>
          <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Manual Journal Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-8">
            <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-lg">Manual Journal Entry</h3>
                <button type="button" onClick={() => setModalOpen(false)} className="p-1 rounded hover:bg-slate-100"><X size={18} /></button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="label">Date *</label>
                  <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Narration *</label>
                  <input required value={form.narration} onChange={e => setForm(f => ({ ...f, narration: e.target.value }))} className="input" placeholder="Description of this entry" />
                </div>
              </div>

              {/* Lines */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
                <div className="grid grid-cols-[2fr_80px_110px_1fr_28px] bg-slate-50 border-b border-slate-200 px-3 py-2 gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Account</span>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Dr/Cr</span>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Amount</span>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Description</span>
                  <span />
                </div>
                {lines.map((ln, idx) => (
                  <div key={idx} className="grid grid-cols-[2fr_80px_110px_1fr_28px] px-3 py-2 gap-2 items-center border-b border-slate-100 last:border-0">
                    <select required value={ln.account} onChange={e => updateLine(idx, 'account', e.target.value)} className="input py-1.5 text-sm">
                      <option value="">Select account</option>
                      {accounts.filter(a => !a.isGroup).map(a => <option key={a._id} value={a._id}>{a.code} — {a.name}</option>)}
                    </select>
                    <select value={ln.type} onChange={e => updateLine(idx, 'type', e.target.value)} className="input py-1.5 text-sm">
                      <option value="debit">Dr</option>
                      <option value="credit">Cr</option>
                    </select>
                    <input required type="number" min="0.01" step="0.01" value={ln.amount} onChange={e => updateLine(idx, 'amount', e.target.value)} className="input py-1.5 text-sm font-mono" placeholder="0.00" />
                    <input value={ln.description} onChange={e => updateLine(idx, 'description', e.target.value)} className="input py-1.5 text-sm" placeholder="Optional" />
                    {lines.length > 2 ? (
                      <button type="button" onClick={() => removeLine(idx)} className="text-rose-400 hover:text-rose-600 flex items-center justify-center"><X size={14} /></button>
                    ) : <span />}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-5">
                <button type="button" onClick={addLine} className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                  <Plus size={13} /> Add line
                </button>
                <div className="flex gap-6 text-sm">
                  <span className="text-slate-500">Dr: <span className="font-mono font-semibold text-slate-800">{fmt(totalDebit)}</span></span>
                  <span className="text-slate-500">Cr: <span className="font-mono font-semibold text-slate-800">{fmt(totalCredit)}</span></span>
                  <span className={`font-semibold ${isBalanced ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {isBalanced ? '✓ Balanced' : `Off by ${fmt(Math.abs(totalDebit - totalCredit))}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving || !isBalanced} className="btn-primary disabled:opacity-50">
                  {saving ? 'Posting…' : 'Post Journal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
