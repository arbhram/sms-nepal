import { useEffect, useState } from 'react';
import api from '../../api/axios.js';

export default function TeacherStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/teacher-portal/students').then(({ data }) => setStudents(data)).finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-display font-bold text-slate-900">My Students</h1>
        <input
          className="input max-w-xs"
          placeholder="Search name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              {['Student', 'ID', 'Class', 'Section', 'Roll No.', 'Phone'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No students found.</td></tr>
            ) : filtered.map((s) => (
              <tr key={s._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      {s.fullName[0]}
                    </div>
                    <span className="font-medium text-slate-800">{s.fullName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.studentId}</td>
                <td className="px-4 py-3 text-slate-600">{s.class?.name}</td>
                <td className="px-4 py-3 text-slate-600">{s.section}</td>
                <td className="px-4 py-3 text-slate-600">{s.rollNumber || '—'}</td>
                <td className="px-4 py-3 text-slate-400">{s.phone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
