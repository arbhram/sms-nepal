import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, BookOpen, Printer, Check, X } from 'lucide-react';
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
  const [refresh, setRefresh] = useState(0);

  // Inline editing
  const [editingRow, setEditingRow] = useState(null);   // student._id
  const [editingMarks, setEditingMarks] = useState({}); // { subjectName: value }
  const [rowSaving, setRowSaving] = useState(false);

  // Report card modal
  const [reportCard, setReportCard] = useState(null);
  const [rcData, setRcData] = useState(null);
  const [rcLoading, setRcLoading] = useState(false);

  useEffect(() => {
    api.get('/classes').then(({ data }) => setClasses(data)).catch(() => toast.error('Failed to load classes'));
  }, []);

  useEffect(() => {
    setExams([]);
    setExamId('');
    setGradebook(null);
    setEditingRow(null);
    if (!classId) return;
    api.get('/exams', { params: { classId } })
      .then(({ data }) => setExams(data))
      .catch(() => toast.error('Failed to load exams'));
  }, [classId]);

  useEffect(() => {
    if (!classId || !examId) return;
    setLoading(true);
    setGradebook(null);
    setEditingRow(null);
    api.get('/report-cards/gradebook', { params: { classId, examId } })
      .then(({ data }) => setGradebook(data))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load gradebook'))
      .finally(() => setLoading(false));
  }, [classId, examId, refresh]);

  const startEdit = (row) => {
    const marks = {};
    (gradebook?.subjects || []).forEach((s) => {
      marks[s.name] = row.marks[s.name]?.obtained ?? '';
    });
    setEditingRow(row.student._id);
    setEditingMarks(marks);
  };

  const cancelEdit = () => { setEditingRow(null); setEditingMarks({}); };

  const saveRow = async (student) => {
    const subjects = gradebook?.subjects || [];
    for (const s of subjects) {
      const v = editingMarks[s.name];
      if (v === '' || v == null) { toast.error(`Enter marks for ${s.name}`); return; }
      if (Number(v) < 0 || Number(v) > s.fullMarks) {
        toast.error(`${s.name}: must be 0 – ${s.fullMarks}`); return;
      }
    }
    setRowSaving(true);
    try {
      const marks = subjects.map((s) => ({
        subject: s.name,
        obtained: Number(editingMarks[s.name]),
        fullMarks: s.fullMarks,
        passMarks: s.passMarks || 40,
      }));
      await api.post(`/exams/${examId}/results`, { student: student._id, marks });
      toast.success('Marks saved');
      setEditingRow(null);
      setRefresh((r) => r + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setRowSaving(false); }
  };

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

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/exams')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Class Gradebook</h1>
          <p className="text-slate-500 text-sm mt-0.5">Click any mark or — to edit inline</p>
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
          <label className="label">Exam</label>
          <select value={examId} onChange={(e) => setExamId(e.target.value)} className="input" disabled={!classId}>
            <option value="">Select exam…</option>
            {exams.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
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
                    <th className="px-3 py-3 no-print" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gradebook.rows.map((row) => {
                    const isEditing = editingRow === row.student._id;
                    return (
                      <tr key={row.student._id} className={`transition-colors ${isEditing ? 'bg-brand-50/40' : 'hover:bg-slate-50/60'}`}>
                        <td className="px-4 py-3 sticky left-0 bg-inherit">
                          <div className="font-medium text-slate-800">{row.student.fullName}</div>
                          <div className="text-xs text-slate-400">{row.student.studentId}</div>
                        </td>

                        {gradebook.subjects.map((s, idx) => {
                          const m = row.marks[s.name];
                          return (
                            <td key={s.name} className="px-2 py-2 text-center">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  max={s.fullMarks}
                                  value={editingMarks[s.name] ?? ''}
                                  onChange={(e) => setEditingMarks((prev) => ({ ...prev, [s.name]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveRow(row.student);
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  autoFocus={idx === 0}
                                  className="w-16 text-center border border-brand-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 bg-white"
                                />
                              ) : (
                                <span
                                  onClick={() => startEdit(row)}
                                  title="Click to edit"
                                  className={`cursor-pointer px-2 py-1 rounded font-semibold transition-colors hover:bg-slate-100 ${
                                    m != null
                                      ? m.obtained < (s.passMarks || 40) ? 'text-rose-600' : 'text-slate-800'
                                      : 'text-slate-300 hover:text-slate-500'
                                  }`}
                                >
                                  {m != null ? m.obtained : '—'}
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Total / % / Grade / Rank — dimmed while editing */}
                        <td className="px-3 py-3 text-center font-semibold text-slate-900">{isEditing ? '—' : (row.total ?? '—')}</td>
                        <td className="px-3 py-3 text-center text-slate-600">{isEditing ? '—' : (row.percentage != null ? `${Number(row.percentage).toFixed(1)}%` : '—')}</td>
                        <td className="px-3 py-3 text-center">
                          {!isEditing && row.grade
                            ? <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${GRADE_COLOR[row.grade] || 'bg-slate-100 text-slate-700'}`}>{row.grade}</span>
                            : '—'}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600">{!isEditing ? (row.rank ?? '—') : '—'}</td>

                        {/* Actions */}
                        <td className="px-3 py-3 no-print">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => saveRow(row.student)}
                                disabled={rowSaving}
                                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                              >
                                <Check size={12} /> {rowSaving ? '…' : 'Save'}
                              </button>
                              <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            row.total !== null && (
                              <button
                                onClick={() => openReportCard(row.student._id)}
                                className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                              >
                                Report Card
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && !gradebook && classId && examId && (
        <div className="card p-12 text-center text-slate-400">
          <BookOpen size={32} className="mx-auto mb-3 text-slate-200" />
          No students found for this class/exam.
        </div>
      )}

      {/* Report Card Modal */}
      {reportCard && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 overflow-y-auto no-print">
          <div className="flex min-h-full items-start justify-center p-4 pt-10">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-display font-bold text-slate-900">Report Card</h3>
                <button onClick={() => setReportCard(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">✕</button>
              </div>
              <div className="p-6">
                {rcLoading ? <Loader /> : rcData ? (
                  <ReportCardView {...rcData} onExamChange={async (eid) => {
                    setRcLoading(true);
                    try {
                      const { data } = await api.get(`/report-cards/student/${reportCard.studentId}`, { params: { examId: eid } });
                      setRcData(data);
                    } catch { toast.error('Failed'); }
                    finally { setRcLoading(false); }
                  }} />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
