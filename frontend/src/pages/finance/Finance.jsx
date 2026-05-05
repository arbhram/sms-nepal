import { useEffect, useState, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, TrendingUp, TrendingDown, DollarSign, Filter, X,
  Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, Paperclip,
  ImageIcon, FileText, PlusCircle, MinusCircle, ExternalLink,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader } from '../../components/ui/Misc.jsx';
import { formatBS, currentBSYear } from '../../utils/nepaliDate.js';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';

const INCOME_CATEGORIES = ['Fee Collection', 'Donation', 'Government Grant', 'Rental Income', 'Other Income'];
const EXPENSE_CATEGORIES = ['Staff Salaries', 'Utilities', 'Rent', 'Stationery & Supplies', 'Equipment & Furniture', 'Maintenance', 'Events & Activities', 'Transport', 'Other Expense'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'eSewa', 'Khalti', 'FonePay', 'Cheque'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const BLANK_ITEM = { name: '', quantity: 1, unitPrice: '' };
const BLANK = {
  type: 'income', amount: '', category: '', description: '',
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: 'Cash', reference: '',
  items: [], attachment: null,
};

const fmt = (n) => `NPR ${Number(n || 0).toLocaleString()}`;

const itemsTotal = (items) =>
  items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);

export default function Finance() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const year = new Date().getFullYear();
      const [txRes, sumRes] = await Promise.all([
        api.get('/transactions', { params: { limit: 200 } }),
        api.get('/transactions/summary', { params: { year } }),
      ]);
      setTransactions(txRes.data.transactions || []);
      setSummary(sumRes.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(BLANK);
    setPreviewUrl(null);
    setModalOpen(true);
  };

  const openEdit = (tx) => {
    setEditing(tx);
    setForm({
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      description: tx.description || '',
      date: tx.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      paymentMethod: tx.paymentMethod || 'Cash',
      reference: tx.reference || '',
      items: (tx.items || []).map((i) => ({ ...i })),
      attachment: null,
    });
    setPreviewUrl(tx.attachmentUrl || null);
    setModalOpen(true);
  };

  // Items helpers
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { ...BLANK_ITEM }] }));
  const removeItem = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, value) =>
    setForm((f) => ({ ...f, items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item) }));

  const computedTotal = itemsTotal(form.items);
  const useItems = form.items.length > 0;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((f) => ({ ...f, attachment: file }));
    if (file) {
      const isPdf = file.type === 'application/pdf';
      setPreviewUrl(isPdf ? '__pdf__' : URL.createObjectURL(file));
    }
  };

  const clearAttachment = () => {
    setForm((f) => ({ ...f, attachment: null }));
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.category) { toast.error('Please select a category'); return; }
    if (!useItems && !form.amount) { toast.error('Enter an amount or add items'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('type', form.type);
      fd.append('category', form.category);
      fd.append('description', form.description);
      fd.append('date', form.date);
      fd.append('paymentMethod', form.paymentMethod);
      fd.append('reference', form.reference);
      fd.append('items', JSON.stringify(form.items));
      if (!useItems) fd.append('amount', form.amount);
      if (form.attachment instanceof File) fd.append('attachment', form.attachment);

      if (editing) {
        await api.put(`/transactions/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Transaction added');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = (tx) => {
    setConfirmState({
      title: 'Delete transaction?',
      message: `This will permanently remove the ${tx.type} of ${fmt(tx.amount)}.`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await api.delete(`/transactions/${tx._id}`);
          toast.success('Deleted');
          load();
        } catch { toast.error('Delete failed'); }
      },
    });
  };

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  const filtered = useMemo(() => transactions.filter((tx) => {
    if (filterType && tx.type !== filterType) return false;
    if (filterCategory && tx.category !== filterCategory) return false;
    return true;
  }), [transactions, filterType, filterCategory]);

  if (loading) return <Loader />;

  const chartData = (summary?.monthly || []).map((m, i) => ({
    month: MONTHS[i],
    Income: m.income,
    Expense: m.expense,
  }));

  return (
    <div>
      {confirmState && <ConfirmModal {...confirmState} onCancel={() => setConfirmState(null)} />}

      <PageHeader
        title="Finance"
        subtitle="Track school income and expenses"
        action={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Transaction</button>}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Income</span>
          </div>
          <div className="text-2xl font-display font-bold text-slate-900">{fmt(summary?.totalIncome)}</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">All time</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <TrendingDown size={18} className="text-rose-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Expense</span>
          </div>
          <div className="text-2xl font-display font-bold text-slate-900">{fmt(summary?.totalExpense)}</div>
          <div className="text-xs text-rose-600 mt-1 font-medium">All time</div>
        </div>
        <div className={`card p-5 ${(summary?.net || 0) >= 0 ? 'border-emerald-200' : 'border-rose-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${(summary?.net || 0) >= 0 ? 'bg-brand-50' : 'bg-rose-50'}`}>
              <DollarSign size={18} className={(summary?.net || 0) >= 0 ? 'text-brand-600' : 'text-rose-600'} />
            </div>
            <span className="text-sm font-medium text-slate-500">Net Balance</span>
          </div>
          <div className={`text-2xl font-display font-bold ${(summary?.net || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {(summary?.net || 0) >= 0 ? '+' : ''}{fmt(summary?.net)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Income − Expense</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card p-6 mb-6">
        <h3 className="font-display font-bold text-slate-900 mb-1">Income vs Expense — B.S. {currentBSYear()}</h3>
        <p className="text-sm text-slate-500 mb-5">Monthly overview</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} formatter={(v) => [`NPR ${Number(v).toLocaleString()}`, undefined]} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" dot={false} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={2} fill="url(#expenseGrad)" dot={false} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Filter size={14} className="text-slate-400" />
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterCategory(''); }} className="input py-1.5 text-sm w-auto">
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input py-1.5 text-sm w-auto">
          <option value="">All Categories</option>
          {(filterType === 'income' ? INCOME_CATEGORIES : filterType === 'expense' ? EXPENSE_CATEGORIES : allCategories).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {(filterType || filterCategory) && (
          <button onClick={() => { setFilterType(''); setFilterCategory(''); }} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800">
            <X size={12} /> Clear
          </button>
        )}
        <span className="ml-auto text-sm text-slate-400">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Method</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatBS(tx.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        tx.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {tx.type === 'income' ? <ArrowUpCircle size={11} /> : <ArrowDownCircle size={11} />}
                        {tx.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{tx.category}</td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell max-w-[180px] truncate">
                      {tx.description || (tx.items?.length > 0 ? `${tx.items.length} item${tx.items.length !== 1 ? 's' : ''}` : '—')}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{tx.paymentMethod}</td>
                    <td className={`px-4 py-3 text-right font-semibold font-mono whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'income' ? '+' : '−'} NPR {Number(tx.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {tx.attachmentUrl && (
                          <a href={tx.attachmentUrl} target="_blank" rel="noreferrer"
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600" title="View attachment">
                            <Paperclip size={13} />
                          </a>
                        )}
                        <button onClick={() => openEdit(tx)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(tx)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-8">
            <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-lg">{editing ? 'Edit Transaction' : 'Add Transaction'}</h3>
                <button type="button" onClick={() => setModalOpen(false)} className="p-1 rounded hover:bg-slate-100"><X size={18} /></button>
              </div>

              <div className="space-y-4">
                {/* Type toggle */}
                <div className="flex rounded-xl overflow-hidden border border-slate-200">
                  {['income', 'expense'].map((t) => (
                    <button
                      key={t} type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t, category: '' }))}
                      className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${
                        form.type === t
                          ? t === 'income' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {t === 'income' ? '↑ Income' : '↓ Expense'}
                    </button>
                  ))}
                </div>

                {/* Items section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Line Items</label>
                    <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                      <PlusCircle size={13} /> Add Item
                    </button>
                  </div>

                  {form.items.length > 0 && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden mb-2">
                      <div className="grid grid-cols-[1fr_60px_90px_28px] gap-0 bg-slate-50 border-b border-slate-200 px-3 py-1.5">
                        <span className="text-xs font-semibold text-slate-400 uppercase">Item</span>
                        <span className="text-xs font-semibold text-slate-400 uppercase text-center">Qty</span>
                        <span className="text-xs font-semibold text-slate-400 uppercase text-right">Unit Price</span>
                        <span />
                      </div>
                      {form.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-[1fr_60px_90px_28px] gap-1 px-3 py-2 items-center border-b border-slate-100 last:border-0">
                          <input
                            required
                            value={item.name}
                            onChange={(e) => updateItem(idx, 'name', e.target.value)}
                            className="input py-1 text-sm"
                            placeholder="Item name"
                          />
                          <input
                            required type="number" min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                            className="input py-1 text-sm text-center"
                          />
                          <input
                            required type="number" min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                            className="input py-1 text-sm text-right"
                            placeholder="0"
                          />
                          <button type="button" onClick={() => removeItem(idx)} className="flex items-center justify-center text-rose-400 hover:text-rose-600">
                            <MinusCircle size={15} />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center justify-end gap-2 px-3 py-2 bg-slate-50 border-t border-slate-200">
                        <span className="text-xs text-slate-500">Total</span>
                        <span className="font-semibold text-sm text-slate-900 font-mono">NPR {computedTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {form.items.length === 0 && (
                    <p className="text-xs text-slate-400 mb-1">No items added — enter a total amount below instead.</p>
                  )}
                </div>

                {/* Manual amount — shown only when no items */}
                {!useItems && (
                  <div>
                    <label className="label">Amount (NPR) *</label>
                    <input required type="number" min="1" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="input" placeholder="0" />
                  </div>
                )}

                <div>
                  <label className="label">Category *</label>
                  <select required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input">
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Date *</label>
                    <input required type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input" />
                  </div>
                  <div>
                    <label className="label">Payment Method</label>
                    <select value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))} className="input">
                      {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Description</label>
                  <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input" placeholder="Optional note" />
                </div>

                <div>
                  <label className="label">Reference / Receipt No.</label>
                  <input value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} className="input" placeholder="Optional" />
                </div>

                {/* Attachment */}
                <div>
                  <label className="label">Invoice / Proof</label>

                  {previewUrl ? (
                    <div className="relative border border-slate-200 rounded-xl overflow-hidden">
                      {previewUrl === '__pdf__' ? (
                        <div className="flex items-center gap-3 p-4 bg-slate-50">
                          <FileText size={28} className="text-rose-500 flex-shrink-0" />
                          <span className="text-sm text-slate-700 flex-1 truncate">
                            {form.attachment?.name || 'PDF document'}
                          </span>
                          {editing?.attachmentUrl && !form.attachment && (
                            <a href={editing.attachmentUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:text-brand-700">
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <img src={previewUrl} alt="attachment" className="w-full max-h-48 object-contain bg-slate-50" />
                      )}
                      <button
                        type="button"
                        onClick={clearAttachment}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white shadow border border-slate-200 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-5 cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-colors">
                      <ImageIcon size={24} className="text-slate-300" />
                      <span className="text-sm text-slate-500">Click to upload image or PDF</span>
                      <span className="text-xs text-slate-400">JPG, PNG, PDF — max 5 MB</span>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
