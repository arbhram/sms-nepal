import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserCheck } from 'lucide-react';
import api from '../../api/axios.js';

export default function TeacherAttendance() {
  const { profile } = useOutletContext();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);

  // Classes where teacher is designated class teacher take priority
  const classTeacherFor = profile?.classTeacherFor || [];
  const assignedClasses = profile?.assignedClasses || [];

  // Merge: classTeacherFor first, then any assigned classes not already in list
  const ctIds = new Set(classTeacherFor.map((c) => c._id));
  const availableClasses = [
    ...classTeacherFor,
    ...assignedClasses.filter((c) => !ctIds.has(c._id)),
  ];

  // Pre-select the class teacher's class on load
  useEffect(() => {
    if (!selectedClass && classTeacherFor.length) {
      setSelectedClass(classTeacherFor[0]._id);
      setSelectedSection(classTeacherFor[0].sections?.[0] || '');
    }
  }, [profile]); // eslint-disable-line

  const currentClassObj = availableClasses.find((c) => c._id === selectedClass);
  const isClassTeacherOfSelected = ctIds.has(selectedClass);

  useEffect(() => {
    if (!selectedClass) return;
    api.get(`/teacher-portal/students`).then(({ data }) => {
      const filtered = data.filter((s) => String(s.class?._id) === selectedClass || String(s.class) === selectedClass);
      setStudents(filtered);
      const init = {};
      filtered.forEach((s) => { init[s._id] = 'Present'; });
      setAttendance(init);
    });
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !date) return;
    api.get(`/attendance?classId=${selectedClass}&date=${date}`).then(({ data }) => {
      const map = {};
      data.forEach((r) => { map[r.student?._id || r.student] = r.status; });
      if (Object.keys(map).length) setAttendance((prev) => ({ ...prev, ...map }));
    }).catch(() => {});
  }, [selectedClass, date]);

  const handleSave = async () => {
    if (!selectedClass || !students.length) return toast.error('Select a class first');
    setSaving(true);
    try {
      await api.post('/attendance/bulk', {
        date, classId: selectedClass, section: selectedSection,
        records: students.map((s) => ({ studentId: s._id, status: attendance[s._id] || 'Present' })),
      });
      toast.success('Attendance saved');
    } catch {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-display font-bold text-slate-900">Mark Attendance</h1>

      {isClassTeacherOfSelected && (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
          <UserCheck size={16} />
          You are the class teacher of <strong>{currentClassObj?.name}</strong>
        </div>
      )}

      <div className="bg-white rounded-xl border p-5 flex flex-wrap gap-4">
        <div>
          <label className="label">Class</label>
          <select
            className="input"
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              const c = availableClasses.find((x) => x._id === e.target.value);
              setSelectedSection(c?.sections?.[0] || '');
            }}
          >
            <option value="">Select class...</option>
            {availableClasses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}{ctIds.has(c._id) ? ' (Class Teacher)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Section</label>
          <select
            className="input"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="">All sections</option>
            {(currentClassObj?.sections || []).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {students.length > 0 && (
        <>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Roll No.</th>
                  {['Present', 'Absent', 'Late', 'Leave'].map((s) => (
                    <th key={s} className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{s.fullName}</td>
                    <td className="px-4 py-3 text-slate-500">{s.rollNumber || '—'}</td>
                    {['Present', 'Absent', 'Late', 'Leave'].map((status) => (
                      <td key={status} className="text-center px-3 py-3">
                        <input
                          type="radio"
                          name={s._id}
                          value={status}
                          checked={attendance[s._id] === status}
                          onChange={() => setAttendance((prev) => ({ ...prev, [s._id]: status }))}
                          className="accent-blue-600"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </>
      )}

      {selectedClass && students.length === 0 && (
        <div className="bg-white rounded-xl border p-8 text-center text-slate-400">No students in this class.</div>
      )}

      {!selectedClass && availableClasses.length === 0 && (
        <div className="bg-white rounded-xl border p-8 text-center text-slate-400">
          No classes assigned. Ask admin to assign you as a class teacher or assign classes to your profile.
        </div>
      )}
    </div>
  );
}
