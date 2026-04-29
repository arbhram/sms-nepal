import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Phone, Mail, MapPin, User, Printer } from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Badge } from '../../components/ui/Misc.jsx';

const TABS = ['Profile', 'Attendance', 'Fees', 'Exams', 'Documents'];

export default function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [tab, setTab] = useState('Profile');
  const [fees, setFees] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    api.get(`/students/${id}`).then((r) => setStudent(r.data));
    api.get('/fees', { params: { student: id } }).then((r) => setFees(r.data));
    api.get(`/attendance/student/${id}/summary`).then((r) => setAttendance(r.data));
    api.get(`/exams/student/${id}`).then((r) => setResults(r.data));
  }, [id]);

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
      {tab === 'Fees' && <FeesTab fees={fees} />}
      {tab === 'Exams' && <ExamsTab results={results} />}
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

function FeesTab({ fees }) {
  if (fees.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-slate-500">
        No fee records found for this student.
      </div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <th className="px-5 py-3">Receipt</th>
            <th className="px-5 py-3">Category</th>
            <th className="px-5 py-3">Amount</th>
            <th className="px-5 py-3">Paid</th>
            <th className="px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {fees.map((f) => (
            <tr key={f._id} className="text-sm">
              <td className="px-5 py-3 font-mono text-xs">{f.receiptNumber}</td>
              <td className="px-5 py-3">{f.category}</td>
              <td className="px-5 py-3">NPR {f.amount.toLocaleString()}</td>
              <td className="px-5 py-3">NPR {f.paidAmount.toLocaleString()}</td>
              <td className="px-5 py-3">
                <Badge color={f.status === 'Paid' ? 'green' : f.status === 'Partial' ? 'yellow' : 'red'}>
                  {f.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
