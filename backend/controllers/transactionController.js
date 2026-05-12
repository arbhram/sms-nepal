import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';
import Transaction from '../models/Transaction.js';
import { postExpenseJournal, reverseExpenseJournal } from '../services/expenseAccountingService.js';

const parseFile = (file) => {
  if (!file) return null;
  // Cloudinary returns a full https URL in file.path; disk storage returns a local path
  return file.path?.startsWith('http') ? file.path : `/${file.path.replace(/\\/g, '/')}`;
};

// GET /api/transactions
export const getTransactions = asyncHandler(async (req, res) => {
  const { type, category, startDate, endDate, page = 1, limit = 200 } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'name'),
    Transaction.countDocuments(filter),
  ]);
  res.json({ transactions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// GET /api/transactions/summary
export const getSummary = asyncHandler(async (req, res) => {
  const y = Number(req.query.year) || new Date().getFullYear();
  const [totals, monthly] = await Promise.all([
    Transaction.aggregate([
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { date: { $gte: new Date(`${y}-01-01`), $lte: new Date(`${y}-12-31`) } } },
      { $group: { _id: { month: { $month: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
      { $sort: { '_id.month': 1 } },
    ]),
  ]);

  const totalIncome = totals.find((t) => t._id === 'income')?.total || 0;
  const totalExpense = totals.find((t) => t._id === 'expense')?.total || 0;

  const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expense: 0 }));
  monthly.forEach(({ _id, total }) => {
    const m = months[_id.month - 1];
    if (m) m[_id.type] = total;
  });

  res.json({ totalIncome, totalExpense, net: totalIncome - totalExpense, monthly: months });
});

// POST /api/transactions
export const createTransaction = asyncHandler(async (req, res) => {
  const items = req.body.items ? JSON.parse(req.body.items) : [];
  const amount = items.length > 0
    ? items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0)
    : Number(req.body.amount);

  const session = await mongoose.startSession();
  session.startTransaction();
  let tx;
  try {
    [tx] = await Transaction.create([{
      type: req.body.type,
      amount,
      category: req.body.category,
      description: req.body.description || '',
      date: req.body.date,
      paymentMethod: req.body.paymentMethod || 'Cash',
      reference: req.body.reference || '',
      items,
      attachmentUrl: parseFile(req.file) || '',
      createdBy: req.user._id,
    }], { session });

    // Journal only for expense; income (fee collection etc.) is handled elsewhere
    if (tx.type === 'expense') {
      try {
        const journal = await postExpenseJournal({ tx, createdBy: req.user._id }, session);
        if (journal) {
          tx.journalRef = journal._id;
          await tx.save({ session });
        }
      } catch (journalErr) {
        console.warn('Expense journal skipped:', journalErr.message);
      }
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  res.status(201).json(tx);
});

// PUT /api/transactions/:id
export const updateTransaction = asyncHandler(async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx) { res.status(404); throw new Error('Transaction not found'); }

  const items = req.body.items ? JSON.parse(req.body.items) : [];
  const amount = items.length > 0
    ? items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0)
    : Number(req.body.amount);

  tx.type = req.body.type ?? tx.type;
  tx.amount = amount;
  tx.category = req.body.category ?? tx.category;
  tx.description = req.body.description ?? tx.description;
  tx.date = req.body.date ?? tx.date;
  tx.paymentMethod = req.body.paymentMethod ?? tx.paymentMethod;
  tx.reference = req.body.reference ?? tx.reference;
  tx.items = items;
  // Only overwrite attachment if a new file was uploaded; keep old URL otherwise
  if (req.file) tx.attachmentUrl = parseFile(req.file);

  await tx.save();
  res.json(tx);
});

// DELETE /api/transactions/:id
export const deleteTransaction = asyncHandler(async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx) { res.status(404); throw new Error('Transaction not found'); }

  if (tx.journalRef) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await reverseExpenseJournal(tx.journalRef, req.user._id, session);
      await tx.deleteOne({ session });
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } else {
    await tx.deleteOne();
  }

  res.json({ message: 'Deleted' });
});
