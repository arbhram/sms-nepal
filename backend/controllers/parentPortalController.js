import asyncHandler from 'express-async-handler';
import Student from '../models/Student.js';
import Fee from '../models/Fee.js';
import Attendance from '../models/Attendance.js';
import { Exam, Result } from '../models/Exam.js';

const guard = (req, studentId) => {
  const allowed = (req.user.linkedStudents || []).map(String);
  if (!allowed.includes(String(studentId))) {
    const err = new Error('Access denied');
    err.statusCode = 403;
    throw err;
  }
};

export const getMyChildren = asyncHandler(async (req, res) => {
  const children = await Student.find({ _id: { $in: req.user.linkedStudents || [] } })
    .populate('class', 'name sections')
    .lean();
  res.json(children);
});

export const getChildProfile = asyncHandler(async (req, res) => {
  guard(req, req.params.studentId);
  const student = await Student.findById(req.params.studentId).populate('class', 'name sections');
  if (!student) { res.status(404); throw new Error('Student not found'); }
  res.json(student);
});

export const getChildFees = asyncHandler(async (req, res) => {
  guard(req, req.params.studentId);
  const fees = await Fee.find({ student: req.params.studentId }).sort({ createdAt: -1 });
  res.json(fees);
});

export const getChildAttendance = asyncHandler(async (req, res) => {
  guard(req, req.params.studentId);
  const { from, to } = req.query;
  const q = { student: req.params.studentId };
  if (from && to) q.date = { $gte: new Date(from), $lte: new Date(to) };
  const records = await Attendance.find(q).sort({ date: -1 });
  const summary = { Present: 0, Absent: 0, Leave: 0, Late: 0 };
  records.forEach((r) => { summary[r.status] = (summary[r.status] || 0) + 1; });
  const total = records.length || 1;
  const percentage = Math.round(((summary.Present + summary.Late * 0.5) / total) * 100);
  res.json({ records, summary, percentage });
});

export const getChildExams = asyncHandler(async (req, res) => {
  guard(req, req.params.studentId);
  const student = await Student.findById(req.params.studentId);
  if (!student) { res.status(404); throw new Error('Student not found'); }
  const exams = await Exam.find({ class: student.class }).populate('class', 'name').sort({ startDate: -1 });
  res.json(exams);
});

export const getChildResults = asyncHandler(async (req, res) => {
  guard(req, req.params.studentId);
  const results = await Result.find({ student: req.params.studentId })
    .populate('exam', 'name startDate status class')
    .sort({ createdAt: -1 });
  res.json(results);
});
