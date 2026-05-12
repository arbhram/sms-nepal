import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getAccounts, createAccount, updateAccount, deleteAccount, seedCOA,
  getLedger,
  getTrialBalance,
  getProfitLoss,
  getBalanceSheet,
  getArAging,
  backfillFeeJournals,
  createManualJournal, reverseJournalEntry, getJournals, getJournal,
} from '../controllers/accountingController.js';

const adminOnly = authorize('superadmin', 'admin');

const router = express.Router();

router.use(protect);

// Chart of Accounts
router.get('/accounts',          getAccounts);
router.post('/accounts',         adminOnly, createAccount);
router.put('/accounts/:id',      adminOnly, updateAccount);
router.delete('/accounts/:id',   adminOnly, deleteAccount);
router.post('/accounts/seed',    adminOnly, seedCOA);

// Ledger
router.get('/ledger/:id',        getLedger);

// Reports
router.get('/trial-balance',     getTrialBalance);
router.get('/profit-loss',       getProfitLoss);
router.get('/balance-sheet',     getBalanceSheet);
router.get('/ar-aging',          getArAging);
router.post('/backfill-journals', adminOnly, backfillFeeJournals);

// Journals
router.get('/journals',          getJournals);
router.post('/journals',         adminOnly, createManualJournal);
router.get('/journals/:id',      getJournal);
router.post('/journals/:id/reverse', adminOnly, reverseJournalEntry);

export default router;
