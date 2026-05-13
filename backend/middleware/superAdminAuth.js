import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import SuperAdmin from '../models/SuperAdmin.js';

export const superAdminAuth = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer')
    ? req.headers.authorization.split(' ')[1]
    : null;

  if (!token) { res.status(401); throw new Error('Not authorized, no token'); }

  let decoded;
  try {
    // Deliberately uses a SEPARATE secret from school-user JWTs so a school
    // user token can never be replayed against the super-admin API.
    decoded = jwt.verify(token, process.env.SUPER_ADMIN_JWT_SECRET);
  } catch {
    res.status(401); throw new Error('Not authorized, token failed');
  }

  if (!decoded.isSuperAdmin) {
    res.status(401); throw new Error('Not a super-admin token');
  }

  const admin = await SuperAdmin.findById(decoded.id);
  if (!admin || !admin.isActive) {
    res.status(401); throw new Error('Super admin account not found or disabled');
  }

  req.superAdmin = admin;
  next();
});
