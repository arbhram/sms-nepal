import express from 'express';
import {
  createNotification,
  getNotifications,
  markRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router
  .route('/')
  .get(getNotifications)
  .post(authorize('superadmin', 'admin'), createNotification);

router.put('/:id/read', markRead);
router.delete('/:id', authorize('superadmin', 'admin'), deleteNotification);

export default router;
