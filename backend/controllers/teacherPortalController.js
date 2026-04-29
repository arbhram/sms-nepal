import asyncHandler from 'express-async-handler';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import { Exam } from '../models/Exam.js';

// Resolves teacher from req.user — tries linkedTeacher first, then falls back to email match
async function resolveTeacher(reqUser, populate = false) {
  let teacher = null;
  if (reqUser.linkedTeacher) {
    teacher = populate
      ? await Teacher.findById(reqUser.linkedTeacher).populate('assignedClasses', 'name sections')
      : await Teacher.findById(reqUser.linkedTeacher);
  }
  // Fallback: match by email (handles accounts where linkedTeacher was not set on creation)
  if (!teacher && reqUser.email) {
    teacher = populate
      ? await Teacher.findOne({ email: reqUser.email }).populate('assignedClasses', 'name sections')
      : await Teacher.findOne({ email: reqUser.email });
    // Repair the link so future requests work instantly
    if (teacher) {
      await User.findByIdAndUpdate(reqUser._id, { linkedTeacher: teacher._id });
    }
  }
  return teacher;
}

// Collects all class IDs a teacher should have access to:
// their assignedClasses PLUS any class where they are classTeacher
async function allTeacherClassIds(teacher) {
  const classTeacherClasses = await Class.find({ classTeacher: teacher._id }, '_id');
  const ids = new Set([
    ...teacher.assignedClasses.map((id) => id.toString()),
    ...classTeacherClasses.map((c) => c._id.toString()),
  ]);
  return [...ids];
}

export const getMyProfile = asyncHandler(async (req, res) => {
  const teacher = await resolveTeacher(req.user, true);
  if (!teacher) { res.status(404); throw new Error('Teacher profile not found'); }
  const classTeacherFor = await Class.find({ classTeacher: teacher._id }, 'name sections');
  res.json({ ...teacher.toObject(), classTeacherFor });
});

export const getMyStudents = asyncHandler(async (req, res) => {
  const teacher = await resolveTeacher(req.user);
  if (!teacher) { res.status(404); throw new Error('Teacher not found'); }
  const classIds = await allTeacherClassIds(teacher);
  const students = await Student.find({ class: { $in: classIds }, status: 'active' })
    .populate('class', 'name')
    .sort({ fullName: 1 });
  res.json(students);
});

export const getMyExams = asyncHandler(async (req, res) => {
  const teacher = await resolveTeacher(req.user);
  if (!teacher) { res.status(404); throw new Error('Teacher not found'); }
  const classIds = await allTeacherClassIds(teacher);
  const exams = await Exam.find({ class: { $in: classIds } })
    .populate('class', 'name')
    .sort({ startDate: -1 });
  res.json(exams);
});

export const getMyAttendance = asyncHandler(async (req, res) => {
  const { date, classId, section } = req.query;
  const q = {};
  if (classId) q.class = classId;
  if (section) q.section = section;
  if (date) {
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const end = new Date(d); end.setDate(end.getDate() + 1);
    q.date = { $gte: d, $lt: end };
  }
  const records = await Attendance.find(q).populate('student', 'fullName studentId photo');
  res.json(records);
});
