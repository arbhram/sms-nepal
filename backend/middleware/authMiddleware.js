import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import School from '../models/School.js';
import { tenantContext } from '../tenant/context.js';

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer')
    ? req.headers.authorization.split(' ')[1]
    : null;

  if (!token) { res.status(401); throw new Error('Not authorized, no token'); }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.status(401); throw new Error('Not authorized, token failed');
  }

  // Reject pre-migration tokens that don't carry a schoolId claim
  if (!decoded.schoolId) {
    res.status(401); throw new Error('Please log in again');
  }

  // Load user — bypass tenant plugin because context is not established yet
  const user = await User.findById(decoded.id)
    .setOptions({ _skipTenant: true })
    .select('-password');
  if (!user) { res.status(401); throw new Error('User not found'); }
  if (!user.isActive) { res.status(403); throw new Error('Account is disabled'); }

  // Verify the user still belongs to the school claimed in the token
  if (!user.schoolId || user.schoolId.toString() !== decoded.schoolId.toString()) {
    res.status(401); throw new Error('Please log in again');
  }

  // Verify the token's school matches the subdomain's school (anti-replay across subdomains).
  // req.school is set by tenantResolver for all tenant routes.
  if (req.school && req.school._id.toString() !== decoded.schoolId.toString()) {
    res.status(401); throw new Error('Token is not valid for this school');
  }

  // Use school already resolved by tenantResolver if available; avoids a second DB hit.
  const school = req.school || await School.findById(decoded.schoolId);
  if (!school) { res.status(403); throw new Error('School not found'); }
  if (!school.isActive) { res.status(403); throw new Error('School is suspended. Contact support.'); }
  if (school.plan === 'trial' && school.trialEndsAt < new Date()) {
    res.status(403); throw new Error('Trial period expired — contact support to continue.');
  }

  req.user     = user;
  req.schoolId = user.schoolId;
  req.school   = school;

  tenantContext.run(
    { schoolId: user.schoolId, userId: user._id, role: user.role },
    next,
  );
});

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role '${req.user.role}' is not authorized to access this resource`);
  }
  next();
};
