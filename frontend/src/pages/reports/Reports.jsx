import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Users, Wallet, CalendarCheck, ClipboardList } from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import { Loader } from '../../components/ui/Misc.jsx';
import { formatBS } from '../../utils/nepaliDate.js';

const COLORS = ['#0c7fff', '#10b981', '#f97316', '#8b5cf6', '#f43f5e', '#f59e0b'];

export default function Reports() {
  const [dash, setDash] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then((r) => setDash(r.data));
    api.get('/fees/summary').then((r) => setFeeSummary(r.data));
  }, []);

  if (!dash || !feeSummary) return <Loader />;

  const categoryData = (feeSummary.byCategory || []).map((c) => ({
    name: c._id, value: c.totalPaid, count: c.count,
  }));

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Key metrics across admissions, fees, and attendance" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard title="Active Students" value={dash.totals?.students || 0} icon={Users} gradient="bg-gradient-brand" />
        <StatCard title="Fees Collected" value={`NPR ${feeSummary.totalCollected.toLocaleString()}`} icon={Wallet} gradient="bg-gradient-mint" />
        <StatCard title="Pending Dues" value={`NPR ${feeSummary.totalPending.toLocaleString()}`} icon={Wallet} gradient="bg-gradient-sunset" />
        <StatCard title="New Admissions" value={dash.totals?.newAdmissions || 0} icon={CalendarCheck} gradient="bg-gradient-violet" subtitle="Last 30 days" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="font-display font-bold text-lg mb-4">Fees by Category</h3>
          {categoryData.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-12">No fee data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" outerRadius={100} label={(e) => e.name}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `NPR ${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-display font-bold text-lg mb-4">Revenue by Category (NPR)</h3>
          {categoryData.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-12">No data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} formatter={(v) => `NPR ${v.toLocaleString()}`} />
                <Bar dataKey="value" fill="#0c7fff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-6 mt-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand text-white flex items-center justify-center">
            <ClipboardList size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Upcoming Exams</h3>
            <p className="text-xs text-slate-500">Scheduled in next 30 days</p>
          </div>
        </div>
        {(dash.upcomingExams || []).length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-6">No upcoming exams.</div>
        ) : (
          <div className="space-y-2">
            {dash.upcomingExams.map((ex) => (
              <div key={ex._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <div className="font-semibold text-slate-900">{ex.name}</div>
                  <div className="text-xs text-slate-500">{ex.class?.name}</div>
                </div>
                <div className="text-sm text-slate-600">
                  {formatBS(ex.startDate)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
