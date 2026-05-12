import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TrendingUp, TrendingDown, Scale, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader } from '../../components/ui/Misc.jsx';
import { currentBSYear } from '../../utils/nepaliDate.js';

const fmt  = n => `NPR ${Number(n || 0).toLocaleString()}`;
const fmtN = n => Number(n || 0).toLocaleString();

function AccountRow({ row, onDrilldown }) {
  const isNegative = row.balance < 0;
  return (
    <div
      className={`flex items-center justify-between px-4 py-2 border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer group ${isNegative ? 'bg-rose-50/30' : ''}`}
      onClick={() => row._id && onDrilldown(row._id)}
    >
      <div className="flex items-center gap-2">
        {row.isVirtual ? null : <span className="font-mono text-xs text-slate-400 w-12 shrink-0">{row.code}</span>}
        <span className={`text-sm ${isNegative ? 'text-rose-700 font-medium' : 'text-slate-700'} group-hover:text-brand-700 transition-colors`}>
          {row.name}
          {isNegative && <span className="ml-2 text-xs text-rose-500">(negative)</span>}
        </span>
      </div>
      <span className={`font-mono text-sm font-semibold ${isNegative ? 'text-rose-600' : 'text-slate-800'}`}>
        {isNegative ? `−NPR ${Math.abs(row.balance).toLocaleString()}` : fmt(row.balance)}
      </span>
    </div>
  );
}

function Section({ title, rows, total, totalLabel, colorClass, onDrilldown }) {
  return (
    <div className="mb-1">
      <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${colorClass}`}>{title}</div>
      {rows.length === 0
        ? <div className="px-4 py-3 text-sm text-slate-400 italic">No entries</div>
        : rows.map((r, i) => <AccountRow key={r._id || i} row={r} onDrilldown={onDrilldown} />)
      }
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 font-bold text-sm border-b border-slate-200">
        <span>{totalLabel}</span>
        <span className="font-mono">{fmt(total)}</span>
      </div>
    </div>
  );
}

export default function FinancialReports() {
  const navigate  = useNavigate();
  const [tab, setTab]  = useState('pl');
  const [pl, setPl]    = useState(null);
  const [bs, setBs]    = useState(null);
  const [loading, setLoading]       = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [academicYear, setAcademicYear] = useState(currentBSYear());
  const [fromDate, setFromDate]     = useState('');
  const [toDate,   setToDate]       = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = { academicYear };
      if (fromDate) params.fromDate = fromDate;
      if (toDate)   params.toDate   = toDate;

      const [plRes, bsRes] = await Promise.all([
        api.get('/accounting/profit-loss', { params }),
        api.get('/accounting/balance-sheet', { params: { academicYear } }),
      ]);
      setPl(plRes.data);
      setBs(bsRes.data);
    } catch { toast.error('Failed to load financial reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [academicYear, fromDate, toDate]);

  const backfill = async () => {
    setBackfilling(true);
    try {
      const { data } = await api.post('/accounting/backfill-journals');
      toast.success(`Backfill done — ${data.invoiced} invoices, ${data.payments} payments journalized${data.errors > 0 ? `, ${data.errors} errors` : ''}`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Backfill failed'); }
    finally { setBackfilling(false); }
  };

  const drilldown = (accountId) => navigate(`/accounting/ledger/${accountId}`);

  return (
    <div>
      <PageHeader
        title="Financial Reports"
        subtitle={`Academic Year ${academicYear}`}
        action={
          <button onClick={backfill} disabled={backfilling}
            className="btn-secondary flex items-center gap-1.5 text-sm disabled:opacity-50"
            title="Retroactively journal all fee records that were created before COA was seeded">
            <RefreshCw size={14} className={backfilling ? 'animate-spin' : ''} />
            {backfilling ? 'Backfilling…' : 'Backfill Fee Journals'}
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div>
          <label className="label mb-1">Academic Year</label>
          <input value={academicYear} onChange={e => setAcademicYear(e.target.value)}
            className="input py-1.5 text-sm w-28 font-mono" placeholder="2082" />
        </div>
        <div>
          <label className="label mb-1">From Date</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="input py-1.5 text-sm" />
        </div>
        <div>
          <label className="label mb-1">To Date</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="input py-1.5 text-sm" />
        </div>
        {(fromDate || toDate) && (
          <div className="flex items-end pb-1">
            <button onClick={() => { setFromDate(''); setToDate(''); }} className="text-xs text-slate-500 hover:text-slate-800">Clear dates</button>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { id: 'pl', label: 'Profit & Loss',  icon: TrendingUp },
          { id: 'bs', label: 'Balance Sheet',   icon: Scale },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : (
        <>
          {/* ── P&L ──────────────────────────────────────────────────────── */}
          {tab === 'pl' && pl && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="font-display font-bold text-slate-900">Income Statement — {academicYear}</h3>
                {(fromDate || toDate) && <p className="text-xs text-slate-400 mt-0.5">{fromDate || '…'} to {toDate || '…'}</p>}
              </div>

              <Section title="Revenue" rows={pl.revenue} total={pl.totalRevenue}
                totalLabel="Total Revenue" colorClass="text-emerald-700 bg-emerald-50" onDrilldown={drilldown} />
              <Section title="Expenses" rows={pl.expenses} total={pl.totalExpenses}
                totalLabel="Total Expenses" colorClass="text-rose-700 bg-rose-50" onDrilldown={drilldown} />

              <div className={`flex items-center justify-between px-4 py-4 font-bold text-base ${pl.netSurplus >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                <span className="flex items-center gap-2">
                  {pl.netSurplus >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {pl.netSurplus >= 0 ? 'Net Surplus' : 'Net Deficit'}
                </span>
                <span className="font-mono">{fmt(Math.abs(pl.netSurplus))}</span>
              </div>
            </div>
          )}

          {/* ── Balance Sheet ─────────────────────────────────────────────── */}
          {tab === 'bs' && bs && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-display font-bold text-slate-900">Balance Sheet — {academicYear}</h3>
                {bs.isBalanced
                  ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Balanced ✓</span>
                  : <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
                      Out of balance by {fmt(Math.abs(bs.difference))}
                    </span>
                }
              </div>

              {/* Negative cash warning */}
              {bs.assets.some(a => a.balance < 0) && (
                <div className="flex items-start gap-2 mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <strong>Negative cash balance detected.</strong> One or more asset accounts show a negative balance, which is physically impossible. This usually means an opening balance was not entered — use a <strong>Manual Journal</strong> to debit the asset and credit <strong>Opening Balance Equity (3400)</strong>.
                  </div>
                </div>
              )}

              {/* Not balanced explanation */}
              {!bs.isBalanced && (
                <div className="flex items-start gap-2 mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800">
                  <AlertTriangle size={15} className="text-rose-500 mt-0.5 shrink-0" />
                  <div>
                    Assets ({fmt(bs.totalAssets)}) ≠ Liabilities + Equity ({fmt(bs.totalLiabilitiesAndEquity)}). Difference: <strong>{fmt(Math.abs(bs.difference))}</strong>. Usually caused by transactions with only one side (debit with no credit). Check the Journals page for unbalanced entries.
                  </div>
                </div>
              )}

              <div className="mt-3 grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                <div>
                  <Section title="Assets" rows={bs.assets} total={bs.totalAssets}
                    totalLabel="Total Assets" colorClass="text-blue-700 bg-blue-50" onDrilldown={drilldown} />
                </div>
                <div>
                  <Section title="Liabilities" rows={bs.liabilities} total={bs.totalLiabilities}
                    totalLabel="Total Liabilities" colorClass="text-orange-700 bg-orange-50" onDrilldown={drilldown} />
                  <Section title="Equity" rows={bs.equity} total={bs.totalEquity}
                    totalLabel="Total Equity" colorClass="text-purple-700 bg-purple-50" onDrilldown={drilldown} />

                  {/* Current Year Earnings callout */}
                  {bs.currentYearEarnings !== 0 && (
                    <div className="px-4 py-2 text-xs text-slate-400 bg-slate-50 border-b border-slate-100">
                      Equity includes <strong>Current Year {bs.currentYearEarnings >= 0 ? 'Surplus' : 'Deficit'}</strong>: Revenue {fmt(bs.currentYearRevenue)} − Expenses {fmt(bs.currentYearExpenses)} = <span className={bs.currentYearEarnings >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{fmt(bs.currentYearEarnings)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between px-4 py-3 bg-slate-100 font-bold text-sm border-t border-slate-200">
                    <span>Total Liabilities + Equity</span>
                    <span className="font-mono">{fmt(bs.totalLiabilitiesAndEquity)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
