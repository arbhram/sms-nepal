import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../config/upload.js';
import {
  getTransactions,
  getSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController.js';

const router = express.Router();

router.use(protect, authorize('superadmin', 'admin'));

router.get('/summary', getSummary);
router.get('/', getTransactions);
router.post('/', upload.single('attachment'), createTransaction);
router.put('/:id', upload.single('attachment'), updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
