import express from 'express';
import { createNotice, getNotices, deleteNotice } from '../controllers/noticeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(getNotices)
  .post(authorize('superadmin', 'admin'), createNotice);

router.delete('/:id', authorize('superadmin', 'admin'), deleteNotice);

export default router;
