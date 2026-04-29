import express from 'express';
import {
  createTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  resetTeacherPassword,
} from '../controllers/teacherController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../config/upload.js';

const router = express.Router();
router.use(protect);

router
  .route('/')
  .get(getTeachers)
  .post(authorize('superadmin', 'admin'), upload.single('photo'), createTeacher);

router
  .route('/:id')
  .get(getTeacher)
  .put(authorize('superadmin', 'admin'), upload.single('photo'), updateTeacher)
  .delete(authorize('superadmin', 'admin'), deleteTeacher);

router.post('/:id/reset-password', authorize('superadmin', 'admin'), resetTeacherPassword);

export default router;
