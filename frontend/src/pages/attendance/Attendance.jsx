import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Check, X as XIcon, Clock, FileText, Save, Download, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader } from '../../components/ui/Misc.jsx';

// ─── constants ───────────────────────────────────────────────────────────────
const STATUSES = [
  { key: 'Present', short: 'P', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', icon: Check },
  { key: 'Absent',  short: 'A', color: 'bg-rose-500',    text: 'text-rose-700',    bg: 'bg-rose-50',    icon: XIcon },
  { key: 'Late',    short: 'La', color: 'bg-amber-500',  text: 'text-amber-700',   bg: 'bg-amber-50',   icon: Clock },
  { key: 'Leave',   short: 'L',  color: 'bg-indigo-500', text: 'text-indigo-700',  bg: 'bg-indigo-50',  icon: FileText },
];
const STATUS_CYCLE = ['Present', 'Absent', 'Late', 'Leave'];
const statusMeta = (key) => STATUSES.find((s) => s.key === key) || STATUSES[0];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ─── helpers ─────────────────────────────────────────────────────────────────
const dateKey = (d) => new Date(d).toISOString().slice(0, 10);
const daysInMonth = (y, m) => new Date(y, m, 0).getDate();

function buildRegisterMap(records) {
  // { studentId: { 'YYYY-MM-DD': { _id, status } } }
  const map = {};
  records.forEach((r) => {
    const sid = r.student?._id || r.student;
    const dk = dateKey(r.date);
    if (!map[sid]) map[sid] = {};
    map[sid][dk] = { _id: r._id, status: r.status };
  });
  return map;
}

function studentSummary(studentId, regMap) {
  const days = Object.values(regMap[studentId] || {});
  const counts = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
  days.forEach((d) => { if (counts[d.status] !== undefined) counts[d.status]++; });
  const total = days.length;
  const pct = total ? Math.round(((counts.Present + counts.Late * 0.5) / total) * 100) : 0;
  return { counts, total, pct };
}

function downloadCSV({ students, regMap, dates, month, year, className }) {
  const headers = ['Roll No', 'Student', ...dates.map((d) => `${d.slice(8, 10)}`), 'Present', 'Absent', 'Late', 'Leave', '%'];
  const rows = students.map((s) => {
    const cells = dates.map((d) => regMap[s._id]?.[d]?.status?.[0] || '-');
    const { counts, total } = studentSummary(s._id, regMap);
    return [
      s.rollNumber || '-',
      s.fullName,
      ...cells,
      counts.Present,
      counts.Absent,
      counts.Late,
      counts.Leave,
      total ? `${Math.round(((counts.Present + counts.Late * 0.5) / total) * 100)}%` : '-',
    ];
  });
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance-${className || 'class'}-${MONTH_NAMES[month - 1]}-${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Mark Attendance Tab ──────────────────────────────────────────────────────
function MarkTab({ classes }) {
  const [classId, setClassId] = useState('');
  const [section, setSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [monthCounts, setMonthCounts] = useState({});   // { studentId: { Present, Absent, ... } }
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const currentClass = classes.find((c) => c._id === classId);

  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const [stuRes, attRes, reportRes] = await Promise.all([
        api.get('/students', { params: { class: classId, section, limit: 500 } }),
        api.get('/attendance', { params: { classId, section, date } }),
        api.get('/attendance/report', {
          params: {
            classId, section,
            month: new Date(date).getMonth() + 1,
            year: new Date(date).getFullYear(),
          },
        }),
      ]);
      const studs = stuRes.data.students || [];
      setStudents(studs);

      // Build attendance map for the selected date
      const attMap = {};
      (attRes.data || []).forEach((a) => { attMap[a.student?._id || a.student] = a.status; });
      const saved = attRes.data?.length > 0;
      setIsSaved(saved);

      const defaults = {};
      studs.forEach((s) => { defaults[s._id] = attMap[s._id] || 'Present'; });
      setAttendance(defaults);

      // Build monthly summary per student
      const regMap = buildRegisterMap(reportRes.data.records || []);
      const counts = {};
      studs.forEach((s) => { counts[s._id] = studentSummary(s._id, regMap).counts; });
      setMonthCounts(counts);
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [classId, section, date]);

  useEffect(() => {
    if (classId) load();
  }, [load]);

  useEffect(() => {
    if (classes.length && !classId) {
      setClassId(classes[0]._id);
      setSection(classes[0].sections?.[0] || '');
    }
  }, [classes]); // eslint-disable-line

  // Save single student attendance immediately
  const saveOne = async (studentId, status) => {
    setSavingId(studentId);
    try {
      await api.post('/attendance/bulk', {
        date, classId, section,
        records: [{ studentId, status }],
      });
      setAttendance((prev) => ({ ...prev, [studentId]: status }));
      setIsSaved(true);
      // Refresh monthly count for this student
      const y = new Date(date).getFullYear();
      const m = new Date(date).getMonth() + 1;
      const r = await api.get('/attendance/report', { params: { classId, section, month: m, year: y } });
      const regMap = buildRegisterMap(r.data.records || []);
      setMonthCounts((prev) => ({
        ...prev,
        [studentId]: studentSummary(studentId, regMap).counts,
      }));
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingId(null);
    }
  };

  // Save all at once
  const saveAll = async () => {
    setSaving(true);
    try {
      const records = students.map((s) => ({ studentId: s._id, status: attendance[s._id] || 'Present' }));
      await api.post('/attendance/bulk', { date, classId, section, records });
      setIsSaved(true);
      toast.success('Attendance saved for all students');
      load();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setAll = (status) => {
    const next = {};
    students.forEach((s) => { next[s._id] = status; });
    setAttendance(next);
  };

  const counts = STATUSES.reduce((acc, s) => {
    acc[s.key] = Object.values(attendance).filter((v) => v === s.key).length;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="card p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Class</label>
            <select value={classId} onChange={(e) => { setClassId(e.target.value); const c = classes.find((x) => x._id === e.target.value); setSection(c?.sections?.[0] || ''); }} className="input">
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <select value={section} onChange={(e) => setSection(e.target.value)} className="input">
              <option value="">All sections</option>
              {(currentClass?.sections || []).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100">
          {/* Status counts */}
          {STATUSES.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 text-sm">
              <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
              <span className="text-slate-500">{s.key}:</span>
              <span className="font-bold text-slate-900">{counts[s.key] || 0}</span>
            </div>
          ))}
          <div className="ml-auto flex gap-2">
            <button onClick={() => setAll('Present')} className="btn-ghost text-xs">All Present</button>
            <button onClick={() => setAll('Absent')} className="btn-ghost text-xs">All Absent</button>
          </div>
        </div>

        {isSaved && (
          <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            Attendance already saved for this date — you can edit individual students below or save all again.
          </div>
        )}
      </div>

      {/* Student list */}
      {loading ? <Loader /> : students.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">No students in this class/section.</div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {students.map((s) => {
            const mc = monthCounts[s._id] || {};
            const totalDays = Object.values(mc).reduce((a, b) => a + b, 0);
            const presentDays = (mc.Present || 0) + (mc.Late || 0);
            return (
              <div key={s._id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-brand text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {s.fullName?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm">{s.fullName}</div>
                  <div className="text-xs text-slate-400 font-mono">{s.rollNumber ? `#${s.rollNumber}` : s.studentId}</div>
                </div>
                {/* Monthly attendance mini-badge */}
                {totalDays > 0 && (
                  <div className="text-xs text-slate-500 text-right hidden sm:block">
                    <span className="font-semibold text-emerald-600">{presentDays}</span>
                    <span>/{totalDays} days</span>
                    <div className="text-slate-400">{Math.round((presentDays / totalDays) * 100)}% this month</div>
                  </div>
                )}
                {/* Status toggle buttons */}
                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl flex-shrink-0">
                  {STATUSES.map((st) => {
                    const SIcon = st.icon;
                    const active = attendance[s._id] === st.key;
                    return (
                      <button
                        key={st.key}
                        onClick={() => setAttendance({ ...attendance, [s._id]: st.key })}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                          active ? `${st.color} text-white shadow-card` : 'text-slate-500 hover:bg-white'
                        }`}
                        title={st.key}
                      >
                        <SIcon size={12} />
                        <span className="hidden md:inline">{st.key}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Save individual */}
                <button
                  onClick={() => saveOne(s._id, attendance[s._id] || 'Present')}
                  disabled={savingId === s._id}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-500 transition flex-shrink-0"
                  title="Save this student"
                >
                  {savingId === s._id ? (
                    <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin block" />
                  ) : (
                    <Save size={14} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {students.length > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Click <Save size={12} className="inline" /> next to each student to save individually, or save all at once.</span>
          <button onClick={saveAll} disabled={saving || !students.length} className="btn-primary">
            <Save size={16} /> {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Attendance Register Tab ──────────────────────────────────────────────────
function RegisterTab({ classes }) {
  const today = new Date();
  const [classId, setClassId] = useState('');
  const [section, setSection] = useState('');
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [students, setStudents] = useState([]);
  const [regMap, setRegMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [updatingCell, setUpdatingCell] = useState(null);

  const currentClass = classes.find((c) => c._id === classId);
  const totalDays = daysInMonth(year, month);
  const allDates = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    return { date: dateKey(d), day: i + 1, dow: d.getDay() };
  });

  useEffect(() => {
    if (classes.length && !classId) {
      setClassId(classes[0]._id);
      setSection(classes[0].sections?.[0] || '');
    }
  }, [classes]); // eslint-disable-line

  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const { data } = await api.get('/attendance/report', { params: { classId, section, month, year } });
      setStudents(data.students || []);
      setRegMap(buildRegisterMap(data.records || []));
    } catch {
      toast.error('Failed to load attendance report');
    } finally {
      setLoading(false);
    }
  }, [classId, section, month, year]);

  useEffect(() => { if (classId) load(); }, [load]);

  const cycleStatus = async (studentId, dateStr) => {
    const existing = regMap[studentId]?.[dateStr];
    const currentStatus = existing?.status || null;
    const nextStatus = currentStatus
      ? STATUS_CYCLE[(STATUS_CYCLE.indexOf(currentStatus) + 1) % STATUS_CYCLE.length]
      : 'Present';

    const cellKey = `${studentId}-${dateStr}`;
    setUpdatingCell(cellKey);
    try {
      await api.post('/attendance/bulk', {
        date: dateStr, classId, section,
        records: [{ studentId, status: nextStatus }],
      });
      setRegMap((prev) => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          [dateStr]: { ...(existing || {}), status: nextStatus },
        },
      }));
    } catch {
      toast.error('Failed to update');
    } finally {
      setUpdatingCell(null);
    }
  };

  const shiftMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  };

  const handleDownload = () => {
    downloadCSV({
      students,
      regMap,
      dates: allDates.map((d) => d.date),
      month, year,
      className: currentClass?.name,
    });
  };

  // Column summary: how many present per day
  const daySummary = (dateStr) => {
    let present = 0;
    students.forEach((s) => {
      const st = regMap[s._id]?.[dateStr]?.status;
      if (st === 'Present' || st === 'Late') present++;
    });
    return present;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="card p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Class</label>
            <select value={classId} onChange={(e) => { setClassId(e.target.value); const c = classes.find((x) => x._id === e.target.value); setSection(c?.sections?.[0] || ''); }} className="input">
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <select value={section} onChange={(e) => setSection(e.target.value)} className="input">
              <option value="">All sections</option>
              {(currentClass?.sections || []).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Month</label>
            <div className="flex items-center gap-2">
              <button onClick={() => shiftMonth(-1)} className="p-2 rounded-lg hover:bg-slate-100"><ChevronLeft size={16} /></button>
              <span className="font-semibold text-slate-800 min-w-[120px] text-center">{MONTH_NAMES[month - 1]} {year}</span>
              <button onClick={() => shiftMonth(1)} className="p-2 rounded-lg hover:bg-slate-100"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={handleDownload} disabled={!students.length} className="btn-secondary flex items-center gap-1.5">
              <Download size={15} /> Download CSV
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100 flex-wrap">
          {STATUSES.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 text-xs">
              <span className={`w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold ${s.color}`}>{s.short}</span>
              <span className="text-slate-500">{s.key}</span>
            </div>
          ))}
          <span className="text-xs text-slate-400 ml-2">Click any cell to cycle status. Weekends shown in gray.</span>
        </div>
      </div>

      {loading ? <Loader /> : students.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">No students found.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse w-full">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="sticky left-0 z-10 bg-slate-800 px-3 py-2 text-left font-semibold min-w-[160px]">Student</th>
                  <th className="px-2 py-2 text-center font-semibold w-10">Roll</th>
                  {allDates.map(({ date: d, day, dow }) => (
                    <th
                      key={d}
                      className={`px-1 py-2 text-center font-semibold w-8 ${dow === 0 || dow === 6 ? 'text-slate-400' : 'text-white'}`}
                      title={`${DAY_NAMES[dow]} ${day}`}
                    >
                      <div>{day}</div>
                      <div className="text-xs font-normal opacity-70">{DAY_NAMES[dow].slice(0,1)}</div>
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center text-emerald-300 w-8">P</th>
                  <th className="px-2 py-2 text-center text-rose-300 w-8">A</th>
                  <th className="px-2 py-2 text-center text-amber-300 w-8">La</th>
                  <th className="px-2 py-2 text-center text-indigo-300 w-8">L</th>
                  <th className="px-2 py-2 text-center text-slate-300 w-12">%</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, si) => {
                  const { counts, total, pct } = studentSummary(s._id, regMap);
                  return (
                    <tr key={s._id} className={si % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className={`sticky left-0 z-10 px-3 py-1.5 font-medium text-slate-800 border-r border-slate-200 ${si % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        {s.fullName}
                      </td>
                      <td className="px-2 py-1.5 text-center text-slate-500">{s.rollNumber || '—'}</td>
                      {allDates.map(({ date: d, dow }) => {
                        const rec = regMap[s._id]?.[d];
                        const meta = rec ? statusMeta(rec.status) : null;
                        const cellKey = `${s._id}-${d}`;
                        const isUpdating = updatingCell === cellKey;
                        const isWeekend = dow === 0 || dow === 6;
                        return (
                          <td key={d} className={`px-0.5 py-1 text-center ${isWeekend ? 'bg-slate-100/60' : ''}`}>
                            <button
                              onClick={() => !isUpdating && cycleStatus(s._id, d)}
                              disabled={isUpdating}
                              className={`w-6 h-6 rounded text-white font-bold text-xs flex items-center justify-center mx-auto transition hover:opacity-80 ${
                                isUpdating ? 'animate-pulse bg-slate-300' : meta ? meta.color : 'bg-transparent hover:bg-slate-200 text-slate-300'
                              }`}
                              title={rec ? `${rec.status} — click to change` : 'Click to mark'}
                            >
                              {isUpdating ? '' : meta ? meta.short : '·'}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-2 py-1 text-center font-bold text-emerald-600">{counts.Present}</td>
                      <td className="px-2 py-1 text-center font-bold text-rose-600">{counts.Absent}</td>
                      <td className="px-2 py-1 text-center font-bold text-amber-600">{counts.Late}</td>
                      <td className="px-2 py-1 text-center font-bold text-indigo-600">{counts.Leave}</td>
                      <td className={`px-2 py-1 text-center font-bold ${pct >= 75 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {total ? `${pct}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Column summary footer */}
              <tfoot>
                <tr className="bg-slate-800 text-white">
                  <td colSpan={2} className="sticky left-0 z-10 bg-slate-800 px-3 py-2 font-semibold text-xs">Daily Present</td>
                  {allDates.map(({ date: d, dow }) => {
                    const n = daySummary(d);
                    return (
                      <td key={d} className={`px-0.5 py-2 text-center text-xs font-semibold ${dow === 0 || dow === 6 ? 'text-slate-500' : n === 0 ? 'text-slate-400' : 'text-emerald-300'}`}>
                        {n || ''}
                      </td>
                    );
                  })}
                  <td colSpan={5} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Attendance() {
  const [tab, setTab] = useState('mark');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    api.get('/classes').then((r) => setClasses(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Mark, view, edit and download class attendance records"
      />

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-5">
        {[
          { key: 'mark', label: 'Mark Attendance', icon: Check },
          { key: 'register', label: 'Attendance Register', icon: BookOpen },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === key ? 'bg-white shadow-card text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'mark'
        ? <MarkTab classes={classes} />
        : <RegisterTab classes={classes} />
      }
    </div>
  );
}
