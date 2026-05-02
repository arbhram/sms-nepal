import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, BookOpen, Printer } from 'lucide-react';
import api from '../../api/axios.js';
import { Loader } from '../../components/ui/Misc.jsx';
import ReportCardView from '../../components/ReportCardView.jsx';

const GRADE_COLOR = {
  'A+': 'bg-emerald-100 text-emerald-700', 'A': 'bg-emerald-100 text-emerald-700',
  'B+': 'bg-blue-100 text-blue-700',       'B': 'bg-blue-100 text-blue-700',
  'C+': 'bg-amber-100 text-amber-700',     'C': 'bg-amber-100 text-amber-700',
  'D':  'bg-orange-100 text-orange-700',   'F': 'bg-rose-100 text-rose-700',
};

export default function Gradebook() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [classId, setClassId] = useState('');
  const [examId, setExamId] = useState('');
  const [gradebook, setGradebook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportCard, setReportCard] = useState(null); // { studentId }
  const [rcData, setRcData] = useState(null);
  const [rcLoading, setRcLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/classes'),
      api.get('/exams', { params: { status: 'completed' } }),
    ]).then(([c, e]) => {
      setClasses(c.data);
      setExams(e.data);
    }).catch(() => toast.error('Failed to load'));
  }, []);

  const loadGradebook = async () => {
    if (!classId || !examId) return;
    setLoading(true);
    setGradebook(null);
    try {
      const { data } = await api.get('/report-cards/gradebook', { params: { classId, examId } });
      setGradebook(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load gradebook');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadGradebook(); }, [classId, examId]);

  const openReportCard = async (studentId) => {
    setReportCard({ studentId });
    setRcLoading(true);
    setRcData(null);
    try {
      const { data } = await api.get(`/report-cards/student/${studentId}`, { params: { examId } });
      setRcData(data);
    } catch { toast.error('Failed to load report card'); }
    finally { setRcLoading(false); }
  };

  const handleRcExamChange = async (newExamId) => {
    if (!reportCard) return;
    setRcLoading(true);
    try {
      const { data } = await api.get(`/report-cards/student/${reportCard.studentId}`, { params: { examId: newExamId } });
      setRcData(data);
    } catch { toast.error('Failed to load'); }
    finally { setRcLoading(false); }
  };

  const filteredExams = classId
    ? exams.filter((e) => e.class?._id === classId || String(e.class) === classId)
    : exams;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/exams')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Class Gradebook</h1>
          <p className="text-slate-500 text-sm mt-0.5">View and print results for all students</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="card p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="label">Class</label>
          <select value={classId} onChange={(e) => { setClassId(e.target.value); setExamId(''); setGradebook(null); }} className="input">
            <option value="">Select class…</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="label">Exam (completed)</label>
          <select value={examId} onChange={(e) => setExamId(e.target.value)} className="input" disabled={!classId}>
            <option value="">Select exam…</option>
            {filteredExams.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      {loading && <Loader />}

      {gradebook && !loading && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display font-bold text-slate-900">{gradebook.exam?.name}</h2>
              <p className="text-sm text-slate-500">{gradebook.rows.length} students</p>
            </div>
            <button onClick={() => window.print()} className="no-print btn-secondary flex items-center gap-2 text-sm">
              <Printer size={14} /> Print Gradebook
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50">Student</th>
                    {gradebook.subjects.map((s) => (
                      <th key={s.name} className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">
                        {s.name}<br />
                        <span className="font-normal text-slate-400 normal-case">/{s.fullMarks}</span>
                      </th>
                    ))}
                    <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase">%</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Grade</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Rank</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gradebook.rows.map((row) => (
                    <tr key={row.student._id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 sticky left-0 bg-white">
                        <div className="font-medium text-slate-800">{row.student.fullName}</div>
                        <div className="text-xs text-slate-400">{row.student.studentId}</div>
                      </td>
                      {gradebook.subjects.map((s) => {
                        const m = row.marks[s.name];
                        return (
                          <td key={s.name} className="px-3 py-3 text-center">
                            {m != null ? (
                              <span className={`font-semibold ${m.obtained < (s.passMarks || 40) ? 'text-rose-600' : 'text-slate-800'}`}>
                                {m.obtained}
                              </span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-center font-semibold text-slate-900">{row.total ?? '—'}</td>
                      <td className="px-3 py-3 text-center text-slate-600">{row.percentage != null ? `${Number(row.percentage).toFixed(1)}%` : '—'}</td>
                      <td className="px-3 py-3 text-center">
                        {row.grade ? (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${GRADE_COLOR[row.grade] || 'bg-slate-100 text-slate-700'}`}>{row.grade}</span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-600">{row.rank ?? '—'}</td>
                      <td className="px-3 py-3 text-center no-print">
                        <button
                          onClick={() => openReportCard(row.student._id)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          Report Card
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && !gradebook && classId && examId && (
        <div className="card p-12 text-center text-slate-400">
          <BookOpen size={32} className="mx-auto mb-3 text-slate-200" />
          No results entered for this exam yet.
        </div>
      )}

      {/* Report Card Modal */}
      {reportCard && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 overflow-y-auto no-print">
          <div className="flex min-h-full items-start justify-center p-4 pt-10">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-display font-bold text-slate-900">Report Card</h3>
                <button onClick={() => setReportCard(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 text-lg">✕</button>
              </div>
              <div className="p-6">
                {rcLoading ? <Loader /> : rcData ? (
                  <ReportCardView
                    {...rcData}
                    onExamChange={handleRcExamChange}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
