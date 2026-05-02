import { Printer, CheckCircle, XCircle, Clock } from 'lucide-react';

const GRADE_COLOR = {
  'A+': 'text-emerald-600', 'A': 'text-emerald-600',
  'B+': 'text-blue-600',    'B': 'text-blue-600',
  'C+': 'text-amber-600',   'C': 'text-amber-600',
  'D':  'text-orange-600',  'F': 'text-rose-600',
};

const pct = (n) => (n != null ? `${Number(n).toFixed(1)}%` : '—');
const dash = (v) => (v != null ? v : '—');

export default function ReportCardView({ student, exam, result, attendance, classSize, exams = [], onExamChange }) {
  if (!student) return null;

  const handlePrint = () => window.print();

  return (
    <>
      {/* Print styles injected once */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #report-card-print, #report-card-print * { visibility: visible !important; }
          #report-card-print { position: fixed; inset: 0; padding: 20mm; background: white; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Exam selector + print button — hidden on print */}
      <div className="no-print flex items-center justify-between mb-4 flex-wrap gap-3">
        {exams.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600">Exam:</label>
            <select
              value={exam?._id || ''}
              onChange={(e) => onExamChange?.(e.target.value)}
              className="input py-1.5 text-sm w-auto"
            >
              {exams.map((e) => (
                <option key={e._id} value={e._id}>{e.name}</option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={handlePrint}
          className="btn-primary flex items-center gap-2 ml-auto"
          disabled={!result}
        >
          <Printer size={15} /> Print Report Card
        </button>
      </div>

      {/* The printable card */}
      <div id="report-card-print" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-800 text-white px-8 py-6 text-center">
          <h1 className="text-xl font-display font-bold tracking-wide">SMS Nepal</h1>
          <p className="text-brand-200 text-sm mt-0.5">Student Report Card</p>
          {exam && (
            <div className="mt-2 inline-block bg-white/20 rounded-full px-4 py-1 text-sm font-medium">
              {exam.name}
            </div>
          )}
        </div>

        {/* Student info */}
        <div className="px-8 py-5 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ['Student Name', student.fullName],
            ['Student ID',   student.studentId],
            ['Class',        student.class?.name || '—'],
            ['Section',      student.section || '—'],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
              <p className="font-semibold text-slate-800 text-sm">{val}</p>
            </div>
          ))}
        </div>

        {!exam || !result ? (
          <div className="px-8 py-16 text-center text-slate-400 text-sm">
            {!exam ? 'No completed exam found for this student.' : 'Results have not been entered for this exam yet.'}
          </div>
        ) : (
          <>
            {/* Marks table */}
            <div className="px-8 py-5">
              <h3 className="font-display font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wider">Subject Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200">
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Subject</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-slate-600">Full Marks</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-slate-600">Pass Marks</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-slate-600">Obtained</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-slate-600">%</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-slate-600">Grade</th>
                      <th className="text-center px-4 py-2.5 font-semibold text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.marks.map((m) => {
                      const subjectPct = m.fullMarks > 0 ? (m.obtained / m.fullMarks) * 100 : 0;
                      const passed = m.obtained >= (m.passMarks || 40);
                      return (
                        <tr key={m.subject} className="hover:bg-slate-50/60">
                          <td className="px-4 py-2.5 font-medium text-slate-800">{m.subject}</td>
                          <td className="px-4 py-2.5 text-center text-slate-600">{dash(m.fullMarks)}</td>
                          <td className="px-4 py-2.5 text-center text-slate-400">{dash(m.passMarks || 40)}</td>
                          <td className="px-4 py-2.5 text-center font-semibold text-slate-900">{dash(m.obtained)}</td>
                          <td className="px-4 py-2.5 text-center text-slate-500">{pct(subjectPct)}</td>
                          <td className={`px-4 py-2.5 text-center font-bold ${GRADE_COLOR[m.grade] || 'text-slate-700'}`}>{m.grade || '—'}</td>
                          <td className="px-4 py-2.5 text-center">
                            {passed
                              ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle size={12} />Pass</span>
                              : <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600"><XCircle size={12} />Fail</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                      <td className="px-4 py-3 text-slate-800">Total</td>
                      <td className="px-4 py-3 text-center text-slate-600">{result.totalFull}</td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 text-center text-slate-900 font-bold">{result.totalObtained}</td>
                      <td className="px-4 py-3 text-center text-slate-700">{pct(result.percentage)}</td>
                      <td className={`px-4 py-3 text-center font-bold text-lg ${GRADE_COLOR[result.grade] || 'text-slate-700'}`}>{result.grade}</td>
                      <td className="px-4 py-3" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Summary row */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                ['Total Obtained',    `${result.totalObtained} / ${result.totalFull}`],
                ['Percentage',        pct(result.percentage)],
                ['Overall Grade',     result.grade || '—'],
                ['Class Rank',        result.rank ? `${result.rank} of ${classSize}` : '—'],
              ].map(([label, val]) => (
                <div key={label} className="text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                  <p className={`font-bold text-lg ${label === 'Overall Grade' ? (GRADE_COLOR[result.grade] || 'text-slate-900') : 'text-slate-900'}`}>{val}</p>
                </div>
              ))}
            </div>

            {/* Attendance + remarks */}
            <div className="px-8 py-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {attendance && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Attendance</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      ['Total Days', attendance.total],
                      ['Present',    attendance.Present],
                      ['Absent',     attendance.Absent],
                      ['Attendance', `${attendance.percentage}%`],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between bg-slate-50 rounded-lg px-3 py-2">
                        <span className="text-slate-500">{l}</span>
                        <span className="font-semibold text-slate-800">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Remarks</h4>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 min-h-[60px]">
                  {result.remarks || 'No remarks added.'}
                </p>
              </div>
            </div>

            {/* Footer signatures */}
            <div className="px-8 py-5 border-t border-slate-100 grid grid-cols-3 gap-4 text-center text-xs text-slate-500">
              {['Class Teacher', 'Principal', 'Parent / Guardian'].map((sig) => (
                <div key={sig}>
                  <div className="border-b border-slate-300 mb-2 h-8" />
                  {sig}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
