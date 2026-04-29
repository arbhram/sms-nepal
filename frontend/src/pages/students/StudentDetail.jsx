import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Phone, Mail, MapPin, Printer, CreditCard, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Badge } from '../../components/ui/Misc.jsx';

const METHODS = ['Cash', 'Bank Transfer', 'eSewa', 'Khalti', 'FonePay'];
const fmt = (n) => `NPR ${Number(n || 0).toLocaleString()}`;

const TABS = ['Profile', 'Attendance', 'Fees', 'Exams', 'Documents'];

export default function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [tab, setTab] = useState('Profile');
  const [fees, setFees] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [results, setResults] = useState([]);
  const [payOpen, setPayOpen] = useState(null);
  const [payment, setPayment] = useState({ amount: '', paymentMethod: 'Cash', paidDate: '', remarks: '' });
  const [payLoading, setPayLoading] = useState(false);

  const loadFees = () =>
    api.get('/fees', { params: { student: id } }).then((r) => setFees(r.data.fees || [])).catch(() => {});

  useEffect(() => {
    api.get(`/students/${id}`).then((r) => setStudent(r.data));
    loadFees();
    api.get(`/attendance/student/${id}/summary`).then((r) => setAttendance(r.data));
    api.get(`/exams/student/${id}`).then((r) => setResults(r.data));
  }, [id]);

  const openPay = (fee) => {
    setPayOpen(fee);
    setPayment({ amount: String(fee.remainingBalance || ''), paymentMethod: 'Cash', paidDate: '', remarks: '' });
  };

  const recordPayment = async (e) => {
    e.preventDefault();
    const amt = Number(payment.amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    setPayLoading(true);
    try {
      await api.post(`/fees/${payOpen._id}/payment`, {
        amount: amt,
        paymentMethod: payment.paymentMethod,
        paidDate: payment.paidDate || undefined,
        remarks: payment.remarks || undefined,
      });
      toast.success('Payment recorded');
      setPayOpen(null);
      loadFees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPayLoading(false);
    }
  };

  if (!student) return <Loader />;

  return (
    <div>
      <PageHeader
        title={student.fullName}
        subtitle={`${student.studentId} · ${student.class?.name || ''} ${student.section || ''}`}
        action={
          <div className="flex gap-2">
            <Link to="/students" className="btn-secondary">
              <ArrowLeft size={16} /> Back
            </Link>
            <button onClick={() => window.print()} className="btn-secondary">
              <Printer size={16} /> Print
            </button>
            <Link to={`/students/${id}/edit`} className="btn-primary">
              <Edit2 size={16} /> Edit
            </Link>
          </div>
        }
      />

      {/* Header card */}
      <div className="card p-6 mb-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-brand opacity-[0.03]" />
        <div className="relative flex flex-col md:flex-row gap-6">
          <div className="w-28 h-28 rounded-2xl bg-gradient-brand flex items-center justify-center text-white text-4xl font-display font-bold shadow-card">
            {student.fullName?.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-900">{student.fullName}</h2>
                <div className="text-sm text-slate-500 mt-1">
                  {student.gender} · Born {new Date(student.dateOfBirth).toLocaleDateString()}
                </div>
              </div>
              <Badge color={student.status === 'active' ? 'green' : 'red'}>{student.status}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <InfoItem icon={Phone} label="Phone" value={student.phone || '—'} />
              <InfoItem icon={Mail} label="Email" value={student.email || '—'} />
              <InfoItem icon={MapPin} label="Address" value={student.address || '—'} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === t ? 'bg-white shadow-card text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profile' && <Profile s={student} />}
      {tab === 'Attendance' && <AttendanceTab data={attendance} />}
      {tab === 'Fees' && <FeesTab fees={fees} onPay={openPay} />}
      {tab === 'Exams' && <ExamsTab results={results} />}

      {payOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl flex flex-col">
              <div className="flex items-center justify-between px-7 py-5 border-b">
                <h3 className="font-display font-bold text-xl">Record Payment</h3>
                <button onClick={() => setPayOpen(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={20} /></button>
              </div>
              <div className="px-7 py-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Assigned', value: fmt(payOpen.totalAssignedFee) },
                    { label: 'Total Paid', value: fmt(payOpen.totalPaid), color: 'text-emerald-600' },
                    { label: 'Remaining', value: fmt(payOpen.remainingBalance), color: 'text-rose-600' },
                  ].map(({ label, value, color = 'text-slate-900' }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                      <div className="text-xs text-slate-400 mb-1">{label}</div>
                      <div className={`font-display font-bold text-sm ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>
                <form onSubmit={recordPayment} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Amount (NPR) *</label>
                      <input required type="number" min="1" value={payment.amount}
                        onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                        className="input" placeholder={`Max ${fmt(payOpen.remainingBalance)}`} />
                    </div>
                    <div>
                      <label className="label">Payment Method</label>
                      <select value={payment.paymentMethod}
                        onChange={(e) => setPayment({ ...payment, paymentMethod: e.target.value })} className="input">
                        {METHODS.map((m) => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Date</label>
                      <input type="date" value={payment.paidDate}
                        onChange={(e) => setPayment({ ...payment, paidDate: e.target.value })} className="input" />
                    </div>
                    <div>
                      <label className="label">Remarks (optional)</label>
                      <input value={payment.remarks}
                        onChange={(e) => setPayment({ ...payment, remarks: e.target.value })}
                        className="input" placeholder="e.g. partial payment" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => setPayOpen(null)} className="btn-secondary">Cancel</button>
                    <button type="submit" disabled={payLoading} className="btn-primary">
                      <CreditCard size={14} /> {payLoading ? 'Saving...' : 'Record Payment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {tab === 'Documents' && (
        <div className="card p-8 text-center text-sm text-slate-500">
          Document upload coming soon.
        </div>
      )}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={16} className="text-slate-400 mt-0.5" />
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-sm text-slate-700">{value}</div>
      </div>
    </div>
  );
}

function Profile({ s }) {
  const rows = [
    ['Guardian', `${s.guardianName} (${s.guardianPhone})`],
    ['Guardian Occupation', s.guardianOccupation || '—'],
    ['Blood Group', s.bloodGroup || '—'],
    ['Nationality', s.nationality || '—'],
    ['Citizenship No.', s.citizenshipNumber || '—'],
    ['Municipality', s.municipality || '—'],
    ['Ward Number', s.wardNumber || '—'],
    ['Province', s.province || '—'],
    ['Roll Number', s.rollNumber || '—'],
    ['Admission Date', new Date(s.admissionDate).toLocaleDateString()],
    ['Previous School', s.previousSchool || '—'],
  ];
  return (
    <div className="card p-6">
      <h3 className="font-display font-bold text-slate-900 mb-4">Complete Profile</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-2 border-b border-slate-100 text-sm">
            <span className="text-slate-500">{k}</span>
            <span className="font-semibold text-slate-800 text-right">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttendanceTab({ data }) {
  if (!data) return <Loader />;
  const { summary, total, percentage } = data;
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="card p-5 bg-gradient-brand text-white">
        <div className="text-white/70 text-sm">Attendance</div>
        <div className="text-4xl font-display font-bold mt-1">{percentage}%</div>
        <div className="text-white/70 text-xs mt-1">This month</div>
      </div>
      {[
        ['Present', summary.Present || 0, 'text-emerald-600'],
        ['Absent', summary.Absent || 0, 'text-rose-600'],
        ['Leave', summary.Leave || 0, 'text-amber-600'],
      ].map(([k, v, c]) => (
        <div key={k} className="card p-5">
          <div className="text-sm text-slate-500">{k}</div>
          <div className={`text-4xl font-display font-bold mt-1 ${c}`}>{v}</div>
          <div className="text-xs text-slate-400 mt-1">Out of {total || 0} days</div>
        </div>
      ))}
    </div>
  );
}

function FeesTab({ fees, onPay }) {
  if (fees.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-slate-500">
        No fee records found for this student.
      </div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3 text-right">Assigned</th>
              <th className="px-5 py-3 text-right">Paid</th>
              <th className="px-5 py-3 text-right">Remaining</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fees.map((f) => (
              <tr key={f._id} className="text-sm hover:bg-slate-50/70">
                <td className="px-5 py-3">
                  <div className="font-medium">{f.category}</div>
                  {f.month && <div className="text-xs text-slate-400">{f.month}</div>}
                  <div className="text-xs text-slate-400 font-mono">{f.receiptNumber}</div>
                </td>
                <td className="px-5 py-3 text-right font-mono text-slate-700">{fmt(f.totalAssignedFee)}</td>
                <td className="px-5 py-3 text-right font-mono text-emerald-700">{fmt(f.totalPaid)}</td>
                <td className={`px-5 py-3 text-right font-mono font-semibold ${f.remainingBalance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {fmt(f.remainingBalance)}
                </td>
                <td className="px-5 py-3">
                  <Badge color={f.status === 'Paid' ? 'green' : f.status === 'Partial' ? 'yellow' : 'red'}>
                    {f.status}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-right">
                  {f.status !== 'Paid' && (
                    <button onClick={() => onPay(f)} className="btn-primary text-xs py-1.5 px-3">
                      <CreditCard size={13} /> Pay
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExamsTab({ results }) {
  if (results.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-slate-500">
        No exam results available yet.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {results.map((r) => (
        <div key={r._id} className="card p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="font-display font-bold text-slate-900">{r.exam?.name}</div>
              <div className="text-xs text-slate-500">
                {r.exam && new Date(r.exam.startDate).toLocaleDateString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-display font-bold text-brand-600">{r.percentage}%</div>
              <div className="text-xs text-slate-500">Grade {r.grade}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {r.marks.map((m, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-50 text-sm">
                <div className="text-xs text-slate-500">{m.subject}</div>
                <div className="font-semibold text-slate-800">
                  {m.obtained}/{m.fullMarks}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
