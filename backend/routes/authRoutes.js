import express from 'express';
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

router.post('/login', loginUser);
router.post('/register', protect, authorize('superadmin', 'admin'), registerUser);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/change-password', protect, changePassword);
router.get('/users', protect, authorize('superadmin', 'admin'), getUsers);

export default router;
