import express from 'express';
import {
  createExam,
  getExams,
  getExam,
  updateExam,
  deleteExam,
  submitResult,
  getResults,
  getStudentResults,
} from '../controllers/examController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router
  .route('/')
  .get(getExams)
  .post(authorize('superadmin', 'admin'), createExam);

router.get('/student/:studentId', getStudentResults);

router
  .route('/:id')
  .get(getExam)
  .put(authorize('superadmin', 'admin'), updateExam)
  .delete(authorize('superadmin', 'admin'), deleteExam);

router
  .route('/:id/results')
  .get(getResults)
  .post(authorize('superadmin', 'admin', 'teacher'), submitResult);

export default router;
