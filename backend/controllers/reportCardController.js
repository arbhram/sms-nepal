import asyncHandler from 'express-async-handler';
import { Exam, Result } from '../models/Exam.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Attendance from '../models/Attendance.js';

async function resolveTeacher(user) {
  if (user.linkedTeacher) return Teacher.findById(user.linkedTeacher).lean();
  if (user.email) return Teacher.findOne({ email: user.email }).lean();
  return null;
}

async function checkAccess(req, studentId) {
  const { role } = req.user;
  if (role === 'admin' || role === 'superadmin') return;

  if (role === 'student') {
    if (String(req.user.linkedStudent) !== String(studentId)) {
      const err = new Error('Access denied'); err.statusCode = 403; throw err;
    }
    return;
  }

  if (role === 'parent') {
    const allowed = (req.user.linkedStudents || []).map(String);
    if (!allowed.includes(String(studentId))) {
      const err = new Error('Access denied'); err.statusCode = 403; throw err;
    }
    return;
  }

  if (role === 'teacher') {
    const teacher = await resolveTeacher(req.user);
    if (!teacher) { const err = new Error('Access denied'); err.statusCode = 403; throw err; }
    const student = await Student.findById(studentId).lean();
    if (!student) { const err = new Error('Student not found'); err.statusCode = 404; throw err; }
    const assigned = (teacher.assignedClasses || []).map(String);
    if (!assigned.includes(String(student.class))) {
      const err = new Error('Access denied'); err.statusCode = 403; throw err;
    }
    return;
  }

  const err = new Error('Access denied'); err.statusCode = 403; throw err;
}

// GET /api/report-cards/student/:studentId?examId=
export const getReportCard = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { examId } = req.query;

  await checkAccess(req, studentId);

  const student = await Student.findById(studentId)
    .populate({ path: 'class', populate: { path: 'classTeacher', select: 'fullName subject' } })
    .lean();
  if (!student) { res.status(404); throw new Error('Student not found'); }

  // Available completed exams for this class (for selector)
  const exams = await Exam.find({ class: student.class._id, status: 'completed' })
    .select('name startDate endDate')
    .sort({ startDate: -1 })
    .lean();

  let exam;
  if (examId) {
    exam = await Exam.findById(examId).lean();
  } else {
    exam = exams[0] || null;
  }

  if (!exam) {
    return res.json({ student, exam: null, result: null, attendance: null, exams, classSize: 0 });
  }

  const [result, allResults, attendanceRecs] = await Promise.all([
    Result.findOne({ exam: exam._id, student: studentId }).lean(),
    Result.find({ exam: exam._id }).sort({ totalObtained: -1 }).lean(),
    Attendance.find({ student: studentId }).lean(),
  ]);

  const rank = allResults.findIndex((r) => String(r.student) === String(studentId)) + 1;

  const attSummary = { Present: 0, Absent: 0, Leave: 0, Late: 0 };
  attendanceRecs.forEach((a) => { attSummary[a.status] = (attSummary[a.status] || 0) + 1; });
  const attTotal = attendanceRecs.length;
  const attPercent = attTotal > 0
    ? Math.round(((attSummary.Present + attSummary.Late * 0.5) / attTotal) * 100)
    : 0;

  res.json({
    student,
    exam,
    result: result ? { ...result, rank } : null,
    attendance: { ...attSummary, total: attTotal, percentage: attPercent },
    exams,
    classSize: allResults.length,
  });
});

// GET /api/report-cards/gradebook?classId=&examId=
export const getGradebook = asyncHandler(async (req, res) => {
  const { classId, examId } = req.query;
  if (!classId || !examId) { res.status(400); throw new Error('classId and examId are required'); }

  const { role } = req.user;
  if (role === 'teacher') {
    const teacher = await resolveTeacher(req.user);
    if (!teacher) { res.status(403); throw new Error('Access denied'); }
    const assigned = (teacher.assignedClasses || []).map(String);
    if (!assigned.includes(classId)) { res.status(403); throw new Error('Access denied'); }
  } else if (!['admin', 'superadmin'].includes(role)) {
    res.status(403); throw new Error('Access denied');
  }

  const [exam, students, results] = await Promise.all([
    Exam.findById(examId).populate('class', 'name classTeacher').lean(),
    Student.find({ class: classId, status: 'active' }).select('fullName studentId section').sort({ fullName: 1 }).lean(),
    Result.find({ exam: examId }).lean(),
  ]);

  if (!exam) { res.status(404); throw new Error('Exam not found'); }

  const resultsMap = {};
  results.forEach((r) => { resultsMap[String(r.student)] = r; });

  const rows = students.map((s) => {
    const r = resultsMap[String(s._id)];
    const marksMap = {};
    (r?.marks || []).forEach((m) => { marksMap[m.subject] = m; });
    return {
      student: s,
      marks: marksMap,
      total: r?.totalObtained ?? null,
      totalFull: r?.totalFull ?? null,
      percentage: r?.percentage ?? null,
      grade: r?.grade ?? null,
    };
  });

  // Compute ranks
  const withResults = rows.filter((r) => r.total !== null).sort((a, b) => b.total - a.total);
  withResults.forEach((row, idx) => { row.rank = idx + 1; });

  res.json({ exam, subjects: exam.subjects || [], rows });
});
