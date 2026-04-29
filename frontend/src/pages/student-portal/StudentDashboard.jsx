import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Wallet, CalendarCheck, Award, User } from 'lucide-react';
import api from '../../api/axios.js';

export default function StudentDashboard() {
  const { profile } = useOutletContext();
  const [fees, setFees] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    api.get('/student-portal/fees').then(({ data }) => setFees(data)).catch(() => {});
    api.get('/student-portal/attendance').then(({ data }) => setAttendance(data)).catch(() => {});
    api.get('/student-portal/exams').then(({ data }) => setExams(data)).catch(() => {});
  }, []);

  const unpaidFees = fees.filter((f) => f.paidAmount < f.amount).length;
  const upcomingExams = exams.filter((e) => e.status === 'upcoming').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Welcome, {profile?.fullName?.split(' ')[0]} 👋</h1>
        <p className="text-slate-500 text-sm mt-1">{profile?.class?.name} — Section {profile?.section} · Roll No. {profile?.rollNumber || 'N/A'}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Attendance', value: attendance ? `${attendance.percentage}%` : '—', icon: CalendarCheck, color: 'green' },
          { label: 'Unpaid Fees', value: unpaidFees, icon: Wallet, color: 'rose' },
          { label: 'Upcoming Exams', value: upcomingExams, icon: Award, color: 'blue' },
          { label: 'Days Present', value: attendance?.summary?.Present ?? '—', icon: User, color: 'purple' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border p-4">
            <div className={`w-9 h-9 rounded-lg bg-${color}-50 flex items-center justify-center mb-3`}>
              <Icon size={18} className={`text-${color}-600`} />
            </div>
            <p className="text-2xl font-display font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-display font-semibold text-slate-900 mb-4">Recent Fees</h3>
          {fees.length === 0 ? <p className="text-slate-400 text-sm">No fee records yet.</p> : (
            <div className="space-y-2">
              {fees.slice(0, 5).map((f) => (
                <div key={f._id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{f.category} — {f.month}</p>
                    <p className="text-xs text-slate-400">NPR {f.amount?.toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${f.paidAmount >= f.amount ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                    {f.paidAmount >= f.amount ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-display font-semibold text-slate-900 mb-4">Upcoming Exams</h3>
          {exams.filter((e) => e.status === 'upcoming').length === 0 ? (
            <p className="text-slate-400 text-sm">No upcoming exams.</p>
          ) : (
            <div className="space-y-2">
              {exams.filter((e) => e.status === 'upcoming').slice(0, 5).map((e) => (
                <div key={e._id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{e.name}</p>
                    <p className="text-xs text-slate-400">{new Date(e.startDate).toLocaleDateString()}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Upcoming</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
