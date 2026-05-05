import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import { formatBS } from '../../utils/nepaliDate.js';

const STATUS_COLOR = { upcoming: 'bg-blue-100 text-blue-700', ongoing: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700' };

export default function TeacherExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher-portal/exams').then(({ data }) => setExams(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-display font-bold text-slate-900">Exams</h1>

      {loading ? <p className="text-slate-400">Loading...</p> : exams.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-slate-400">No exams found for your classes.</div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <div key={exam._id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display font-semibold text-slate-900">{exam.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {exam.class?.name} · {formatBS(exam.startDate)}
                    {exam.endDate ? ` — ${formatBS(exam.endDate)}` : ''}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[exam.status]}`}>{exam.status}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {exam.subjects?.map((s) => (
                  <span key={s.name} className="px-2 py-1 bg-slate-50 border rounded-lg text-xs text-slate-600">
                    {s.name} · {s.fullMarks} marks
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
