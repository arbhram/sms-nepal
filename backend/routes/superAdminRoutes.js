import express from 'express';
import rateLimit from 'express-rate-limit';
import { superAdminLogin, getMetrics } from '../controllers/superAdminController.js';
import {
  getSchools,
  getSchoolById,
  createSchool,
  suspendSchool,
  activateSchool,
  extendTrial,
  verifySchoolDomain,
} from '../controllers/superadmin/schoolsController.js';
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

// Metrics — read-only, all roles can access
router.get('/metrics', getMetrics);

// Schools — read access for all roles, write restricted
router.get('/schools',     getSchools);
router.post('/schools',    requireRole('owner', 'admin'), createSchool);
router.get('/schools/:id', getSchoolById);

router.post('/schools/:id/suspend',      requireRole('owner', 'admin'), suspendSchool);
router.post('/schools/:id/activate',     requireRole('owner', 'admin'), activateSchool);
router.post('/schools/:id/extend-trial', requireRole('owner', 'admin'), extendTrial);
router.put('/schools/:id/verify-domain', requireRole('owner', 'admin'), verifySchoolDomain);

export default router;
