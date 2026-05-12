import Account from '../models/Account.js';
import { postJournal, reverseJournal } from './journalService.js';
import { METHOD_ACCOUNT_MAP, resolveExpenseCode } from '../seeders/seedAccounts.js';
import { currentAcademicYear } from '../utils/nepaliDate.js';

async function resolveAccount(code, session) {
  const acct = await Account.findOne({ code, isActive: true }).session(session);
  if (!acct) throw new Error(`Account ${code} not found — run seed first`);
  return acct._id;
}

/**
 * Post expense journal when a Transaction of type='expense' is created.
 *   Dr  5xxx  Expense account (by category)   amount
 *   Cr  1110/1120/1140  Cash / Bank / Wallet   amount
 */
export async function postExpenseJournal({ tx, createdBy }, session) {
  if (tx.type !== 'expense' || !tx.amount || tx.amount <= 0) return null;

  const expenseCode = resolveExpenseCode(tx.category);
  const cashCode    = METHOD_ACCOUNT_MAP[tx.paymentMethod] || '1110';

  const [expId, cashId] = await Promise.all([
    resolveAccount(expenseCode, session),
    resolveAccount(cashCode, session),
  ]);

  return postJournal({
    type:        'automatic',
    source:      'expense',
    sourceRef:   tx._id,
    sourceModel: 'Transaction',
    date:        tx.date || new Date(),
    narration:   tx.description || tx.category,
    academicYear: currentAcademicYear(),
    lines: [
      { account: expId,  type: 'debit',  amount: tx.amount, description: tx.category },
      { account: cashId, type: 'credit', amount: tx.amount, description: `${tx.paymentMethod}: ${tx.reference || ''}` },
    ],
    createdBy,
  }, session);
}

export async function reverseExpenseJournal(journalId, createdBy, session) {
  if (!journalId) return null;
  return reverseJournal(
    journalId,
    { narration: 'Expense reversal — transaction deleted', createdBy },
    session,
  );
}
