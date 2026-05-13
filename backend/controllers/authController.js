import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import School from '../models/School.js';
import { generateToken } from '../utils/helpers.js';

const REGISTERABLE_ROLES = ['admin', 'teacher', 'student', 'parent'];

// @desc   Register a user within a school (admin/superadmin only)
// @route  POST /api/auth/register
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  const schoolId = req.user?.schoolId || req.body.schoolId;

  const exists = await User.findOne({ email, schoolId }).setOptions({ _skipTenant: true });
  if (exists) { res.status(400); throw new Error('Email already registered in this school'); }

  const assignedRole = REGISTERABLE_ROLES.includes(role) ? role : 'admin';
  const user = await User.create({ name, email, password, phone, role: assignedRole, schoolId });

  res.status(201).json({
    _id: user._id, name: user.name, email: user.email, role: user.role,
    token: generateToken(user._id, schoolId),
  });
});

// @desc   Login — tenant identified by subdomain (req.school set by tenantResolver)
// @route  POST /api/auth/login
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password, schoolCode } = req.body;

  // Primary: school resolved from subdomain by tenantResolver middleware
  // Fallback: schoolCode in body (backward-compat for clients not yet on subdomain routing)
  let school = req.school;
  if (!school && schoolCode) {
    school = await School.findOne({ subdomain: schoolCode.toLowerCase(), isActive: true });
  }
  if (!school) {
    res.status(400);
    throw new Error('Cannot identify school. Visit your school\'s URL to log in.');
  }

  if (school.plan === 'trial' && school.trialEndsAt < new Date()) {
    res.status(403); throw new Error('Trial period expired — contact support to continue.');
  }

  // Bypass tenant plugin — no AsyncLocalStorage context exists at login time
  const user = await User.findOne({ email: email?.toLowerCase(), schoolId: school._id })
    .setOptions({ _skipTenant: true });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401); throw new Error('Invalid email or password');
  }
  if (!user.isActive) { res.status(403); throw new Error('Account is disabled. Contact administrator.'); }

  res.json({
    _id: user._id, name: user.name, email: user.email,
    role: user.role, avatar: user.avatar,
    schoolId: school._id, schoolCode: school.subdomain, schoolName: school.name,
    token: generateToken(user._id, school._id),
  });
});

// @desc   Get current user
// @route  GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// @desc   Update profile
// @route  PUT /api/auth/me
export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.name   = req.body.name   || user.name;
  user.phone  = req.body.phone  || user.phone;
  user.avatar = req.body.avatar || user.avatar;
  const updated = await user.save();
  res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role });
});

// @desc   Change own password
// @route  PUT /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400); throw new Error('currentPassword and newPassword are required');
  }
  const user = await User.findById(req.user._id);
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401); throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

// @desc   List users in current school
// @route  GET /api/auth/users
export const getUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  res.json(users);
});
