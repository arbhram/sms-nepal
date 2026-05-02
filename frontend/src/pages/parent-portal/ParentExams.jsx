import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users } from 'lucide-react';
import api from '../../api/axios.js';
import { Badge } from '../../components/ui/Misc.jsx';

export default function ParentExams() {
  const { activeChild } = useOutletContext();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeChild) return;
    const id = activeChild._id;
    setLoading(true);
    Promise.all([
      api.get(`/parent-portal/children/${id}/exams`),
      api.get(`/parent-portal/children/${id}/results`),
    ]).then(([e, r]) => {
      setExams(e.data);
      setResults(r.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [activeChild?._id]);

  if (!activeChild) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Users size={40} className="text-slate-300" />
        <p className="text-slate-500 font-medium">No children linked to your account</p>
      </div>
    );
  }

  const resultsByExam = results.reduce((acc, r) => {
    const examId = r.exam?._id || r.exam;
    if (examId) acc[String(examId)] = r;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Exams & Results</h1>
        <p className="text-sm text-slate-500 mt-0.5">{activeChild.fullName}</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : exams.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No exams found.</div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => {
            const status = new Date(exam.startDate) > new Date() ? 'upcoming' : new Date(exam.endDate) < new Date() ? 'completed' : 'ongoing';
            const result = resultsByExam[String(exam._id)];

            return (
              <div key={exam._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-display font-bold text-slate-900">{exam.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {new Date(exam.startDate).toLocaleDateString()}
                      {exam.endDate && ` — ${new Date(exam.endDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Badge color={status === 'upcoming' ? 'blue' : status === 'ongoing' ? 'yellow' : 'green'}>
                    {status}
                  </Badge>
                </div>

                {result ? (
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="bg-slate-50 rounded-xl px-4 py-2 text-center">
                        <div className="text-xs text-slate-400 mb-0.5">Total</div>
                        <div className="font-display font-bold text-slate-900">
                          {result.subjects?.reduce((s, sub) => s + (sub.marksObtained ?? 0), 0)} / {result.subjects?.reduce((s, sub) => s + (sub.fullMarks ?? 0), 0)}
                        </div>
                      </div>
                      <div className={`rounded-xl px-4 py-2 text-center ${result.isPassed ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                        <div className="text-xs text-slate-400 mb-0.5">Result</div>
                        <div className={`font-display font-bold ${result.isPassed ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {result.isPassed ? 'Pass' : 'Fail'}
                        </div>
                      </div>
                      {result.percentage != null && (
                        <div className="bg-indigo-50 rounded-xl px-4 py-2 text-center">
                          <div className="text-xs text-slate-400 mb-0.5">Percentage</div>
                          <div className="font-display font-bold text-indigo-700">{result.percentage}%</div>
                        </div>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 rounded-lg">
                          <tr>
                            {['Subject', 'Full Marks', 'Pass Marks', 'Obtained', 'Status'].map((h) => (
                              <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(result.subjects || []).map((sub, i) => {
                            const passed = sub.marksObtained != null && sub.marksObtained >= (sub.passMarks ?? 0);
                            return (
                              <tr key={i}>
                                <td className="px-3 py-2 font-medium text-slate-800">{sub.subject}</td>
                                <td className="px-3 py-2 text-slate-600">{sub.fullMarks ?? '—'}</td>
                                <td className="px-3 py-2 text-slate-600">{sub.passMarks ?? '—'}</td>
                                <td className="px-3 py-2 font-semibold text-slate-900">{sub.marksObtained ?? '—'}</td>
                                <td className="px-3 py-2">
                                  {sub.marksObtained != null && (
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                      {passed ? 'Pass' : 'Fail'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(exam.subjects || []).map((s, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{s.name}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
