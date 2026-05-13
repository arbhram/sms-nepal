import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import School from '../models/School.js';
import SuperAdmin from '../models/SuperAdmin.js';
import User from '../models/User.js';

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

// @desc   List all schools with basic stats
// @route  GET /api/superadmin/schools
export const getSchools = asyncHandler(async (_req, res) => {
  const schools = await School.find({}).sort({ createdAt: -1 }).lean();

  const withStats = await Promise.all(
    schools.map(async (school) => {
      const userCount = await User.countDocuments({ schoolId: school._id })
        .setOptions({ _skipTenant: true });
      return { ...school, userCount };
    }),
  );

  res.json(withStats);
});

// @desc   Get a single school with full details
// @route  GET /api/superadmin/schools/:id
export const getSchoolById = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id).lean();
  if (!school) { res.status(404); throw new Error('School not found'); }

  const userCount = await User.countDocuments({ schoolId: school._id })
    .setOptions({ _skipTenant: true });

  res.json({ ...school, userCount });
});

// @desc   Create a new school tenant
// @route  POST /api/superadmin/schools
export const createSchool = asyncHandler(async (req, res) => {
  const { name, subdomain, email, phone, address, timezone, currency, plan, trialDays } = req.body;
  if (!name || !subdomain) {
    res.status(400); throw new Error('name and subdomain are required');
  }

  const conflict = await School.findOne({ subdomain: subdomain.toLowerCase() });
  if (conflict) { res.status(409); throw new Error('Subdomain already taken'); }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + (trialDays || 30));

  const school = await School.create({
    name,
    subdomain: subdomain.toLowerCase(),
    email,
    phone,
    address,
    timezone: timezone || 'Asia/Kathmandu',
    currency: currency || 'NPR',
    plan: plan || 'trial',
    trialEndsAt,
    isActive: true,
  });

  res.status(201).json(school);
});

// @desc   Suspend a school (sets isActive = false)
// @route  PUT /api/superadmin/schools/:id/suspend
export const suspendSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) { res.status(404); throw new Error('School not found'); }

  school.isActive = false;
  await school.save();

  res.json({ message: `School "${school.name}" suspended`, school });
});

// @desc   Activate / unsuspend a school
// @route  PUT /api/superadmin/schools/:id/activate
export const activateSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) { res.status(404); throw new Error('School not found'); }

  school.isActive = true;
  await school.save();

  res.json({ message: `School "${school.name}" activated`, school });
});

// @desc   Verify a school's custom domain (admin triggers this after DNS check)
// @route  PUT /api/superadmin/schools/:id/verify-domain
export const verifySchoolDomain = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) { res.status(404); throw new Error('School not found'); }
  if (!school.customDomain) { res.status(400); throw new Error('No custom domain configured'); }

  school.customDomainVerified = true;
  await school.save();

  res.json({ message: 'Custom domain verified', customDomain: school.customDomain });
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
