import { useEffect, useState } from 'react';
import api from '../../api/axios.js';

const STATUS_COLOR = { upcoming: 'bg-blue-100 text-blue-700', ongoing: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700' };

export default function StudentExams() {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/student-portal/exams'),
      api.get('/student-portal/results'),
    ]).then(([e, r]) => { setExams(e.data); setResults(r.data); }).finally(() => setLoading(false));
  }, []);

  const resultMap = Object.fromEntries(results.map((r) => [String(r.exam?._id), r]));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-display font-bold text-slate-900">Exams & Results</h1>

      {loading ? <p className="text-slate-400">Loading...</p> : exams.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-slate-400">No exams scheduled yet.</div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => {
            const result = resultMap[String(exam._id)];
            return (
              <div key={exam._id} className="bg-white rounded-xl border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-semibold text-slate-900">{exam.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(exam.startDate).toLocaleDateString()} {exam.endDate ? `— ${new Date(exam.endDate).toLocaleDateString()}` : ''}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[exam.status]}`}>{exam.status}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {exam.subjects?.map((s) => (
                    <span key={s.name} className="px-2 py-1 bg-slate-50 border rounded-lg text-xs text-slate-600">{s.name} ({s.fullMarks})</span>
                  ))}
                </div>

                {result ? (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Your Result</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div><span className="text-slate-500">Score: </span><span className="font-semibold text-slate-900">{result.totalObtained}/{result.totalFull}</span></div>
                      <div><span className="text-slate-500">Percentage: </span><span className="font-semibold text-slate-900">{result.percentage?.toFixed(1)}%</span></div>
                      <div><span className="text-slate-500">Grade: </span><span className="font-semibold text-slate-900">{result.grade || '—'}</span></div>
                      {result.rank && <div><span className="text-slate-500">Rank: </span><span className="font-semibold text-slate-900">#{result.rank}</span></div>}
                    </div>
                    {result.marks?.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 lg:grid-cols-3 gap-2">
                        {result.marks.map((m) => (
                          <div key={m.subject} className="bg-slate-50 rounded-lg p-2 text-xs">
                            <p className="font-medium text-slate-700">{m.subject}</p>
                            <p className="text-slate-500">{m.obtained}/{m.fullMarks} {m.grade && `· ${m.grade}`}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : exam.status === 'completed' ? (
                  <p className="text-xs text-slate-400 border-t pt-3 mt-3">Result not published yet.</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
