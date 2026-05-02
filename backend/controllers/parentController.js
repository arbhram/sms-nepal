import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import User from '../models/User.js';

export const getParents = asyncHandler(async (_req, res) => {
  const parents = await User.find({ role: 'parent' })
    .populate('linkedStudents', 'fullName studentId')
    .select('-password')
    .sort({ createdAt: -1 });
  res.json(parents);
});

export const createParent = asyncHandler(async (req, res) => {
  const { name, email, phone, linkedStudents = [] } = req.body;
  if (!name || !email) { res.status(400); throw new Error('Name and email are required'); }
  if (await User.findOne({ email })) { res.status(400); throw new Error('Email already in use'); }
  const password = crypto.randomBytes(5).toString('hex');
  const user = await User.create({ name, email, phone, password, role: 'parent', linkedStudents });
  res.status(201).json({ _id: user._id, name: user.name, email: user.email, password });
});

export const updateParent = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'parent' });
  if (!user) { res.status(404); throw new Error('Parent not found'); }
  const { name, email, phone, linkedStudents } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (linkedStudents !== undefined) user.linkedStudents = linkedStudents;
  await user.save();
  const updated = await User.findById(user._id)
    .populate('linkedStudents', 'fullName studentId')
    .select('-password');
  res.json(updated);
});

export const deleteParent = asyncHandler(async (req, res) => {
  const user = await User.findOneAndDelete({ _id: req.params.id, role: 'parent' });
  if (!user) { res.status(404); throw new Error('Parent not found'); }
  res.json({ message: 'Parent removed' });
});

export const resetParentPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'parent' });
  if (!user) { res.status(404); throw new Error('Parent not found'); }
  const password = crypto.randomBytes(5).toString('hex');
  user.password = password;
  await user.save();
  res.json({ loginEmail: user.email, password });
});
