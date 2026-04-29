import { useEffect, useState } from 'react';
import {
  Users,
  GraduationCap,
  Wallet,
  UserPlus,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../../api/axios.js';
import StatCard from '../../components/ui/StatCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, Badge } from '../../components/ui/Misc.jsx';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_COLORS = { Present: '#10b981', Absent: '#f43f5e', Leave: '#f59e0b', Late: '#6366f1' };

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

  const revenueData = (data.revenueTrend || []).map((r) => ({
    month: `${MONTHS[r._id.m - 1]} '${String(r._id.y).slice(-2)}`,
    revenue: r.revenue,
  }));

  // pivot attendance trend
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

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Namaste, ${user.name?.split(' ')[0] || 'Admin'} 👋`}
        subtitle="Here's a snapshot of your institute today."
      />

      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Students"
          value={data.totals?.students || 0}
          icon={Users}
          gradient="bg-gradient-brand"
          trend="+12%"
        />
        <StatCard
          title="Total Teachers"
          value={data.totals?.teachers || 0}
          icon={GraduationCap}
          gradient="bg-gradient-violet"
        />
        <StatCard
          title="Pending Fees"
          value={`NPR ${Number(data.pendingFees || 0).toLocaleString()}`}
          icon={Wallet}
          gradient="bg-gradient-sunset"
          subtitle="Across all students"
        />
        <StatCard
          title="New Admissions"
          value={data.totals?.newAdmissions || 0}
          icon={UserPlus}
          gradient="bg-gradient-mint"
          subtitle="Last 30 days"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Revenue Trend</h3>
              <p className="text-sm text-slate-500">Last 6 months collection</p>
            </div>
            <Badge color="green">
              <TrendingUp size={12} /> NPR {Number(data.monthRevenue || 0).toLocaleString()} this month
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0c7fff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0c7fff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Area type="monotone" dataKey="revenue" stroke="#0c7fff" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="font-display font-bold text-lg text-slate-900 mb-1">Today's Attendance</h3>
          <p className="text-sm text-slate-500 mb-4">Live status</p>
          {todayAttendance.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-12">
              No attendance marked yet today.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={todayAttendance}
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {todayAttendance.map((e) => (
                    <Cell key={e.name} fill={STATUS_COLORS[e.name] || '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Attendance trend + upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display font-bold text-lg text-slate-900 mb-1">Attendance — Last 7 Days</h3>
          <p className="text-sm text-slate-500 mb-4">Daily breakdown by status</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Legend />
              <Bar dataKey="Present" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Absent" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Late" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-slate-900">Upcoming Exams</h3>
            <Calendar size={18} className="text-slate-400" />
          </div>
          <div className="space-y-3">
            {(data.upcomingExams || []).length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-8">No upcoming exams.</div>
            ) : (
              data.upcomingExams.map((ex) => (
                <div
                  key={ex._id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-white shadow-card flex flex-col items-center justify-center text-brand-600">
                    <span className="text-[10px] uppercase font-bold">
                      {MONTHS[new Date(ex.startDate).getMonth()]}
                    </span>
                    <span className="text-sm font-display font-bold -mt-0.5">
                      {new Date(ex.startDate).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">{ex.name}</div>
                    <div className="text-xs text-slate-500">{ex.class?.name}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
