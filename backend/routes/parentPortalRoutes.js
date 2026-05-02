import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getMyChildren, getChildProfile, getChildFees,
  getChildAttendance, getChildExams, getChildResults,
} from '../controllers/parentPortalController.js';

const router = express.Router();
router.use(protect, authorize('parent'));

router.get('/children', getMyChildren);
router.get('/children/:studentId/profile', getChildProfile);
router.get('/children/:studentId/fees', getChildFees);
router.get('/children/:studentId/attendance', getChildAttendance);
router.get('/children/:studentId/exams', getChildExams);
router.get('/children/:studentId/results', getChildResults);

export default router;
