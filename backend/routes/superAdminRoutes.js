import express from 'express';
import rateLimit from 'express-rate-limit';
import { superAdminLogin, getMetrics, getAuditLog } from '../controllers/superAdminController.js';
import {
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  suspendSchool,
  activateSchool,
  extendTrial,
  verifySchoolDomain,
  uploadSchoolLogo,
  softDeleteSchool,
  restoreSchool,
} from '../controllers/superadmin/schoolsController.js';
import {
  getSchoolUsers,
  resetUserPassword,
  updateSchoolUser,
} from '../controllers/superadmin/usersController.js';
import { superAdminAuth, requireRole } from '../middleware/superAdminAuth.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Try again after 15 minutes.' },
});

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/login', loginLimiter, superAdminLogin);

// ── All routes below require super admin auth ─────────────────────────────────
router.use(superAdminAuth);

// Metrics and audit log — read-only, all roles can access
router.get('/metrics',   getMetrics);
router.get('/audit-log', getAuditLog);

// Schools — read access for all roles, write restricted
router.get('/schools',     getSchools);
router.post('/schools',    requireRole('owner', 'admin'), createSchool);
router.get('/schools/:id',   getSchoolById);
router.patch('/schools/:id', requireRole('owner', 'admin'), updateSchool);

router.post('/schools/:id/suspend',      requireRole('owner', 'admin'), suspendSchool);
router.post('/schools/:id/activate',     requireRole('owner', 'admin'), activateSchool);
router.post('/schools/:id/extend-trial', requireRole('owner', 'admin'), extendTrial);
router.put('/schools/:id/verify-domain', requireRole('owner', 'admin'), verifySchoolDomain);
router.post('/schools/:id/logo',         requireRole('owner', 'admin'), ...uploadSchoolLogo);
router.delete('/schools/:id',            requireRole('owner'),          softDeleteSchool);
router.post('/schools/:id/restore',      requireRole('owner'),          restoreSchool);

// Users within a school
router.get('/schools/:id/users',                                               getSchoolUsers);
router.post('/schools/:id/users/:userId/reset-password', requireRole('owner', 'admin'), resetUserPassword);
router.patch('/schools/:id/users/:userId',               requireRole('owner', 'admin'), updateSchoolUser);

export default router;
