import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  getUsers,
  changePassword,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts from this IP. Please try again after 15 minutes.' },
});

router.post('/login', loginLimiter, loginUser);
router.post('/register', protect, authorize('superadmin', 'admin'), registerUser);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/change-password', protect, changePassword);
router.get('/users', protect, authorize('superadmin', 'admin'), getUsers);

export default router;
