import { useEffect, useState } from 'react';
import {
  Users, GraduationCap, Wallet, TrendingUp,
  Calendar, BookOpen, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../api/axios.js';
import { Loader } from '../../components/ui/Misc.jsx';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_COLORS = { Present: '#10b981', Absent: '#f43f5e', Leave: '#f59e0b', Late: '#6366f1' };
const fmt = (n) => `NPR ${Number(n || 0).toLocaleString()}`;

const STAT_CARDS = (d) => [
  {
    title: 'Total Students',
    value: d.totals?.students || 0,
    icon: Users,
    from: 'from-blue-500', to: 'to-indigo-600',
    shadow: 'shadow-blue-200',
    trend: d.totals?.newAdmissions > 0 ? `+${d.totals.newAdmissions} this month` : null,
    up: true,
  },
  {
    title: 'Total Teachers',
    value: d.totals?.teachers || 0,
    icon: GraduationCap,
    from: 'from-violet-500', to: 'to-purple-600',
    shadow: 'shadow-violet-200',
    trend: `${d.totals?.classes || 0} classes`,
    up: true,
  },
  {
    title: 'Pending Fees',
    value: fmt(d.pendingFees),
    icon: Wallet,
    from: 'from-rose-500', to: 'to-pink-600',
    shadow: 'shadow-rose-200',
    trend: 'Outstanding balance',
    up: false,
  },
  {
    title: 'This Month Revenue',
    value: fmt(d.monthRevenue),
    icon: TrendingUp,
    from: 'from-emerald-500', to: 'to-teal-600',
    shadow: 'shadow-emerald-200',
    trend: 'Collected payments',
    up: true,
  },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!data) return null;

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const revenueData = (data.revenueTrend || []).map((r) => ({
    month: `${MONTHS[r._id.m - 1]} '${String(r._id.y).slice(-2)}`,
    revenue: r.revenue,
  }));

  const attendanceByDay = {};
  (data.attendanceTrend || []).forEach((r) => {
    const d = r._id.date;
    attendanceByDay[d] = attendanceByDay[d] || { date: d.slice(5) };
    attendanceByDay[d][r._id.status] = r.count;
  });
  const attendanceData = Object.values(attendanceByDay);

  const todayAttendance = (data.todayAttendance || []).map((a) => ({
    name: a._id,
    value: a.count,
  }));

  const totalToday = todayAttendance.reduce((s, a) => s + a.value, 0);
  const presentToday = todayAttendance.find((a) => a.name === 'Present')?.value || 0;
  const attendancePct = totalToday ? Math.round((presentToday / totalToday) * 100) : 0;

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            {greeting}, {user.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {new Date().toLocaleDateString('en-NP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          System online
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {STAT_CARDS(data).map(({ title, value, icon: Icon, from, to, shadow, trend, up }) => (
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

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Revenue trend */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm lg:col-span-2">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-slate-900">Revenue Trend</h3>
              <p className="text-sm text-slate-500 mt-0.5">Last 6 months collection</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-emerald-600">{fmt(data.monthRevenue)}</div>
              <div className="text-xs text-slate-400">this month</div>
            </div>
          </div>
          {revenueData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-slate-400 text-sm">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  formatter={(v) => [`NPR ${Number(v).toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Today's attendance donut */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="font-display font-bold text-slate-900 mb-0.5">Today's Attendance</h3>
          <p className="text-sm text-slate-500 mb-4">Live status</p>

          {todayAttendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[180px] gap-2">
              <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center text-slate-300 text-sm font-bold">—</div>
              <p className="text-sm text-slate-400">Not marked yet</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={todayAttendance} innerRadius={52} outerRadius={75} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                      {todayAttendance.map((e) => (
                        <Cell key={e.name} fill={STATUS_COLORS[e.name] || '#cbd5e1'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-2xl font-display font-bold text-slate-900">{attendancePct}%</div>
                  <div className="text-xs text-slate-400">Present</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {todayAttendance.map((a) => (
                  <div key={a.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[a.name] || '#cbd5e1' }} />
                    <span className="text-slate-600">{a.name}</span>
                    <span className="font-semibold text-slate-900 ml-auto">{a.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Attendance bar chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm lg:col-span-2">
          <h3 className="font-display font-bold text-slate-900 mb-0.5">Attendance — Last 7 Days</h3>
          <p className="text-sm text-slate-500 mb-5">Daily breakdown by status</p>
          {attendanceData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-slate-400 text-sm">No attendance data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceData} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Late" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Upcoming exams */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-slate-900">Upcoming Exams</h3>
              <p className="text-sm text-slate-500 mt-0.5">Scheduled ahead</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Calendar size={16} className="text-indigo-600" />
            </div>
          </div>

          {(data.upcomingExams || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <BookOpen size={32} className="text-slate-200" />
              <p className="text-sm text-slate-400">No upcoming exams</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.upcomingExams.map((ex) => {
                const d = new Date(ex.startDate);
                return (
                  <div key={ex._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition group">
                    <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-slate-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">{MONTHS[d.getMonth()]}</span>
                      <span className="text-sm font-display font-bold text-slate-900 -mt-0.5">{d.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-900 truncate">{ex.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{ex.class?.name || 'All classes'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
