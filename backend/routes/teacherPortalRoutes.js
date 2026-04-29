import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getMyProfile, getMyStudents, getMyExams, getMyAttendance } from '../controllers/teacherPortalController.js';

const router = express.Router();
router.use(protect, authorize('teacher'));

router.get('/profile', getMyProfile);
router.get('/students', getMyStudents);
router.get('/exams', getMyExams);
router.get('/attendance', getMyAttendance);

export default router;
