import express from 'express';
import {
  createFee,
  getFees,
  getFee,
  updateFee,
  deleteFee,
  addPayment,
  deletePayment,
  getStudentFeeSummary,
  bulkAssignFee,
  feeSummary,
} from '../controllers/feeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

// Static routes first (before /:id to avoid conflicts)
router.get('/summary', feeSummary);
router.post('/bulk-assign', authorize('superadmin', 'admin'), bulkAssignFee);
router.get('/student/:studentId', getStudentFeeSummary);

// Fee CRUD
router
  .route('/')
  .get(getFees)
  .post(authorize('superadmin', 'admin'), createFee);

// Payment operations
router.post('/:id/payment', authorize('superadmin', 'admin'), addPayment);
router.delete('/:id/payment/:paymentId', authorize('superadmin', 'admin'), deletePayment);

// Fee record CRUD
router
  .route('/:id')
  .get(getFee)
  .put(authorize('superadmin', 'admin'), updateFee)
  .delete(authorize('superadmin', 'admin'), deleteFee);

export default router;
