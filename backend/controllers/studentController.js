import asyncHandler from 'express-async-handler';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Fee from '../models/Fee.js';
import Class from '../models/Class.js';
import { generateId } from '../utils/helpers.js';
import { notify } from '../utils/notify.js';

const gen6digit = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc   Create student
// @route  POST /api/students
export const createStudent = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!data.studentId) data.studentId = generateId('STU');
  if (req.file) data.photo = `/uploads/${req.file.filename}`;

  const student = await Student.create(data);

  // Auto-create admission fee (once per academic year)
  try {
    const cls = await Class.findById(student.class);
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const existing = await Fee.findOne({ student: student._id, category: 'Admission', createdAt: { $gte: yearStart } });
    if (!existing) {
      await Fee.create({
        receiptNumber: generateId('RCP'),
        student: student._id,
        category: 'Admission',
        totalAssignedFee: cls?.admissionFee || 0,
        feeItems: [{ type: 'Admission', description: 'Admission Fee', amount: cls?.admissionFee || 0 }],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }
    // Auto-create transport fee if student uses transport
    if (student.usesTransport && cls?.transportFee > 0) {
      await Fee.create({
        receiptNumber: generateId('RCP'),
        student: student._id,
        category: 'Transport',
        totalAssignedFee: cls.transportFee,
        feeItems: [{ type: 'Transport', description: 'Transportation Fee', amount: cls.transportFee }],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }
  } catch (_) { /* fee auto-creation failure should not block student creation */ }

  const password = gen6digit();
  const loginEmail = student.email || `${student.studentId.toLowerCase()}@student.sms.np`;
  const existingUser = await User.findOne({ email: loginEmail });
  if (!existingUser) {
    await User.create({ name: student.fullName, email: loginEmail, password, role: 'student', linkedStudent: student._id });
  }

  notify({
    title: 'New Student Enrolled',
    message: `${student.fullName} (${student.studentId}) has been enrolled.`,
    type: 'enrollment',
    audience: 'admin',
    createdBy: req.user._id,
  });

  res.status(201).json({ ...student.toObject(), generatedPassword: password, loginEmail });
});

// @desc   Get all students with filters
// @route  GET /api/students
export const getStudents = asyncHandler(async (req, res) => {
  const { search, class: classId, section, status, page = 1, limit = 50 } = req.query;
  const q = {};
  if (search) {
    q.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }
  if (classId) q.class = classId;
  if (section) q.section = section;
  if (status) q.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [students, total] = await Promise.all([
    Student.find(q).populate('class', 'name').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Student.countDocuments(q),
  ]);
  res.json({ students, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// @desc   Get single student
// @route  GET /api/students/:id
export const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate('class', 'name sections');
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  res.json(student);
});

// @desc   Update student
// @route  PUT /api/students/:id
export const updateStudent = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.photo = `/uploads/${req.file.filename}`;
  const student = await Student.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  res.json(student);
});

// @desc   Delete student
// @route  DELETE /api/students/:id
export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  res.json({ message: 'Student removed' });
});

// @desc   Reset student login password (admin)
// @route  POST /api/students/:id/reset-password
export const resetStudentPassword = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) { res.status(404); throw new Error('Student not found'); }

  const password = gen6digit();
  const loginEmail = student.email || `${student.studentId.toLowerCase()}@student.sms.np`;
  let user = await User.findOne({ linkedStudent: student._id });
  if (!user) user = await User.findOne({ email: loginEmail });
  if (!user) { res.status(404); throw new Error('No login account found for this student'); }

  user.password = password;
  await user.save();
  res.json({ password, loginEmail: user.email });
});

// @desc   Bulk import students
// @route  POST /api/students/bulk
export const bulkImportStudents = asyncHandler(async (req, res) => {
  const rows = req.body.students || [];
  const created = [];
  for (const row of rows) {
    if (!row.studentId) row.studentId = generateId('STU');
    try {
      const s = await Student.create(row);
      created.push(s);
    } catch (err) {
      // skip invalid rows
    }
  }
  res.status(201).json({ count: created.length, students: created });
});

// @desc   Promote students to next class
// @route  POST /api/students/promote
export const promoteStudents = asyncHandler(async (req, res) => {
  const { studentIds, newClassId, newSection } = req.body;
  if (!studentIds?.length || !newClassId) {
    res.status(400);
    throw new Error('studentIds and newClassId required');
  }
  const result = await Student.updateMany(
    { _id: { $in: studentIds } },
    { class: newClassId, ...(newSection ? { section: newSection } : {}) }
  );
  res.json({ modified: result.modifiedCount });
});
