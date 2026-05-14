import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import School from '../models/School.js';
import SuperAdmin from '../models/SuperAdmin.js';
import User from '../models/User.js';

// School lifecycle and provisioning are handled in controllers/superadmin/schoolsController.js

// @desc   Super admin login
// @route  POST /api/superadmin/login
export const superAdminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400); throw new Error('email and password are required');
  }

  const admin = await SuperAdmin.findOne({ email: email.toLowerCase() });
  if (!admin || !(await admin.matchPassword(password))) {
    res.status(401); throw new Error('Invalid email or password');
  }
  if (!admin.isActive) {
    res.status(403); throw new Error('Account is disabled');
  }

  const token = jwt.sign(
    { id: admin._id, isSuperAdmin: true },
    process.env.SUPER_ADMIN_JWT_SECRET,
    { expiresIn: '12h' },
  );

  res.json({
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    token,
  });
});

// @desc   Platform-level metrics
// @route  GET /api/superadmin/metrics
export const getMetrics = asyncHandler(async (_req, res) => {
  const [totalSchools, activeSchools, trialSchools, totalUsers] = await Promise.all([
    School.countDocuments({}),
    School.countDocuments({ isActive: true }),
    School.countDocuments({ plan: 'trial', isActive: true }),
    User.countDocuments({}).setOptions({ _skipTenant: true }),
  ]);

  res.json({ totalSchools, activeSchools, trialSchools, totalUsers });
});
