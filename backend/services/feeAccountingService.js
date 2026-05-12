import Account from '../models/Account.js';
import { postJournal, reverseJournal } from './journalService.js';
import { CATEGORY_REVENUE_MAP, METHOD_ACCOUNT_MAP } from '../seeders/seedAccounts.js';
import { currentAcademicYear } from '../utils/nepaliDate.js';

/**
 * Resolve an account code to its ObjectId.
 * Throws if the account doesn't exist or is inactive.
 */
async function resolveAccount(code, session) {
  const acct = await Account.findOne({ code, isActive: true }).session(session);
  if (!acct) throw new Error(`Account ${code} not found — run seed first`);
  return acct._id;
}

/**
 * Post the receivable journal when a fee invoice is created.
 *   Dr  1150  Accounts Receivable (Student Fees)  netFee
 *   Cr  4xxx  Revenue account (by category)        netFee
 */
export async function postInvoiceJournal({ fee, createdBy }, session) {
  const netFee = Math.max(0, fee.totalAssignedFee - (fee.discount || 0));
  if (netFee <= 0) return null;

  const revenueCode = CATEGORY_REVENUE_MAP[fee.category] || '4110';
  const [arId, revId] = await Promise.all([
    resolveAccount('1150', session),
    resolveAccount(revenueCode, session),
  ]);

  const studentName = fee.student?.fullName || fee.student?.toString() || '';

  return postJournal({
    type:        'automatic',
    source:      'fee_invoice',
    sourceRef:   fee._id,
    sourceModel: 'Fee',
    date:        fee.createdAt || new Date(),
    narration:   `${fee.category} fee invoice — ${studentName} (${fee.month || fee.academicYear})`,
    academicYear: currentAcademicYear(),
    lines: [
      { account: arId,  type: 'debit',  amount: netFee, description: `AR: ${studentName}`, student: fee.student?._id || fee.student },
      { account: revId, type: 'credit', amount: netFee, description: `${fee.category} revenue` },
    ],
    createdBy,
  }, session);
}

/**
 * Post the cash receipt journal when a payment is recorded.
 *   Dr  1110/1120/1140  Cash / Bank / Wallet  amount
 *   Cr  1150            Accounts Receivable    amount
 */
export async function postPaymentJournal({ fee, payment, createdBy }, session) {
  if (!payment.amount || payment.amount <= 0) return null;

  const cashCode = METHOD_ACCOUNT_MAP[payment.paymentMethod] || '1110';
  const [cashId, arId] = await Promise.all([
    resolveAccount(cashCode, session),
    resolveAccount('1150', session),
  ]);

  const studentName = fee.student?.fullName || fee.student?.toString() || '';

  return postJournal({
    type:        'automatic',
    source:      'fee_payment',
    sourceRef:   fee._id,
    sourceModel: 'Fee',
    date:        payment.paidDate || new Date(),
    narration:   `Fee payment — ${studentName} (${payment.receiptNumber})`,
    academicYear: currentAcademicYear(),
    lines: [
      { account: cashId, type: 'debit',  amount: payment.amount, description: `${payment.paymentMethod}: ${payment.receiptNumber}` },
      { account: arId,   type: 'credit', amount: payment.amount, description: `AR cleared: ${studentName}`, student: fee.student?._id || fee.student },
    ],
    createdBy,
  }, session);
}

/**
 * Reverse the payment journal when a payment is deleted.
 */
export async function reversePaymentJournal(journalId, createdBy, session) {
  if (!journalId) return null;
  return reverseJournal(
    journalId,
    { narration: 'Payment reversal — payment deleted', createdBy },
    session,
  );
}

/**
 * Reverse the invoice journal when a fee record is deleted.
 */
export async function reverseInvoiceJournal(journalId, createdBy, session) {
  if (!journalId) return null;
  return reverseJournal(
    journalId,
    { narration: 'Invoice reversal — fee record deleted', createdBy },
    session,
  );
}
