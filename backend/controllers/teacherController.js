import asyncHandler from 'express-async-handler';
import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import { generateId } from '../utils/helpers.js';
import { notifyTeacher, notify } from '../utils/notify.js';

const gen6digit = () => Math.floor(100000 + Math.random() * 900000).toString();

export const createTeacher = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!data.teacherId) data.teacherId = generateId('TCH');
  if (req.file) data.photo = `/uploads/${req.file.filename}`;
  const teacher = await Teacher.create(data);

  const password = gen6digit();
  const loginEmail = teacher.email || `${teacher.teacherId.toLowerCase()}@teacher.sms.np`;
  const existingUser = await User.findOne({ email: loginEmail });
  if (!existingUser) {
    await User.create({ name: teacher.fullName, email: loginEmail, password, role: 'teacher', linkedTeacher: teacher._id });
  }

  notify({
    title: 'New Teacher Added',
    message: `${teacher.fullName} (${teacher.subject}) has been added as a teacher.`,
    type: 'enrollment',
    audience: 'admin',
    createdBy: req.user._id,
  });

  res.status(201).json({ ...teacher.toObject(), generatedPassword: password, loginEmail });
});

export const getTeachers = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const q = {};
  if (search) {
    q.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { teacherId: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
    ];
  }
  if (status) q.status = status;
  const teachers = await Teacher.find(q).populate('assignedClasses', 'name').sort({ createdAt: -1 });
  res.json(teachers);
});

export const getTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id).populate('assignedClasses');
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }
  res.json(teacher);
});

export const updateTeacher = asyncHandler(async (req, res) => {
  const prev = await Teacher.findById(req.params.id).lean();
  const data = { ...req.body };
  if (req.file) data.photo = `/uploads/${req.file.filename}`;
  const teacher = await Teacher.findByIdAndUpdate(req.params.id, data, { new: true }).populate('assignedClasses', 'name');
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  const prevIds = (prev?.assignedClasses || []).map(String).sort().join();
  const newIds = (data.assignedClasses || []).map(String).sort().join();
  if (newIds && prevIds !== newIds) {
    const classNames = teacher.assignedClasses.map((c) => c.name).join(', ');
    notifyTeacher({
      teacherId: teacher._id,
      title: 'New Class Assigned',
      message: `You have been assigned to: ${classNames}.`,
      type: 'class_assigned',
    });
  }

  res.json(teacher);
});

export const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByIdAndDelete(req.params.id);
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }
  res.json({ message: 'Teacher removed' });
});

export const resetTeacherPassword = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) { res.status(404); throw new Error('Teacher not found'); }

  const password = gen6digit();
  const loginEmail = teacher.email || `${teacher.teacherId.toLowerCase()}@teacher.sms.np`;
  let user = await User.findOne({ linkedTeacher: teacher._id });
  if (!user) user = await User.findOne({ email: loginEmail });
  if (!user) { res.status(404); throw new Error('No login account found for this teacher'); }

  user.password = password;
  await user.save();
  res.json({ password, loginEmail: user.email });
});
