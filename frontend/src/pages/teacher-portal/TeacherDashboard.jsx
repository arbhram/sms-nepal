import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Award, BookOpen } from 'lucide-react';
import api from '../../api/axios.js';

export default function TeacherDashboard() {
  const { profile } = useOutletContext();
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    api.get('/teacher-portal/students').then(({ data }) => setStudents(data)).catch(() => {});
    api.get('/teacher-portal/exams').then(({ data }) => setExams(data)).catch(() => {});
  }, []);

  const upcomingExams = exams.filter((e) => e.status === 'upcoming');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Welcome, {profile?.fullName?.split(' ')[0]} 👋</h1>
        <p className="text-slate-500 text-sm mt-1">{profile?.subject} · {profile?.qualification || 'Teacher'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: 'My Students', value: students.length, icon: Users, color: 'blue' },
          { label: 'Assigned Classes', value: profile?.assignedClasses?.length ?? 0, icon: BookOpen, color: 'purple' },
          { label: 'Upcoming Exams', value: upcomingExams.length, icon: Award, color: 'green' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border p-5">
            <div className={`w-9 h-9 rounded-lg bg-${color}-50 flex items-center justify-center mb-3`}>
              <Icon size={18} className={`text-${color}-600`} />
            </div>
            <p className="text-3xl font-display font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-display font-semibold text-slate-900 mb-4">Assigned Classes</h3>
          {!profile?.assignedClasses?.length ? (
            <p className="text-slate-400 text-sm">No classes assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {profile.assignedClasses.map((c) => (
                <div key={c._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">C</div>
                  <span className="font-medium text-slate-800 text-sm">{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-display font-semibold text-slate-900 mb-4">Upcoming Exams</h3>
          {upcomingExams.length === 0 ? (
            <p className="text-slate-400 text-sm">No upcoming exams.</p>
          ) : (
            <div className="space-y-2">
              {upcomingExams.slice(0, 5).map((e) => (
                <div key={e._id} className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{e.name}</p>
                    <p className="text-xs text-slate-400">{e.class?.name} · {new Date(e.startDate).toLocaleDateString()}</p>
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
