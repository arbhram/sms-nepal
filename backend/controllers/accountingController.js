import mongoose from 'mongoose';
import Account from '../models/Account.js';
import Journal from '../models/Journal.js';
import Fee from '../models/Fee.js';
import { getAccountBalance, getAccountLedger, postJournal, reverseJournal } from '../services/journalService.js';
import { postInvoiceJournal, postPaymentJournal } from '../services/feeAccountingService.js';
import { currentAcademicYear } from '../utils/nepaliDate.js';
import { seedAccounts } from '../seeders/seedAccounts.js';

// ── Chart of Accounts ─────────────────────────────────────────────────────────

export async function getAccounts(_req, res) {
  try {
    const accounts = await Account.find({ isActive: true })
      .populate('parent', 'code name')
      .sort({ code: 1 });
    res.json(accounts);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function createAccount(req, res) {
  try {
    const { code, name, type, subtype, normalBalance, parent, isGroup, description } = req.body;
    const account = await Account.create({ code, name, type, subtype, normalBalance, parent: parent || null, isGroup: isGroup || false, description });
    res.status(201).json(account);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Account code already exists' });
    res.status(500).json({ message: err.message });
  }
}

export async function updateAccount(req, res) {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ message: 'Not found' });
    if (account.isSystem && (req.body.code || req.body.type)) {
      return res.status(400).json({ message: 'Cannot change code or type of a system account' });
    }
    const allowed = ['name', 'description', 'isActive', 'parent'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) account[key] = req.body[key];
    }
    await account.save();
    res.json(account);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function deleteAccount(req, res) {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ message: 'Not found' });
    if (account.isSystem) return res.status(400).json({ message: 'System accounts cannot be deleted' });

    // Check if account has journal entries
    const hasEntries = await Journal.exists({ 'lines.account': account._id, status: 'posted' });
    if (hasEntries) return res.status(400).json({ message: 'Cannot delete account with journal entries. Deactivate it instead.' });

    await account.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function seedCOA(_req, res) {
  try {
    await seedAccounts();
    res.json({ message: 'Chart of Accounts seeded successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

// ── Account Ledger ────────────────────────────────────────────────────────────

export async function getLedger(req, res) {
  try {
    const { id } = req.params;
    const { academicYear, fromDate, toDate, page = 1, limit = 100 } = req.query;
    const account = await Account.findById(id);
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const entries = await getAccountLedger(id, {
      academicYear: academicYear || currentAcademicYear(),
      fromDate, toDate,
      page: Number(page), limit: Number(limit),
    });

    const balance = await getAccountBalance(id, {
      academicYear: academicYear || currentAcademicYear(),
      fromDate, toDate,
    });

    res.json({ account, entries, closingBalance: balance });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

// ── Trial Balance ─────────────────────────────────────────────────────────────

export async function getTrialBalance(req, res) {
  try {
    const { academicYear, fromDate, toDate } = req.query;
    const year = academicYear || currentAcademicYear();

    const match = { status: 'posted', academicYear: year };
    if (fromDate || toDate) {
      match.date = {};
      if (fromDate) match.date.$gte = new Date(fromDate);
      if (toDate)   match.date.$lte = new Date(toDate);
    }

    const rows = await Journal.aggregate([
      { $match: match },
      { $unwind: '$lines' },
      { $group: {
        _id: {
          account:     '$lines.account',
          accountCode: '$lines.accountCode',
          accountName: '$lines.accountName',
          type:        '$lines.type',
        },
        total: { $sum: '$lines.amount' },
      }},
      { $group: {
        _id: {
          account:     '$_id.account',
          accountCode: '$_id.accountCode',
          accountName: '$_id.accountName',
        },
        debit:  { $sum: { $cond: [{ $eq: ['$_id.type', 'debit']  }, '$total', 0] } },
        credit: { $sum: { $cond: [{ $eq: ['$_id.type', 'credit'] }, '$total', 0] } },
      }},
      { $sort: { '_id.accountCode': 1 } },
    ]);

    const totalDebit  = rows.reduce((s, r) => s + r.debit,  0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
    const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.01;

    res.json({ rows, totalDebit, totalCredit, isBalanced, academicYear: year });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

// ── Profit & Loss ─────────────────────────────────────────────────────────────

export async function getProfitLoss(req, res) {
  try {
    const { academicYear, fromDate, toDate } = req.query;
    const year = academicYear || currentAcademicYear();

    const match = { status: 'posted', academicYear: year };
    if (fromDate || toDate) {
      match.date = {};
      if (fromDate) match.date.$gte = new Date(fromDate);
      if (toDate)   match.date.$lte = new Date(toDate);
    }

    const accounts = await Account.find({ type: { $in: ['revenue', 'expense'] }, isGroup: false, isActive: true }).sort({ code: 1 });
    const accountIds = accounts.map(a => a._id);

    const balances = await Journal.aggregate([
      { $match: { ...match, 'lines.account': { $in: accountIds } } },
      { $unwind: '$lines' },
      { $match: { 'lines.account': { $in: accountIds } } },
      { $group: {
        _id: '$lines.account',
        debit:  { $sum: { $cond: [{ $eq: ['$lines.type', 'debit']  }, '$lines.amount', 0] } },
        credit: { $sum: { $cond: [{ $eq: ['$lines.type', 'credit'] }, '$lines.amount', 0] } },
      }},
    ]);

    const balanceMap = {};
    for (const b of balances) balanceMap[b._id.toString()] = b;

    const revenue  = [];
    const expenses = [];
    let totalRevenue  = 0;
    let totalExpenses = 0;

    for (const acct of accounts) {
      const b = balanceMap[acct._id.toString()] || { debit: 0, credit: 0 };
      const balance = acct.normalBalance === 'credit' ? b.credit - b.debit : b.debit - b.credit;
      if (balance === 0) continue;

      const row = { _id: acct._id, code: acct.code, name: acct.name, balance };
      if (acct.type === 'revenue')  { revenue.push(row);  totalRevenue  += balance; }
      if (acct.type === 'expense')  { expenses.push(row); totalExpenses += balance; }
    }

    res.json({
      revenue, totalRevenue,
      expenses, totalExpenses,
      netSurplus: totalRevenue - totalExpenses,
      academicYear: year,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

// ── Balance Sheet ─────────────────────────────────────────────────────────────

export async function getBalanceSheet(req, res) {
  try {
    const { academicYear, asOf } = req.query;
    const year = academicYear || currentAcademicYear();

    // Base match — account 3300 is always computed dynamically (never directly posted)
    const baseMatch = { status: 'posted', academicYear: year };
    if (asOf) baseMatch.date = { $lte: new Date(asOf) };

    // ── Balance sheet accounts (exclude 3300 — computed below) ────────────────
    const bsAccounts = await Account.find({
      type: { $in: ['asset', 'liability', 'equity'] },
      isGroup: false, isActive: true, code: { $ne: '3300' },
    }).sort({ code: 1 });
    const bsIds = bsAccounts.map(a => a._id);

    const bsBalances = await Journal.aggregate([
      { $match: { ...baseMatch, 'lines.account': { $in: bsIds } } },
      { $unwind: '$lines' },
      { $match: { 'lines.account': { $in: bsIds } } },
      { $group: {
        _id: '$lines.account',
        debit:  { $sum: { $cond: [{ $eq: ['$lines.type', 'debit']  }, '$lines.amount', 0] } },
        credit: { $sum: { $cond: [{ $eq: ['$lines.type', 'credit'] }, '$lines.amount', 0] } },
      }},
    ]);

    const bsMap = {};
    for (const b of bsBalances) bsMap[b._id.toString()] = b;

    const assets      = [];
    const liabilities = [];
    const equity      = [];
    let totalAssets = 0, totalLiabilities = 0, totalEquity = 0;

    for (const acct of bsAccounts) {
      const b = bsMap[acct._id.toString()] || { debit: 0, credit: 0 };
      const balance = acct.normalBalance === 'debit' ? b.debit - b.credit : b.credit - b.debit;
      const row = { _id: acct._id, code: acct.code, name: acct.name, balance };
      if (acct.type === 'asset')     { assets.push(row);      totalAssets      += balance; }
      if (acct.type === 'liability') { liabilities.push(row); totalLiabilities += balance; }
      if (acct.type === 'equity')    { equity.push(row);      totalEquity      += balance; }
    }

    // ── Current Year Earnings — computed dynamically from P&L accounts ─────────
    const plAccounts = await Account.find({
      type: { $in: ['revenue', 'expense'] }, isGroup: false, isActive: true,
    });
    const plIds = plAccounts.map(a => a._id);

    const plBalances = await Journal.aggregate([
      { $match: { ...baseMatch, 'lines.account': { $in: plIds } } },
      { $unwind: '$lines' },
      { $match: { 'lines.account': { $in: plIds } } },
      { $group: {
        _id: '$lines.account',
        debit:  { $sum: { $cond: [{ $eq: ['$lines.type', 'debit']  }, '$lines.amount', 0] } },
        credit: { $sum: { $cond: [{ $eq: ['$lines.type', 'credit'] }, '$lines.amount', 0] } },
      }},
    ]);

    const plMap = {};
    for (const b of plBalances) plMap[b._id.toString()] = b;

    let currentYearRevenue = 0, currentYearExpenses = 0;
    for (const acct of plAccounts) {
      const b = plMap[acct._id.toString()] || { debit: 0, credit: 0 };
      const bal = acct.normalBalance === 'credit' ? b.credit - b.debit : b.debit - b.credit;
      if (acct.type === 'revenue') currentYearRevenue  += bal;
      if (acct.type === 'expense') currentYearExpenses += bal;
    }

    const currentYearEarnings = currentYearRevenue - currentYearExpenses;
    if (Math.abs(currentYearEarnings) > 0.01) {
      equity.push({
        code: '3300',
        name: currentYearEarnings >= 0 ? 'Current Year Surplus' : 'Current Year Deficit',
        balance: currentYearEarnings,
        isVirtual: true,
      });
      totalEquity += currentYearEarnings;
    }

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const difference = totalAssets - totalLiabilitiesAndEquity;

    res.json({
      assets, totalAssets,
      liabilities, totalLiabilities,
      equity, totalEquity,
      totalLiabilitiesAndEquity,
      isBalanced: Math.abs(difference) < 0.01,
      difference,
      currentYearRevenue, currentYearExpenses, currentYearEarnings,
      academicYear: year, asOf: asOf || null,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

// ── Manual Journal Entry ──────────────────────────────────────────────────────

export async function createManualJournal(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { date, narration, academicYear, lines } = req.body;
    const journal = await postJournal({
      type: 'manual',
      source: 'manual',
      date: date || new Date(),
      narration,
      academicYear: academicYear || currentAcademicYear(),
      lines,
      createdBy: req.user._id,
    }, session);

    await session.commitTransaction();
    res.status(201).json(journal);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message });
  } finally { session.endSession(); }
}

export async function reverseJournalEntry(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { date, narration } = req.body;
    const reversal = await reverseJournal(req.params.id, { date, narration, createdBy: req.user._id }, session);
    await session.commitTransaction();
    res.json(reversal);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message });
  } finally { session.endSession(); }
}

export async function getJournals(req, res) {
  try {
    const { academicYear, source, page = 1, limit = 50 } = req.query;
    const filter = { status: { $ne: 'draft' } };
    if (academicYear) filter.academicYear = academicYear;
    if (source)       filter.source       = source;

    const [journals, total] = await Promise.all([
      Journal.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Journal.countDocuments(filter),
    ]);

    res.json({ journals, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function getJournal(req, res) {
  try {
    const journal = await Journal.findById(req.params.id)
      .populate('lines.account', 'code name type')
      .populate('createdBy', 'name')
      .populate('reversalOf', 'journalNumber')
      .populate('reversedBy', 'journalNumber');
    if (!journal) return res.status(404).json({ message: 'Not found' });
    res.json(journal);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

// ── AR Aging Report ───────────────────────────────────────────────────────────

export async function getArAging(req, res) {
  try {
    const { academicYear } = req.query;
    const q = { status: { $in: ['Unpaid', 'Partial'] } };
    if (academicYear) q.academicYear = academicYear;

    const fees = await Fee.find(q)
      .populate('student', 'fullName studentId class section')
      .lean();

    const now = Date.now();
    const buckets = { current: [], days30: [], days60: [], days90: [], over90: [] };
    let totalCurrent = 0, total30 = 0, total60 = 0, total90 = 0, totalOver90 = 0;

    for (const fee of fees) {
      const balance = fee.remainingBalance;
      if (balance <= 0) continue;
      const dueDate = fee.dueDate ? new Date(fee.dueDate) : new Date(fee.createdAt);
      const ageDays = Math.floor((now - dueDate.getTime()) / 86400000);

      const row = {
        feeId:       fee._id,
        student:     fee.student,
        category:    fee.category,
        month:       fee.month,
        dueDate:     fee.dueDate,
        balance,
        ageDays,
      };

      if (ageDays <= 0)       { buckets.current.push(row); totalCurrent += balance; }
      else if (ageDays <= 30) { buckets.days30.push(row);  total30      += balance; }
      else if (ageDays <= 60) { buckets.days60.push(row);  total60      += balance; }
      else if (ageDays <= 90) { buckets.days90.push(row);  total90      += balance; }
      else                    { buckets.over90.push(row);  totalOver90  += balance; }
    }

    res.json({
      buckets,
      summary: {
        current:  { count: buckets.current.length,  total: totalCurrent },
        days30:   { count: buckets.days30.length,   total: total30 },
        days60:   { count: buckets.days60.length,   total: total60 },
        days90:   { count: buckets.days90.length,   total: total90 },
        over90:   { count: buckets.over90.length,   total: totalOver90 },
        grandTotal: totalCurrent + total30 + total60 + total90 + totalOver90,
      },
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

// ── Fee Journal Backfill ──────────────────────────────────────────────────────
// Run once after seeding COA to retroactively journal all pre-existing fees.

export async function backfillFeeJournals(_req, res) {
  let invoiced = 0, payments = 0, errors = 0;

  // Fees without an invoice journal
  const fees = await Fee.find({
    $or: [{ invoiceJournalRef: null }, { invoiceJournalRef: { $exists: false } }],
    totalAssignedFee: { $gt: 0 },
  }).populate('student', 'fullName');

  for (const fee of fees) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const journal = await postInvoiceJournal({ fee, createdBy: null }, session);
      if (journal) {
        fee.invoiceJournalRef = journal._id;
        await fee.save({ session });
        invoiced++;
      }
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      errors++;
    } finally { session.endSession(); }
  }

  // Payments without a journal ref
  const feesWithPayments = await Fee.find({
    'payments.0': { $exists: true },
  }).populate('student', 'fullName');

  for (const fee of feesWithPayments) {
    for (const payment of fee.payments) {
      if (payment.journalRef) continue;
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const journal = await postPaymentJournal({ fee, payment, createdBy: null }, session);
        if (journal) {
          payment.journalRef = journal._id;
          await fee.save({ session });
          payments++;
        }
        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        errors++;
      } finally { session.endSession(); }
    }
  }

  res.json({ message: 'Backfill complete', invoiced, payments, errors });
}
