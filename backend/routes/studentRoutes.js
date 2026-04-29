import express from 'express';
import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents,
  promoteStudents,
  resetStudentPassword,
} from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../config/upload.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getStudents)
  .post(authorize('superadmin', 'admin'), upload.single('photo'), createStudent);

router.post('/bulk', authorize('superadmin', 'admin'), bulkImportStudents);
router.post('/promote', authorize('superadmin', 'admin'), promoteStudents);

router
  .route('/:id')
  .get(getStudent)
  .put(authorize('superadmin', 'admin'), upload.single('photo'), updateStudent)
  .delete(authorize('superadmin', 'admin'), deleteStudent);

router.post('/:id/reset-password', authorize('superadmin', 'admin'), resetStudentPassword);

export default router;
