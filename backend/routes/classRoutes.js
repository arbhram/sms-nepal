import express from 'express';
import {
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
} from '../controllers/classController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router
  .route('/')
  .get(getClasses)
  .post(authorize('superadmin', 'admin'), createClass);

router
  .route('/:id')
  .get(getClass)
  .put(authorize('superadmin', 'admin'), updateClass)
  .delete(authorize('superadmin', 'admin'), deleteClass);

export default router;
