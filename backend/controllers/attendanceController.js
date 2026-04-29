import asyncHandler from 'express-async-handler';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';

// @desc   Bulk mark attendance for a class
// @route  POST /api/attendance/bulk
export const bulkMarkAttendance = asyncHandler(async (req, res) => {
  const { date, classId, section, records } = req.body;
  // records: [{ studentId, status, remarks }]
  if (!date || !classId || !records?.length) {
    res.status(400);
    throw new Error('date, classId, and records are required');
  }
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const ops = records.map((r) => ({
    updateOne: {
      filter: { student: r.studentId, date: d },
      update: {
        $set: {
          student: r.studentId,
          class: classId,
          section,
          date: d,
          status: r.status,
          remarks: r.remarks || '',
          markedBy: req.user._id,
        },
      },
      upsert: true,
    },
  }));
  await Attendance.bulkWrite(ops);
  res.json({ message: 'Attendance recorded', count: ops.length });
});

// @desc   Get attendance for a class on a date
// @route  GET /api/attendance
export const getAttendance = asyncHandler(async (req, res) => {
  const { date, classId, section, studentId, from, to } = req.query;
  const q = {};
  if (classId) q.class = classId;
  if (section) q.section = section;
  if (studentId) q.student = studentId;
  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setDate(end.getDate() + 1);
    q.date = { $gte: d, $lt: end };
  } else if (from && to) {
    q.date = { $gte: new Date(from), $lte: new Date(to) };
  }
  const records = await Attendance.find(q)
    .populate('student', 'fullName studentId photo')
    .sort({ date: -1 });
  res.json(records);
});

// @desc   Update a single attendance record
// @route  PUT /api/attendance/:id
export const updateAttendance = asyncHandler(async (req, res) => {
  const rec = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!rec) { res.status(404); throw new Error('Attendance record not found'); }
  res.json(rec);
});

// @desc   Full month attendance report for a class (students × dates)
// @route  GET /api/attendance/report
export const getClassReport = asyncHandler(async (req, res) => {
  const { classId, section, month, year } = req.query;
  if (!classId) { res.status(400); throw new Error('classId is required'); }

  const y = Number(year || new Date().getFullYear());
  const m = Number(month || new Date().getMonth() + 1);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  const q = { class: classId, date: { $gte: start, $lt: end } };
  if (section) q.section = section;

  const sq = { class: classId, status: 'active' };
  if (section) sq.section = section;

  const [students, records] = await Promise.all([
    Student.find(sq, 'fullName studentId rollNumber section').sort({ rollNumber: 1, fullName: 1 }),
    Attendance.find(q).populate('student', '_id'),
  ]);

  res.json({ students, records });
});

// @desc   Get attendance summary for a student
// @route  GET /api/attendance/student/:id/summary
export const studentAttendanceSummary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { month, year } = req.query;

  const start = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const records = await Attendance.find({ student: id, date: { $gte: start, $lt: end } });
  const summary = { Present: 0, Absent: 0, Leave: 0, Late: 0 };
  records.forEach((r) => (summary[r.status] = (summary[r.status] || 0) + 1));
  const total = records.length || 1;
  const percentage = Math.round(((summary.Present + summary.Late * 0.5) / total) * 100);
  res.json({ summary, total: records.length, percentage, records });
});
