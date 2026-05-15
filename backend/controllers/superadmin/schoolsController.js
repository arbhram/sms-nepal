import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import School from '../../models/School.js';
import User from '../../models/User.js';
import Student from '../../models/Student.js';
import Teacher from '../../models/Teacher.js';
import { audit } from '../../utils/auditLogger.js';
import { provisionSchool } from '../../services/schoolProvisioningService.js';
import upload from '../../config/upload.js';

// Fields the super admin may update on a school.
// Excludes: subdomain, isActive (use suspend/activate), _id, createdAt, schoolId.
const PATCHABLE = [
  'name', 'email', 'phone', 'address', 'city', 'plan', 'trialEndsAt',
  'customDomain', 'timezone', 'currency', 'primaryColor', 'secondaryColor',
];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

// ── helpers ──────────────────────────────────────────────────────────────────

/** Sum totalPaid across all fee documents for one school. */
async function getFeesCollected(schoolId) {
  const result = await mongoose.connection.collection('fees').aggregate([
    { $match: { schoolId } },
    { $group: { _id: null, total: { $sum: '$totalPaid' } } },
  ]).toArray();
  return result[0]?.total || 0;
}

/** Build the status filter clause from a ?status= query param. */
function statusFilter(status) {
  const now = new Date();
  switch (status) {
    case 'active':    return { isActive: true,  $or: [{ plan: { $ne: 'trial' } }, { trialEndsAt: { $gte: now } }] };
    case 'suspended': return { isActive: false };
    case 'trial':     return { isActive: true,  plan: 'trial', trialEndsAt: { $gte: now } };
    case 'expired':   return { plan: 'trial',   trialEndsAt: { $lt: now } };
    default:          return {};
  }
}

// ── GET /api/superadmin/schools ───────────────────────────────────────────────
export const getSchools = asyncHandler(async (req, res) => {
  const {
    status,
    plan,
    search,
    page  = 1,
    limit = 20,
    sortBy = '-createdAt',
  } = req.query;

  const filter = { ...statusFilter(status) };
  if (plan)   filter.plan = plan;
  if (search) {
    filter.$or = [
      { name:      { $regex: search, $options: 'i' } },
      { subdomain: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum  = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const skip     = (pageNum - 1) * limitNum;

  const sortField = sortBy.startsWith('-') ? sortBy.slice(1) : sortBy;
  const sortDir   = sortBy.startsWith('-') ? -1 : 1;

  const [total, schools] = await Promise.all([
    School.countDocuments(filter),
    School.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(limitNum).lean(),
  ]);

  // N+1 is acceptable at this scale; replace with $lookup if school count grows
  const withStats = await Promise.all(
    schools.map(async (school) => {
      const userCount = await User.countDocuments({ schoolId: school._id })
        .setOptions({ _skipTenant: true });
      return { ...school, userCount };
    }),
  );

  res.json({
    schools: withStats,
    total,
    page:  pageNum,
    limit: limitNum,
    pages: Math.ceil(total / limitNum),
  });
});

// ── GET /api/superadmin/schools/:id ──────────────────────────────────────────
export const getSchoolById = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id).lean();
  if (!school) { res.status(404); throw new Error('School not found'); }

  const sid = school._id;

  const [userCount, studentCount, teacherCount, feesCollected, lastActiveUser] = await Promise.all([
    User.countDocuments({ schoolId: sid }).setOptions({ _skipTenant: true }),
    Student.countDocuments({ schoolId: sid }).setOptions({ _skipTenant: true }),
    Teacher.countDocuments({ schoolId: sid }).setOptions({ _skipTenant: true }),
    getFeesCollected(sid),
    User.findOne({ schoolId: sid, lastLogin: { $ne: null } })
      .sort({ lastLogin: -1 })
      .select('lastLogin name email')
      .setOptions({ _skipTenant: true })
      .lean(),
  ]);

  res.json({
    ...school,
    userCount,
    studentCount,
    teacherCount,
    feesCollected,
    lastLogin: lastActiveUser?.lastLogin ?? null,
    lastLoginBy: lastActiveUser ? { name: lastActiveUser.name, email: lastActiveUser.email } : null,
  });
});

// ── PATCH /api/superadmin/schools/:id ────────────────────────────────────────
export const updateSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) { res.status(404); throw new Error('School not found'); }

  const before = {};
  const after  = {};

  for (const field of PATCHABLE) {
    if (req.body[field] === undefined) continue;
    if ((field === 'primaryColor' || field === 'secondaryColor') && !HEX_COLOR.test(req.body[field])) {
      res.status(400); throw new Error(`${field} must be a valid hex color (e.g. #0ABAB5)`);
    }
    const incoming = field === 'trialEndsAt' ? new Date(req.body[field]) : req.body[field];
    const current  = school[field];
    // Only record and apply fields that actually changed
    if (String(current) !== String(incoming)) {
      before[field] = current;
      after[field]  = incoming;
      school[field] = incoming;
    }
  }

  if (Object.keys(after).length === 0) {
    return res.json({ message: 'No changes', school });
  }

  await school.save();

  audit({
    req,
    action:     'school.updated',
    targetType: 'school',
    targetId:   school._id,
    targetName: school.name,
    schoolId:   school._id,
    changes:    { before, after },
  });

  res.json(school);
});

// ── POST /api/superadmin/schools ─────────────────────────────────────────────
export const createSchool = asyncHandler(async (req, res) => {
  const { name, subdomain, email, phone, address, timezone, currency, plan, trialDays, adminEmail, adminPassword, adminName } = req.body;

  if (!name || !subdomain)          { res.status(400); throw new Error('name and subdomain are required'); }
  if (!adminEmail || !adminPassword) { res.status(400); throw new Error('adminEmail and adminPassword are required'); }

  const conflict = await School.findOne({ subdomain: subdomain.toLowerCase() });
  if (conflict) { res.status(409); throw new Error('Subdomain already taken'); }

  const school = await provisionSchool({
    name, subdomain, email, phone, address, timezone, currency, plan, trialDays,
    adminEmail, adminPassword, adminName,
  });

  audit({
    req,
    action:     'school.created',
    targetType: 'school',
    targetId:   school._id,
    targetName: school.name,
    schoolId:   school._id,
    changes:    { after: { name: school.name, subdomain: school.subdomain, plan: school.plan } },
  });

  res.status(201).json(school);
});

// ── POST /api/superadmin/schools/:id/suspend ─────────────────────────────────
export const suspendSchool = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const school = await School.findById(req.params.id);
  if (!school) { res.status(404); throw new Error('School not found'); }
  if (!school.isActive) { res.status(400); throw new Error('School is already suspended'); }

  const before = { isActive: school.isActive };
  school.isActive = false;
  await school.save();

  audit({
    req,
    action:     'school.suspended',
    targetType: 'school',
    targetId:   school._id,
    targetName: school.name,
    schoolId:   school._id,
    changes:    { before, after: { isActive: false } },
    reason,
  });

  // Stub: send suspension email to school admin
  console.log(
    `📧 [STUB EMAIL] Would notify ${school.email || school.subdomain}: ` +
    `"Your school account has been suspended. Reason: ${reason || 'not provided'}"`,
  );

  res.json({ message: `School "${school.name}" suspended`, school });
});

// ── POST /api/superadmin/schools/:id/activate ────────────────────────────────
export const activateSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) { res.status(404); throw new Error('School not found'); }
  if (school.isActive) { res.status(400); throw new Error('School is already active'); }

  const before = { isActive: school.isActive };
  school.isActive = true;
  await school.save();

  audit({
    req,
    action:     'school.activated',
    targetType: 'school',
    targetId:   school._id,
    targetName: school.name,
    schoolId:   school._id,
    changes:    { before, after: { isActive: true } },
  });

  res.json({ message: `School "${school.name}" activated`, school });
});

// ── POST /api/superadmin/schools/:id/extend-trial ────────────────────────────
export const extendTrial = asyncHandler(async (req, res) => {
  const days = Number(req.body.days);
  if (!days || days < 1) { res.status(400); throw new Error('days must be a positive integer'); }

  const school = await School.findById(req.params.id);
  if (!school) { res.status(404); throw new Error('School not found'); }

  const before = { trialEndsAt: school.trialEndsAt, plan: school.plan };

  // Extend from current trialEndsAt if still in the future; otherwise from today
  const base = school.trialEndsAt && school.trialEndsAt > new Date()
    ? school.trialEndsAt
    : new Date();
  school.trialEndsAt = new Date(base.getTime() + days * 86_400_000);
  if (school.plan !== 'trial') school.plan = 'trial';
  await school.save();

  audit({
    req,
    action:     'school.trial_extended',
    targetType: 'school',
    targetId:   school._id,
    targetName: school.name,
    schoolId:   school._id,
    changes:    { before, after: { trialEndsAt: school.trialEndsAt, plan: school.plan } },
    reason:     `Extended by ${days} day(s)`,
  });

  res.json({ message: `Trial extended by ${days} day(s)`, trialEndsAt: school.trialEndsAt, school });
});

// ── PUT /api/superadmin/schools/:id/verify-domain ────────────────────────────
export const verifySchoolDomain = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) { res.status(404); throw new Error('School not found'); }
  if (!school.customDomain) { res.status(400); throw new Error('No custom domain configured'); }

  school.customDomainVerified = true;
  await school.save();

  audit({
    req,
    action:     'school.domain_verified',
    targetType: 'school',
    targetId:   school._id,
    targetName: school.name,
    schoolId:   school._id,
    changes:    { after: { customDomain: school.customDomain, customDomainVerified: true } },
  });

  res.json({ message: 'Custom domain verified', customDomain: school.customDomain });
});

// ── POST /api/superadmin/schools/:id/logo ────────────────────────────────────
export const uploadSchoolLogo = [
  upload.single('logo'),
  asyncHandler(async (req, res) => {
    const school = await School.findById(req.params.id);
    if (!school) { res.status(404); throw new Error('School not found'); }
    if (!req.file) { res.status(400); throw new Error('No file uploaded'); }

    // Cloudinary: req.file.path is the CDN URL; disk fallback: build a local URL
    const logoUrl = req.file.path || `/uploads/${req.file.filename}`;
    const before = { logoUrl: school.logoUrl };
    school.logoUrl = logoUrl;
    await school.save();

    audit({
      req,
      action:     'school.logo_updated',
      targetType: 'school',
      targetId:   school._id,
      targetName: school.name,
      schoolId:   school._id,
      changes:    { before, after: { logoUrl } },
    });

    res.json({ logoUrl, school });
  }),
];

// ── DELETE /api/superadmin/schools/:id ───────────────────────────────────────
export const softDeleteSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) { res.status(404); throw new Error('School not found'); }
  if (school.deletedAt) { res.status(400); throw new Error('School is already deleted'); }

  school.deletedAt = new Date();
  school.isActive  = false;
  await school.save();

  audit({
    req,
    action:     'school.deleted',
    targetType: 'school',
    targetId:   school._id,
    targetName: school.name,
    schoolId:   school._id,
    reason:     req.body.reason,
    changes:    { after: { deletedAt: school.deletedAt, isActive: false } },
  });

  res.json({ message: `School "${school.name}" soft-deleted`, school });
});

// ── POST /api/superadmin/schools/:id/restore ─────────────────────────────────
export const restoreSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) { res.status(404); throw new Error('School not found'); }
  if (!school.deletedAt) { res.status(400); throw new Error('School is not deleted'); }

  school.deletedAt = null;
  school.isActive  = true;
  await school.save();

  audit({
    req,
    action:     'school.restored',
    targetType: 'school',
    targetId:   school._id,
    targetName: school.name,
    schoolId:   school._id,
    changes:    { after: { deletedAt: null, isActive: true } },
  });

  res.json({ message: `School "${school.name}" restored`, school });
});
