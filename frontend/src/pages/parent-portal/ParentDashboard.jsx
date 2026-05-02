import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Wallet, CalendarCheck, Award, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Clock, BookOpen, Users } from 'lucide-react';
import api from '../../api/axios.js';

const fmt = (n) => `NPR ${Number(n || 0).toLocaleString()}`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ParentDashboard() {
  const { activeChild } = useOutletContext();
  const [fees, setFees] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeChild) return;
    const id = activeChild._id;
    setLoading(true);
    Promise.all([
      api.get(`/parent-portal/children/${id}/fees`),
      api.get(`/parent-portal/children/${id}/attendance`),
      api.get(`/parent-portal/children/${id}/exams`),
    ]).then(([f, a, e]) => {
      setFees(f.data);
      setAttendance(a.data);
      setExams(e.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [activeChild?._id]);

  if (!activeChild) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Users size={40} className="text-slate-300" />
        <p className="text-slate-500 font-medium">No children linked to your account</p>
        <p className="text-sm text-slate-400">Please contact the school admin to link your children.</p>
      </div>
    );
  }

  const unpaidFees = fees.filter((f) => f.status !== 'Paid');
  const pendingAmount = unpaidFees.reduce((s, f) => s + (f.remainingBalance || 0), 0);
  const upcomingExams = exams.filter((e) => new Date(e.startDate) > new Date());

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    {
      title: 'Attendance',
      value: attendance ? `${attendance.percentage}%` : '—',
      icon: CalendarCheck,
      from: 'from-emerald-500', to: 'to-teal-600', shadow: 'shadow-emerald-200',
      trend: `${attendance?.summary?.Present ?? 0} days present`, up: true,
    },
    {
      title: 'Pending Fees',
      value: fmt(pendingAmount),
      icon: Wallet,
      from: 'from-rose-500', to: 'to-pink-600', shadow: 'shadow-rose-200',
      trend: `${unpaidFees.length} unpaid`, up: false,
    },
    {
      title: 'Upcoming Exams',
      value: upcomingExams.length,
      icon: Award,
      from: 'from-indigo-500', to: 'to-purple-600', shadow: 'shadow-indigo-200',
      trend: 'Scheduled ahead', up: true,
    },
    {
      title: 'Days Absent',
      value: loading ? '—' : (attendance?.summary?.Absent ?? '—'),
      icon: TrendingUp,
      from: 'from-amber-500', to: 'to-orange-500', shadow: 'shadow-amber-200',
      trend: 'This period', up: false,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">
          {greeting}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Viewing <span className="font-semibold text-slate-700">{activeChild.fullName}</span>
          {activeChild.class?.name && <> · <span className="text-slate-600">{activeChild.class.name}</span></>}
          {activeChild.section && ` — Section ${activeChild.section}`}
          {activeChild.rollNumber && ` · Roll No. ${activeChild.rollNumber}`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map(({ title, value, icon: Icon, from, to, shadow, trend, up }) => (
          <div key={title} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center shadow-lg ${shadow}`}>
                <Icon size={20} className="text-white" />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-lg ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {trend}
              </span>
            </div>
            <div className="text-2xl font-display font-bold text-slate-900 tracking-tight">{value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{title}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Upcoming exams */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-slate-900">Upcoming Exams</h3>
              <p className="text-sm text-slate-500 mt-0.5">Scheduled ahead</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Award size={16} className="text-indigo-600" />
            </div>
          </div>
          {upcomingExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <BookOpen size={32} className="text-slate-200" />
              <p className="text-sm text-slate-400">No upcoming exams</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingExams.slice(0, 5).map((e) => {
                const d = new Date(e.startDate);
                return (
                  <div key={e._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-slate-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">{MONTHS[d.getMonth()]}</span>
                      <span className="text-sm font-display font-bold text-slate-900 -mt-0.5">{d.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-900 truncate">{e.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{e.class?.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fee overview */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-slate-900">Fee Records</h3>
              <p className="text-sm text-slate-500 mt-0.5">Recent billing</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
              <Wallet size={16} className="text-rose-600" />
            </div>
          </div>
          {fees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Wallet size={32} className="text-slate-200" />
              <p className="text-sm text-slate-400">No fee records yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fees.slice(0, 6).map((f) => (
                <div key={f._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${f.status === 'Paid' ? 'bg-emerald-100' : f.status === 'Partial' ? 'bg-amber-100' : 'bg-rose-100'}`}>
                    {f.status === 'Paid' ? <CheckCircle2 size={16} className="text-emerald-600" />
                      : f.status === 'Partial' ? <Clock size={16} className="text-amber-600" />
                      : <XCircle size={16} className="text-rose-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">{f.category}</div>
                    <div className="text-xs text-slate-400">{f.month || '—'} · {f.receiptNumber}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-sm font-semibold text-slate-800">{fmt(f.totalAssignedFee)}</div>
                    <span className={`text-xs font-semibold ${f.status === 'Paid' ? 'text-emerald-600' : f.status === 'Partial' ? 'text-amber-600' : 'text-rose-600'}`}>
                      {f.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attendance summary */}
      {attendance && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-slate-900">Attendance Summary</h3>
              <p className="text-sm text-slate-500 mt-0.5">{activeChild.fullName} — this academic period</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CalendarCheck size={16} className="text-emerald-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Present', value: attendance.summary?.Present ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Absent', value: attendance.summary?.Absent ?? 0, color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Leave', value: attendance.summary?.Leave ?? 0, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Late', value: attendance.summary?.Late ?? 0, color: 'text-slate-700', bg: 'bg-slate-50' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                <div className={`text-3xl font-display font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Attendance rate</span>
              <span className="font-semibold text-slate-700">{attendance.percentage}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
                style={{ width: `${attendance.percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
