import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getConfig, updateConfig, upgradeAcademicYear } from '../controllers/systemConfigController.js';

const router = express.Router();
const admin  = authorize('superadmin', 'admin');

router.get ('/',              protect, getConfig);
router.put ('/',              protect, admin, updateConfig);
router.post('/upgrade-year',  protect, admin, upgradeAcademicYear);

export default router;
