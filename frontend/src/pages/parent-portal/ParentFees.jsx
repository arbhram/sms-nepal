import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import api from '../../api/axios.js';

const fmt = (n) => `NPR ${Number(n || 0).toLocaleString()}`;

const STATUS_MAP = {
  Paid: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', badge: 'bg-green-100 text-green-700' },
  Partial: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', badge: 'bg-amber-100 text-amber-700' },
  Unpaid: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-100', badge: 'bg-rose-100 text-rose-700' },
};

export default function ParentFees() {
  const { activeChild } = useOutletContext();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeChild) return;
    setLoading(true);
    api.get(`/parent-portal/children/${activeChild._id}/fees`)
      .then(({ data }) => setFees(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeChild?._id]);

  if (!activeChild) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Users size={40} className="text-slate-300" />
        <p className="text-slate-500 font-medium">No children linked to your account</p>
      </div>
    );
  }

  const totalBilled = fees.reduce((s, f) => s + (f.totalAssignedFee || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + (f.totalPaid || 0), 0);
  const outstanding = fees.reduce((s, f) => s + (f.remainingBalance || 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Fee Records</h1>
        <p className="text-sm text-slate-500 mt-0.5">{activeChild.fullName}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Billed', value: fmt(totalBilled), cls: 'text-slate-900' },
          { label: 'Total Paid', value: fmt(totalPaid), cls: 'text-emerald-700' },
          { label: 'Outstanding', value: fmt(outstanding), cls: 'text-rose-600' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-xl font-display font-bold ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Receipt', 'Category', 'Month', 'Total', 'Paid', 'Balance', 'Status'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : fees.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No fee records found.</td></tr>
            ) : fees.map((f) => {
              const s = STATUS_MAP[f.status] || STATUS_MAP.Unpaid;
              const Icon = s.icon;
              return (
                <tr key={f._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{f.receiptNumber}</td>
                  <td className="px-4 py-3 text-slate-800">{f.category}</td>
                  <td className="px-4 py-3 text-slate-500">{f.month || '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{fmt(f.totalAssignedFee)}</td>
                  <td className="px-4 py-3 text-emerald-700">{fmt(f.totalPaid)}</td>
                  <td className="px-4 py-3 text-rose-600">{fmt(f.remainingBalance)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${s.badge}`}>
                      <Icon size={11} />
                      {f.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
