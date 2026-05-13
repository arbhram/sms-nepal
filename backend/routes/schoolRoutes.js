import express from 'express';
import {
  getCurrentSchool,
  getSchoolSettings,
  updateSchoolSettings,
  setCustomDomain,
  verifyCustomDomain,
} from '../controllers/schoolController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public — no auth required, called on app load to get branding
router.get('/current', getCurrentSchool);

// Admin-only school settings
router.get('/settings', protect, authorize('admin', 'superadmin'), getSchoolSettings);
router.put('/settings', protect, authorize('admin', 'superadmin'), updateSchoolSettings);
router.put('/custom-domain', protect, authorize('admin', 'superadmin'), setCustomDomain);
router.post('/custom-domain/verify', protect, authorize('admin', 'superadmin'), verifyCustomDomain);

export default router;
