import asyncHandler from 'express-async-handler';
import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import { generateId } from '../utils/helpers.js';

// ─── Assign fee ───────────────────────────────────────────────────────────────
// POST /api/fees
export const createFee = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!data.receiptNumber) data.receiptNumber = generateId('RCP');
  if (!data.academicYear) data.academicYear = `${new Date().getFullYear()}`;
  const fee = await Fee.create(data);
  res.status(201).json(fee);
});

// ─── List fees ────────────────────────────────────────────────────────────────
// GET /api/fees
export const getFees = asyncHandler(async (req, res) => {
  const { student, status, category, month, academicYear, classId, section, page = 1, limit = 50 } = req.query;
  const q = {};
  if (student) q.student = student;
  if (status) q.status = status;
  if (category) q.category = category;
  if (month) q.month = month;
  if (academicYear) q.academicYear = academicYear;

  if (classId || section) {
    const sq = {};
    if (classId) sq.class = classId;
    if (section) sq.section = section;
    const sids = await Student.find(sq, '_id').lean();
    q.student = { $in: sids.map((s) => s._id) };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [fees, total] = await Promise.all([
    Fee.find(q)
      .populate('student', 'fullName studentId class section')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Fee.countDocuments(q),
  ]);
  res.json({ fees, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// ─── Single fee ───────────────────────────────────────────────────────────────
// GET /api/fees/:id
export const getFee = asyncHandler(async (req, res) => {
  const fee = await Fee.findById(req.params.id)
    .populate('student', 'fullName studentId class section')
    .populate('payments.recordedBy', 'name');
  if (!fee) { res.status(404); throw new Error('Fee record not found'); }
  res.json(fee);
});

// ─── Update fee assignment (NOT payments) ─────────────────────────────────────
// PUT /api/fees/:id
export const updateFee = asyncHandler(async (req, res) => {
  const fee = await Fee.findById(req.params.id);
  if (!fee) { res.status(404); throw new Error('Fee record not found'); }
  // Only allow updating assignment fields — never touch payments via this route
  const { totalAssignedFee, discount, category, dueDate, month, remarks, feeItems } = req.body;
  if (totalAssignedFee !== undefined) fee.totalAssignedFee = Number(totalAssignedFee);
  if (discount !== undefined) fee.discount = Number(discount);
  if (category) fee.category = category;
  if (dueDate !== undefined) fee.dueDate = dueDate;
  if (month !== undefined) fee.month = month;
  if (remarks !== undefined) fee.remarks = remarks;
  if (feeItems !== undefined) fee.feeItems = feeItems;
  await fee.save(); // pre-save recalculates everything
  res.json(fee);
});

// ─── Delete fee record ────────────────────────────────────────────────────────
// DELETE /api/fees/:id
export const deleteFee = asyncHandler(async (req, res) => {
  const fee = await Fee.findById(req.params.id);
  if (!fee) { res.status(404); throw new Error('Fee record not found'); }
  await fee.deleteOne();
  res.json({ message: 'Fee record deleted' });
});

// ─── Add payment ──────────────────────────────────────────────────────────────
// POST /api/fees/:id/payment
export const addPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod = 'Cash', paidDate, remarks } = req.body;

  const fee = await Fee.findById(req.params.id).populate('student', 'fullName studentId class');
  if (!fee) { res.status(404); throw new Error('Fee record not found'); }
  if (!fee.totalAssignedFee) { res.status(400); throw new Error('No fee amount assigned to this record'); }

  const payAmount = Number(amount);
  if (!payAmount || payAmount <= 0) {
    res.status(400); throw new Error('Payment amount must be a positive number');
  }
  if (payAmount > fee.remainingBalance + 0.01) { // 0.01 epsilon for float safety
    res.status(400);
    throw new Error(`Payment of NPR ${payAmount} exceeds remaining balance of NPR ${fee.remainingBalance}`);
  }

  const payReceiptNumber = generateId('PMT');
  fee.payments.push({
    amount: payAmount,
    paymentMethod,
    paidDate: paidDate ? new Date(paidDate) : new Date(),
    receiptNumber: payReceiptNumber,
    remarks: remarks || '',
    recordedBy: req.user._id,
  });

  await fee.save(); // pre-save atomically recalculates totalPaid, remainingBalance, status

  res.json({
    fee,
    receipt: {
      receiptNumber: payReceiptNumber,
      studentName: fee.student?.fullName,
      studentId: fee.student?.studentId,
      category: fee.category,
      month: fee.month,
      amountPaid: payAmount,
      totalAssignedFee: fee.totalAssignedFee,
      discount: fee.discount,
      totalPaid: fee.totalPaid,
      remainingBalance: fee.remainingBalance,
      paymentMethod,
      date: new Date(),
      status: fee.status,
    },
  });
});

// ─── Delete a single payment ──────────────────────────────────────────────────
// DELETE /api/fees/:id/payment/:paymentId
export const deletePayment = asyncHandler(async (req, res) => {
  const fee = await Fee.findById(req.params.id);
  if (!fee) { res.status(404); throw new Error('Fee record not found'); }

  const idx = fee.payments.findIndex((p) => p._id.toString() === req.params.paymentId);
  if (idx === -1) { res.status(404); throw new Error('Payment entry not found'); }

  fee.payments.splice(idx, 1);
  await fee.save();
  await fee.populate('student', 'fullName studentId class section');

  res.json({ message: 'Payment removed and totals recalculated', fee });
});

// ─── Student fee summary ──────────────────────────────────────────────────────
// GET /api/fees/student/:studentId
export const getStudentFeeSummary = asyncHandler(async (req, res) => {
  const { academicYear } = req.query;
  const q = { student: req.params.studentId };
  if (academicYear) q.academicYear = academicYear;

  const fees = await Fee.find(q).sort({ createdAt: -1 });

  const totalAssigned = fees.reduce((s, f) => s + Math.max(0, f.totalAssignedFee - f.discount), 0);
  const totalPaid = fees.reduce((s, f) => s + f.totalPaid, 0);
  const remainingBalance = totalAssigned - totalPaid;

  res.json({
    fees,
    summary: {
      totalAssigned,
      totalPaid,
      remainingBalance,
      status: totalPaid === 0 ? 'Unpaid' : remainingBalance <= 0 ? 'Paid' : 'Partial',
    },
  });
});

// ─── Bulk assign fee to a class ───────────────────────────────────────────────
// POST /api/fees/bulk-assign
export const bulkAssignFee = asyncHandler(async (req, res) => {
  const { classId, section, category, totalAssignedFee, dueDate, month, feeItems, academicYear } = req.body;
  if (!classId || !totalAssignedFee) {
    res.status(400); throw new Error('classId and totalAssignedFee are required');
  }
  const q = { class: classId, status: 'active' };
  if (section) q.section = section;
  const students = await Student.find(q, '_id');
  if (!students.length) {
    res.status(404); throw new Error('No active students found in this class/section');
  }

  const year = academicYear || `${new Date().getFullYear()}`;
  const fees = students.map((s) => ({
    receiptNumber: generateId('RCP'),
    student: s._id,
    academicYear: year,
    category: category || 'Monthly',
    totalAssignedFee: Number(totalAssignedFee),
    feeItems: feeItems || [],
    dueDate: dueDate || undefined,
    month: month || undefined,
  }));

  const result = await Fee.insertMany(fees);
  res.status(201).json({ count: result.length, message: `Fee assigned to ${result.length} students` });
});

// ─── Dashboard summary ────────────────────────────────────────────────────────
// GET /api/fees/summary
export const feeSummary = asyncHandler(async (_, res) => {
  const [collected, pending, byCategory] = await Promise.all([
    Fee.aggregate([{ $group: { _id: null, total: { $sum: '$totalPaid' } } }]),
    Fee.aggregate([
      { $match: { status: { $in: ['Unpaid', 'Partial'] } } },
      { $group: { _id: null, total: { $sum: '$remainingBalance' } } },
    ]),
    Fee.aggregate([
      { $group: { _id: '$category', totalPaid: { $sum: '$totalPaid' }, count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    totalCollected: collected[0]?.total || 0,
    totalPending: pending[0]?.total || 0,
    byCategory,
  });
});
