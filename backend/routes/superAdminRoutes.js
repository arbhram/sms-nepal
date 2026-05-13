import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  superAdminLogin,
  getSchools,
  getSchoolById,
  createSchool,
  suspendSchool,
  activateSchool,
  verifySchoolDomain,
  getMetrics,
} from '../controllers/superAdminController.js';
import { superAdminAuth } from '../middleware/superAdminAuth.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Try again after 15 minutes.' },
});

router.post('/login', loginLimiter, superAdminLogin);

// All routes below require super admin auth
router.use(superAdminAuth);

router.get('/metrics', getMetrics);
router.get('/schools', getSchools);
router.post('/schools', createSchool);
router.get('/schools/:id', getSchoolById);
router.put('/schools/:id/suspend', suspendSchool);
router.put('/schools/:id/activate', activateSchool);
router.put('/schools/:id/verify-domain', verifySchoolDomain);

export default router;
