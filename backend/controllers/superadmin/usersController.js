import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import School from '../../models/School.js';
import { audit } from '../../utils/auditLogger.js';

/** Generate a readable 12-char random password (base64url chars: A-Z a-z 0-9 - _). */
function generateTempPassword() {
  return crypto.randomBytes(9).toString('base64url').slice(0, 12);
}

// ── GET /api/superadmin/schools/:id/users ────────────────────────────────────
export const getSchoolUsers = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const school = await School.findById(id).lean();
  if (!school) { res.status(404); throw new Error('School not found'); }

  const users = await User.find({ schoolId: new mongoose.Types.ObjectId(id) })
    .setOptions({ _skipTenant: true })
    .select('-password')
    .sort({ role: 1, name: 1 })
    .lean();

  res.json(users);
});

// ── POST /api/superadmin/schools/:id/users/:userId/reset-password ─────────────
export const resetUserPassword = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;

  const school = await School.findById(id).lean();
  if (!school) { res.status(404); throw new Error('School not found'); }

  const user = await User.findOne({
    _id:      new mongoose.Types.ObjectId(userId),
    schoolId: new mongoose.Types.ObjectId(id),
  }).setOptions({ _skipTenant: true });
  if (!user) { res.status(404); throw new Error('User not found in this school'); }

  const tempPassword = generateTempPassword();

  // Assign plaintext — pre-save hook hashes it. Never pre-hash here.
  user.password = tempPassword;
  await user.save();

  // Stub: wire Resend here when email service is ready
  console.log(
    `📧 [STUB EMAIL] Would send to ${user.email}: ` +
    `"Your password was reset by Wephas Support. Temporary password: ${tempPassword} — change it on first login."`,
  );

  audit({
    req,
    action:     'user.password_reset',
    targetType: 'user',
    targetId:   user._id,
    targetName: user.email,
    schoolId:   new mongoose.Types.ObjectId(id),
    reason:     req.body.reason,
  });

  res.json({
    tempPassword,
    expiresMessage: 'This will not be shown again. Share it with the user and ask them to change it on first login.',
  });
});

// ── PATCH /api/superadmin/schools/:id/users/:userId ──────────────────────────
export const updateSchoolUser = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    res.status(400); throw new Error('isActive must be a boolean');
  }

  const school = await School.findById(id).lean();
  if (!school) { res.status(404); throw new Error('School not found'); }

  const user = await User.findOne({
    _id:      new mongoose.Types.ObjectId(userId),
    schoolId: new mongoose.Types.ObjectId(id),
  }).setOptions({ _skipTenant: true });
  if (!user) { res.status(404); throw new Error('User not found in this school'); }

  const before = { isActive: user.isActive };
  user.isActive = isActive;
  await user.save();

  audit({
    req,
    action:     isActive ? 'user.enabled' : 'user.disabled',
    targetType: 'user',
    targetId:   user._id,
    targetName: user.email,
    schoolId:   new mongoose.Types.ObjectId(id),
    changes:    { before, after: { isActive } },
  });

  res.json({ message: `User ${isActive ? 'enabled' : 'disabled'}`, user: { ...user.toObject(), password: undefined } });
});
