import mongoose from 'mongoose';
import Journal from '../models/Journal.js';
import Account from '../models/Account.js';
import { nextJournalNumber } from '../utils/sequence.js';
import { currentAcademicYear } from '../utils/nepaliDate.js';

/**
 * Validate and post a journal entry.
 * All financial operations must go through this — never create Journal documents directly.
 *
 * @param {Object} data
 * @param {mongoose.ClientSession} session  — required for transactional safety
 */
export async function postJournal(data, session) {
  const {
    type, source, sourceRef, sourceModel,
    date, narration, academicYear, lines,
    reversalOf, createdBy,
  } = data;

  if (!lines || lines.length < 2) {
    throw new Error('A journal entry requires at least two lines');
  }

  // ── 1. Validate double-entry balance ──────────────────────────────────────
  let totalDebit  = 0;
  let totalCredit = 0;
  for (const line of lines) {
    if (line.type === 'debit')  totalDebit  += line.amount;
    if (line.type === 'credit') totalCredit += line.amount;
  }
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Journal imbalanced: debits ${totalDebit} ≠ credits ${totalCredit}`);
  }

  // ── 2. Validate all accounts exist and are postable (not group accounts) ───
  const accountIds = [...new Set(lines.map(l => l.account.toString()))];
  const accounts = await Account.find({ _id: { $in: accountIds } }).session(session);
  const accountMap = {};
  for (const a of accounts) accountMap[a._id.toString()] = a;

  for (const line of lines) {
    const acct = accountMap[line.account.toString()];
    if (!acct) throw new Error(`Account not found: ${line.account}`);
    if (acct.isGroup) throw new Error(`Cannot post to group account: ${acct.name} (${acct.code})`);
    if (!acct.isActive) throw new Error(`Account is inactive: ${acct.name}`);
    // Enrich line with denormalized fields
    line.accountCode = acct.code;
    line.accountName = acct.name;
  }

  // ── 3. Generate journal number ─────────────────────────────────────────────
  const year = academicYear || currentAcademicYear();
  const journalNumber = await nextJournalNumber(year, session);

  // ── 4. Create journal ──────────────────────────────────────────────────────
  const [journal] = await Journal.create([{
    journalNumber,
    type,
    source,
    sourceRef:   sourceRef   || null,
    sourceModel: sourceModel || '',
    date:        date        || new Date(),
    narration,
    academicYear: year,
    status:      'posted',
    reversalOf:  reversalOf  || null,
    totalDebit:  Math.round(totalDebit  * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    lines,
    createdBy,
    postedBy:  createdBy,
    postedAt:  new Date(),
  }], { session });

  return journal;
}

/**
 * Reverse a posted journal.
 * Creates a new journal that mirrors the original with flipped debits/credits.
 * The original journal is marked as reversed — it is NEVER deleted or modified.
 */
export async function reverseJournal(journalId, { date, narration, createdBy } = {}, session) {
  const original = await Journal.findById(journalId).session(session);
  if (!original)                  throw new Error('Journal not found');
  if (original.status !== 'posted') throw new Error('Only posted journals can be reversed');
  if (original.reversedBy)          throw new Error('Journal has already been reversed');

  const reversedLines = original.lines.map(l => ({
    account:     l.account,
    accountCode: l.accountCode,
    accountName: l.accountName,
    type:        l.type === 'debit' ? 'credit' : 'debit',
    amount:      l.amount,
    description: `Reversal: ${l.description || ''}`,
    student:     l.student,
    teacher:     l.teacher,
    costCenter:  l.costCenter,
  }));

  const reversal = await postJournal({
    type:        'reversal',
    source:      'reversal',
    sourceRef:   original._id,
    sourceModel: 'Journal',
    date:        date || new Date(),
    narration:   narration || `Reversal of ${original.journalNumber}`,
    academicYear: original.academicYear,
    reversalOf:  original._id,
    lines:       reversedLines,
    createdBy,
  }, session);

  // Mark original as reversed (immutable record still exists)
  await Journal.findByIdAndUpdate(original._id, { reversedBy: reversal._id, status: 'reversed' }, { session });

  return reversal;
}

/**
 * Get the balance of an account by aggregating all posted journal lines.
 * NEVER reads a stored balance — always computed from source of truth.
 */
export async function getAccountBalance(accountId, { academicYear, fromDate, toDate } = {}) {
  const match = {
    'lines.account': new mongoose.Types.ObjectId(accountId),
    status: 'posted',
  };
  if (academicYear)       match.academicYear = academicYear;
  if (fromDate || toDate) {
    match.date = {};
    if (fromDate) match.date.$gte = new Date(fromDate);
    if (toDate)   match.date.$lte = new Date(toDate);
  }

  const result = await Journal.aggregate([
    { $match: match },
    { $unwind: '$lines' },
    { $match: { 'lines.account': new mongoose.Types.ObjectId(accountId) } },
    { $group: { _id: '$lines.type', total: { $sum: '$lines.amount' } } },
  ]);

  const debits  = result.find(r => r._id === 'debit')?.total  || 0;
  const credits = result.find(r => r._id === 'credit')?.total || 0;

  const account = await Account.findById(accountId);
  if (!account) return 0;

  // Assets & Expenses: normal balance = debit (debit increases)
  // Liabilities, Equity, Revenue: normal balance = credit
  return account.normalBalance === 'debit'
    ? debits - credits
    : credits - debits;
}

/**
 * Get account ledger — all journal lines for an account, in date order.
 */
export async function getAccountLedger(accountId, { academicYear, fromDate, toDate, page = 1, limit = 100 } = {}) {
  const match = {
    'lines.account': new mongoose.Types.ObjectId(accountId),
    status: 'posted',
  };
  if (academicYear) match.academicYear = academicYear;
  if (fromDate || toDate) {
    match.date = {};
    if (fromDate) match.date.$gte = new Date(fromDate);
    if (toDate)   match.date.$lte = new Date(toDate);
  }

  const entries = await Journal.aggregate([
    { $match: match },
    { $unwind: '$lines' },
    { $match: { 'lines.account': new mongoose.Types.ObjectId(accountId) } },
    { $project: {
      journalNumber: 1,
      date: 1,
      narration: 1,
      source: 1,
      'lines.type': 1,
      'lines.amount': 1,
      'lines.description': 1,
    }},
    { $sort: { date: 1, createdAt: 1 } },
    { $skip:  (page - 1) * limit },
    { $limit: limit },
  ]);

  // Add running balance
  const account = await Account.findById(accountId);
  let runningBalance = 0;
  for (const entry of entries) {
    const isDebit = entry.lines.type === 'debit';
    if (account.normalBalance === 'debit') {
      runningBalance += isDebit ? entry.lines.amount : -entry.lines.amount;
    } else {
      runningBalance += isDebit ? -entry.lines.amount : entry.lines.amount;
    }
    entry.runningBalance = Math.round(runningBalance * 100) / 100;
  }

  return entries;
}
