import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getMyProfile, getMyFees, getMyAttendance, getMyResults, getMyExams } from '../controllers/studentPortalController.js';

const router = express.Router();
router.use(protect, authorize('student'));

router.get('/profile', getMyProfile);
router.get('/fees', getMyFees);
router.get('/attendance', getMyAttendance);
router.get('/exams', getMyExams);
router.get('/results', getMyResults);

export default router;
