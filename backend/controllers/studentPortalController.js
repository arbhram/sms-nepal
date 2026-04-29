import asyncHandler from 'express-async-handler';
import Student from '../models/Student.js';
import Fee from '../models/Fee.js';
import Attendance from '../models/Attendance.js';
import { Exam, Result } from '../models/Exam.js';

export const getMyProfile = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.linkedStudent).populate('class', 'name sections');
  if (!student) { res.status(404); throw new Error('Student profile not found'); }
  res.json(student);
});

export const getMyFees = asyncHandler(async (req, res) => {
  const fees = await Fee.find({ student: req.user.linkedStudent }).sort({ createdAt: -1 });
  res.json(fees);
});

export const getMyAttendance = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const q = { student: req.user.linkedStudent };
  if (from && to) q.date = { $gte: new Date(from), $lte: new Date(to) };
  const records = await Attendance.find(q).sort({ date: -1 });

  const summary = { Present: 0, Absent: 0, Leave: 0, Late: 0 };
  records.forEach((r) => { summary[r.status] = (summary[r.status] || 0) + 1; });
  const total = records.length || 1;
  const percentage = Math.round(((summary.Present + summary.Late * 0.5) / total) * 100);
  res.json({ records, summary, percentage });
});

export const getMyResults = asyncHandler(async (req, res) => {
  const results = await Result.find({ student: req.user.linkedStudent })
    .populate('exam', 'name startDate status class')
    .sort({ createdAt: -1 });
  res.json(results);
});

export const getMyExams = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user.linkedStudent);
  if (!student) { res.status(404); throw new Error('Student not found'); }
  const exams = await Exam.find({ class: student.class }).populate('class', 'name').sort({ startDate: -1 });
  res.json(exams);
});
