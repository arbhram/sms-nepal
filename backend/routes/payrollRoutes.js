import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getPayrolls, getPayroll,
  createPayroll, updatePayroll, deletePayroll,
  accruePayrollEntry, disbursePayrollEntry,
  getTeacherPayrollHistory,
} from '../controllers/payrollController.js';

const router = express.Router();
const adminOnly = authorize('superadmin', 'admin');

router.use(protect);

router.get('/',                        getPayrolls);
router.post('/',     adminOnly,        createPayroll);
router.get('/:id',                     getPayroll);
router.put('/:id',   adminOnly,        updatePayroll);
router.delete('/:id', adminOnly,       deletePayroll);
router.post('/:id/accrue',             adminOnly, accruePayrollEntry);
router.post('/:id/disburse',           adminOnly, disbursePayrollEntry);
router.get('/teacher/:teacherId',      getTeacherPayrollHistory);

export default router;
