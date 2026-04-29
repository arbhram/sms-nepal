import asyncHandler from 'express-async-handler';
import { Exam, Result } from '../models/Exam.js';
import { calculateGrade } from '../utils/helpers.js';

export const createExam = asyncHandler(async (req, res) => {
  const exam = await Exam.create(req.body);
  res.status(201).json(exam);
});

export const getExams = asyncHandler(async (req, res) => {
  const { classId, status } = req.query;
  const q = {};
  if (classId) q.class = classId;
  if (status) q.status = status;
  const exams = await Exam.find(q).populate('class', 'name').sort({ startDate: -1 });
  res.json(exams);
});

export const getExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id).populate('class');
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }
  res.json(exam);
});

export const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }
  res.json(exam);
});

export const deleteExam = asyncHandler(async (req, res) => {
  await Result.deleteMany({ exam: req.params.id });
  await Exam.findByIdAndDelete(req.params.id);
  res.json({ message: 'Exam and related results removed' });
});

// @desc   Submit/Update result
// @route  POST /api/exams/:id/results
export const submitResult = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { student, marks } = req.body; // marks: [{ subject, obtained, fullMarks }]
  const totalObtained = marks.reduce((s, m) => s + Number(m.obtained || 0), 0);
  const totalFull = marks.reduce((s, m) => s + Number(m.fullMarks || 0), 0);
  const percentage = totalFull ? Math.round((totalObtained / totalFull) * 100) : 0;
  const grade = calculateGrade(percentage);

  const marksWithGrades = marks.map((m) => ({
    ...m,
    grade: calculateGrade((m.obtained / m.fullMarks) * 100),
  }));

  const result = await Result.findOneAndUpdate(
    { exam: id, student },
    { exam: id, student, marks: marksWithGrades, totalObtained, totalFull, percentage, grade },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.status(201).json(result);
});

// @desc   Get results for an exam (with ranking)
// @route  GET /api/exams/:id/results
export const getResults = asyncHandler(async (req, res) => {
  const results = await Result.find({ exam: req.params.id })
    .populate('student', 'fullName studentId photo')
    .sort({ percentage: -1 });
  // Assign rank
  const ranked = results.map((r, idx) => {
    r.rank = idx + 1;
    return r;
  });
  res.json(ranked);
});

// @desc   Get a student's results across exams
// @route  GET /api/exams/student/:studentId
export const getStudentResults = asyncHandler(async (req, res) => {
  const results = await Result.find({ student: req.params.studentId })
    .populate('exam', 'name startDate')
    .sort({ createdAt: -1 });
  res.json(results);
});
