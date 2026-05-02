import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Users, BookOpen, Award, Calendar,
  ArrowUpRight, ChevronRight, ClipboardList,
} from 'lucide-react';
import api from '../../api/axios.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TeacherDashboard() {
  const { profile } = useOutletContext();
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    api.get('/teacher-portal/students').then(({ data }) => setStudents(data)).catch(() => {});
    api.get('/teacher-portal/exams').then(({ data }) => setExams(data)).catch(() => {});
  }, []);

  const upcomingExams = exams.filter((e) => e.status === 'upcoming');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    {
      title: 'My Students',
      value: students.length,
      icon: Users,
      from: 'from-blue-500', to: 'to-indigo-600',
      shadow: 'shadow-blue-200',
      trend: 'Enrolled this year',
      up: true,
    },
    {
      title: 'Assigned Classes',
      value: profile?.assignedClasses?.length ?? 0,
      icon: BookOpen,
      from: 'from-violet-500', to: 'to-purple-600',
      shadow: 'shadow-violet-200',
      trend: 'Active classes',
      up: true,
    },
    {
      title: 'Upcoming Exams',
      value: upcomingExams.length,
      icon: Award,
      from: 'from-amber-500', to: 'to-orange-500',
      shadow: 'shadow-amber-200',
      trend: 'Scheduled ahead',
      up: true,
    },
    {
      title: 'Total Exams',
      value: exams.length,
      icon: ClipboardList,
      from: 'from-emerald-500', to: 'to-teal-600',
      shadow: 'shadow-emerald-200',
      trend: 'All time',
      up: true,
    },
  ];

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            {greeting}, {profile?.fullName?.split(' ')[0] || 'Teacher'}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {profile?.subject && <span className="font-medium text-slate-600">{profile.subject}</span>}
            {profile?.subject && ' · '}
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
        {stats.map(({ title, value, icon: Icon, from, to, shadow, trend }) => (
          <div key={title} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center shadow-lg ${shadow}`}>
                <Icon size={20} className="text-white" />
              </div>
              <span className="flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">
                <ArrowUpRight size={12} />
                {trend}
              </span>
            </div>
            <div className="text-2xl font-display font-bold text-slate-900 tracking-tight">{value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{title}</div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Assigned Classes */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-slate-900">Assigned Classes</h3>
              <p className="text-sm text-slate-500 mt-0.5">{profile?.assignedClasses?.length ?? 0} active</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <BookOpen size={16} className="text-violet-600" />
            </div>
          </div>

          {!profile?.assignedClasses?.length ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <BookOpen size={32} className="text-slate-200" />
              <p className="text-sm text-slate-400">No classes assigned yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {profile.assignedClasses.map((c, i) => (
                <div key={c._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition group">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900">{c.name}</div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Exams */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-slate-900">Upcoming Exams</h3>
              <p className="text-sm text-slate-500 mt-0.5">Scheduled ahead</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Calendar size={16} className="text-amber-600" />
            </div>
          </div>

          {upcomingExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Award size={32} className="text-slate-200" />
              <p className="text-sm text-slate-400">No upcoming exams</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingExams.slice(0, 6).map((e) => {
                const d = new Date(e.startDate);
                return (
                  <div key={e._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition group">
                    <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-slate-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">{MONTHS[d.getMonth()]}</span>
                      <span className="text-sm font-display font-bold text-slate-900 -mt-0.5">{d.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-900 truncate">{e.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{e.class?.name || 'All classes'}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                      Upcoming
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Students */}
      {students.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-slate-900">My Students</h3>
              <p className="text-sm text-slate-500 mt-0.5">{students.length} enrolled</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users size={16} className="text-blue-600" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {students.slice(0, 8).map((s) => (
              <div key={s._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {s.fullName?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">{s.fullName}</div>
                  <div className="text-xs text-slate-400">Roll {s.rollNumber || '—'}</div>
                </div>
              </div>
            ))}
          </div>
          {students.length > 8 && (
            <p className="text-xs text-slate-400 text-center mt-3">+{students.length - 8} more students</p>
          )}
        </div>
      )}
    </div>
  );
}
