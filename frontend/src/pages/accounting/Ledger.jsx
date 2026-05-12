import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import api from '../../api/axios.js';
import { Loader } from '../../components/ui/Misc.jsx';
import { formatBS, currentBSYear } from '../../utils/nepaliDate.js';

const fmt = n => Number(n || 0).toLocaleString();
const fmtSigned = n => {
  const v = Number(n || 0);
  return v >= 0 ? `NPR ${v.toLocaleString()}` : `−NPR ${Math.abs(v).toLocaleString()}`;
};

export default function Ledger() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [academicYear, setAcademicYear] = useState(currentBSYear());

  const load = async () => {
    setLoading(true);
    try {
      const params = { academicYear, page: 1, limit: 200 };
      if (fromDate) params.fromDate = fromDate;
      if (toDate)   params.toDate   = toDate;
      const { data: res } = await api.get(`/accounting/ledger/${id}`, { params });
      setData(res);
    } catch { toast.error('Failed to load ledger'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id, academicYear, fromDate, toDate]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display font-bold text-xl text-slate-900">
            {data ? `${data.account.code} — ${data.account.name}` : 'Account Ledger'}
          </h1>
          <p className="text-sm text-slate-400 capitalize">
            {data ? `${data.account.type} · Normal balance: ${data.account.normalBalance}` : ''}
          </p>
        </div>
        {data && (
          <div className="ml-auto text-right">
            <div className="text-xs text-slate-400">Closing Balance</div>
            <div className={`text-xl font-bold font-display ${data.closingBalance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
              {fmtSigned(data.closingBalance)}
              {data.closingBalance < 0 && <span className="text-xs ml-1 font-normal">(negative)</span>}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input value={academicYear} onChange={e => setAcademicYear(e.target.value)}
          className="input py-1.5 text-sm w-28 font-mono" placeholder="Year" />
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
          className="input py-1.5 text-sm" />
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
          className="input py-1.5 text-sm" />
        {(fromDate || toDate) && (
          <button onClick={() => { setFromDate(''); setToDate(''); }} className="text-xs text-slate-500 hover:text-slate-800">Clear dates</button>
        )}
      </div>

      {loading ? <Loader /> : !data || data.entries.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 text-sm">No transactions for this account in the selected period.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Journal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Narration</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Debit</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Credit</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.entries.map((e, i) => (
                  <tr key={i} className="hover:bg-slate-50/40">
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{formatBS(e.date)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-brand-600">{e.journalNumber}</td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-[200px] truncate">
                      {e.narration}
                      {e.lines?.description && <span className="text-slate-400 ml-1">— {e.lines.description}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                      {e.lines?.type === 'debit' ? fmt(e.lines.amount) : ''}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                      {e.lines?.type === 'credit' ? fmt(e.lines.amount) : ''}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono font-semibold ${e.runningBalance < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {fmtSigned(e.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                  <td className="px-4 py-3" colSpan={3}>Closing Balance</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {fmt(data.entries.reduce((s, e) => e.lines?.type === 'debit'  ? s + e.lines.amount : s, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {fmt(data.entries.reduce((s, e) => e.lines?.type === 'credit' ? s + e.lines.amount : s, 0))}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono ${data.closingBalance < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {fmtSigned(data.closingBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
