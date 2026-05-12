import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, AlertTriangle, Download } from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader } from '../../components/ui/Misc.jsx';
import { currentBSYear } from '../../utils/nepaliDate.js';

const fmt = n => Number(n || 0).toLocaleString();

export default function TrialBalance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState(currentBSYear());

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/accounting/trial-balance', { params: { academicYear } });
      setData(res);
    } catch { toast.error('Failed to load trial balance'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [academicYear]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [['Account Code', 'Account Name', 'Debit (NPR)', 'Credit (NPR)']];
    data.rows.forEach(r => rows.push([r._id.accountCode, r._id.accountName, r.debit || '', r.credit || '']));
    rows.push(['', 'TOTAL', data.totalDebit, data.totalCredit]);
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `trial-balance-${academicYear}.csv`;
    a.click();
  };

  return (
    <div>
      <PageHeader
        title="Trial Balance"
        subtitle={`Academic Year ${academicYear}`}
        action={
          <div className="flex gap-2 items-center">
            <input value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="input py-1.5 text-sm w-28 font-mono" placeholder="2082" />
            <button onClick={exportCSV} disabled={!data} className="btn-secondary flex items-center gap-1.5 text-sm">
              <Download size={14} /> CSV
            </button>
          </div>
        }
      />

      {loading ? <Loader /> : !data || data.rows.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 text-sm">No posted journal entries for this period.</div>
      ) : (
        <>
          {/* Balance status */}
          <div className={`flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-sm font-medium ${data.isBalanced ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {data.isBalanced
              ? <><CheckCircle size={16} /> Trial balance is in balance — total debits equal total credits.</>
              : <><AlertTriangle size={16} /> Out of balance! Debits: NPR {fmt(data.totalDebit)} | Credits: NPR {fmt(data.totalCredit)}</>
            }
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Name</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Debit (NPR)</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Credit (NPR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.rows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 font-mono text-slate-500 text-xs">{r._id.accountCode}</td>
                      <td className="px-4 py-2.5 text-slate-700">{r._id.accountName}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-800">{r.debit > 0 ? fmt(r.debit) : ''}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-800">{r.credit > 0 ? fmt(r.credit) : ''}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                    <td className="px-4 py-3" colSpan={2}>TOTAL</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(data.totalDebit)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(data.totalCredit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
