import express from 'express';
import {
  createNotification,
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/').get(getNotifications).post(authorize('superadmin', 'admin'), createNotification);
router.get('/unread-count', getUnreadCount);
router.put('/mark-all-read', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', authorize('superadmin', 'admin'), deleteNotification);

export default router;
