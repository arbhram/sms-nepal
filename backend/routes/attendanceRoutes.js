import express from 'express';
import {
  bulkMarkAttendance,
  getAttendance,
  updateAttendance,
  getClassReport,
  studentAttendanceSummary,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/report', getClassReport);
router.get('/', getAttendance);
router.post('/bulk', authorize('superadmin', 'admin', 'teacher'), bulkMarkAttendance);
router.get('/student/:id/summary', studentAttendanceSummary);
router.put('/:id', authorize('superadmin', 'admin', 'teacher'), updateAttendance);

export default router;
