import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, X, Edit2, Trash2, ChevronRight, Database } from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader } from '../../components/ui/Misc.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';

const TYPE_COLORS = {
  asset:     'bg-blue-50 text-blue-700',
  liability: 'bg-orange-50 text-orange-700',
  equity:    'bg-purple-50 text-purple-700',
  revenue:   'bg-emerald-50 text-emerald-700',
  expense:   'bg-rose-50 text-rose-700',
};

const BLANK = { code: '', name: '', type: 'asset', normalBalance: 'debit', isGroup: false, description: '', parent: '' };

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/accounting/accounts');
      setAccounts(data);
    } catch { toast.error('Failed to load accounts'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const seed = async () => {
    setSeeding(true);
    try {
      await api.post('/accounting/accounts/seed');
      toast.success('Chart of Accounts seeded');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Seed failed'); }
    finally { setSeeding(false); }
  };

  const openCreate = () => { setEditing(null); setForm(BLANK); setModalOpen(true); };
  const openEdit = (a) => {
    setEditing(a);
    setForm({ code: a.code, name: a.name, type: a.type, normalBalance: a.normalBalance, isGroup: a.isGroup, description: a.description || '', parent: a.parent?._id || '' });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, parent: form.parent || null };
      if (editing) {
        await api.put(`/accounting/accounts/${editing._id}`, payload);
        toast.success('Account updated');
      } else {
        await api.post('/accounting/accounts', payload);
        toast.success('Account created');
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = (a) => {
    setConfirm({
      title: 'Delete account?',
      message: `Delete "${a.name}" (${a.code})? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.delete(`/accounting/accounts/${a._id}`);
          toast.success('Deleted');
          load();
        } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
      },
    });
  };

  const groups = accounts.filter(a => a.isGroup);
  const filtered = accounts.filter(a =>
    !filter || a.code.includes(filter) || a.name.toLowerCase().includes(filter.toLowerCase()) || a.type.includes(filter)
  );

  if (loading) return <Loader />;

  return (
    <div>
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}

      <PageHeader
        title="Chart of Accounts"
        subtitle={`${accounts.length} accounts`}
        action={
          <div className="flex gap-2">
            {accounts.length === 0 && (
              <button onClick={seed} disabled={seeding} className="btn-secondary flex items-center gap-1.5">
                <Database size={15} /> {seeding ? 'Seeding…' : 'Seed Default COA'}
              </button>
            )}
            <button onClick={openCreate} className="btn-primary flex items-center gap-1.5">
              <Plus size={15} /> Add Account
            </button>
          </div>
        }
      />

      {/* Filter */}
      <div className="mb-4">
        <input
          value={filter} onChange={e => setFilter(e.target.value)}
          className="input max-w-xs" placeholder="Search code, name, or type…"
        />
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            {accounts.length === 0 ? 'No accounts yet — seed the default Chart of Accounts to get started.' : 'No accounts match your search.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Parent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Normal Balance</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(a => (
                  <tr key={a._id} className={`hover:bg-slate-50/60 transition-colors ${a.isGroup ? 'bg-slate-50/40 font-medium' : ''}`}>
                    <td className="px-4 py-3 font-mono text-slate-600">{a.code}</td>
                    <td className="px-4 py-3 text-slate-800">
                      <div className="flex items-center gap-1.5">
                        {a.parent && <ChevronRight size={12} className="text-slate-300" />}
                        {a.name}
                        {a.isGroup && <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold">GROUP</span>}
                        {a.isSystem && <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-semibold">SYS</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[a.type] || 'bg-slate-100 text-slate-600'}`}>
                        {a.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell text-xs">
                      {a.parent ? `${a.parent.code} ${a.parent.name}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell capitalize">{a.normalBalance}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Edit2 size={13} /></button>
                        {!a.isSystem && (
                          <button onClick={() => handleDelete(a)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={13} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-8">
            <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-lg">{editing ? 'Edit Account' : 'New Account'}</h3>
                <button type="button" onClick={() => setModalOpen(false)} className="p-1 rounded hover:bg-slate-100"><X size={18} /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Code *</label>
                    <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="input font-mono" placeholder="e.g. 1110" disabled={!!editing?.isSystem} />
                  </div>
                  <div>
                    <label className="label">Type *</label>
                    <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, normalBalance: ['asset','expense'].includes(e.target.value) ? 'debit' : 'credit' }))} className="input" disabled={!!editing?.isSystem}>
                      {['asset','liability','equity','revenue','expense'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Account name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Normal Balance</label>
                    <select value={form.normalBalance} onChange={e => setForm(f => ({ ...f, normalBalance: e.target.value }))} className="input">
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Parent Account</label>
                    <select value={form.parent} onChange={e => setForm(f => ({ ...f, parent: e.target.value }))} className="input">
                      <option value="">None</option>
                      {groups.map(g => <option key={g._id} value={g._id}>{g.code} {g.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isGroup" checked={form.isGroup} onChange={e => setForm(f => ({ ...f, isGroup: e.target.checked }))} className="rounded" />
                  <label htmlFor="isGroup" className="text-sm text-slate-600">Group account (header — cannot post transactions directly)</label>
                </div>
                <div>
                  <label className="label">Description</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" placeholder="Optional" />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
