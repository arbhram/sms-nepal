import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import { formatBS } from '../../utils/nepaliDate.js';

export default function StudentFees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student-portal/fees').then(({ data }) => setFees(data)).finally(() => setLoading(false));
  }, []);

  const total = fees.reduce((s, f) => s + f.amount, 0);
  const paid = fees.reduce((s, f) => s + (f.paidAmount || 0), 0);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-display font-bold text-slate-900">My Fees</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Billed', value: `NPR ${total.toLocaleString()}`, cls: 'text-slate-900' },
          { label: 'Total Paid', value: `NPR ${paid.toLocaleString()}`, cls: 'text-green-700' },
          { label: 'Outstanding', value: `NPR ${(total - paid).toLocaleString()}`, cls: 'text-rose-600' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white rounded-xl border p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-xl font-display font-bold ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              {['Receipt', 'Category', 'Month', 'Amount', 'Paid', 'Status', 'Date'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : fees.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No fee records found.</td></tr>
            ) : fees.map((f) => (
              <tr key={f._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{f.receiptNumber}</td>
                <td className="px-4 py-3 text-slate-800">{f.category}</td>
                <td className="px-4 py-3 text-slate-600">{f.month}</td>
                <td className="px-4 py-3 font-medium">NPR {f.amount?.toLocaleString()}</td>
                <td className="px-4 py-3 text-green-700">NPR {f.paidAmount?.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${f.paidAmount >= f.amount ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                    {f.paidAmount >= f.amount ? 'Paid' : 'Unpaid'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{f.paidDate ? formatBS(f.paidDate) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
