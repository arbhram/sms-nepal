import mongoose from 'mongoose';
import Payroll from '../models/Payroll.js';
import { createPayrollRun, accruePayroll, disbursePayroll } from '../services/payrollService.js';
import { currentAcademicYear } from '../utils/nepaliDate.js';

export async function getPayrolls(req, res) {
  try {
    const { academicYear, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (academicYear) filter.academicYear = academicYear;
    if (status)       filter.status       = status;

    const [payrolls, total] = await Promise.all([
      Payroll.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('createdBy', 'name'),
      Payroll.countDocuments(filter),
    ]);
    res.json({ payrolls, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function getPayroll(req, res) {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('lines.teacher', 'fullName employeeId')
      .populate('createdBy', 'name')
      .populate('accrualJournalRef', 'journalNumber')
      .populate('paymentJournalRef', 'journalNumber');
    if (!payroll) return res.status(404).json({ message: 'Not found' });
    res.json(payroll);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function createPayroll(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { month, academicYear, teacherIds, overrides } = req.body;
    const payroll = await createPayrollRun({
      month,
      academicYear: academicYear || currentAcademicYear(),
      teacherIds,
      overrides: overrides || {},
      createdBy: req.user._id,
    }, session);
    await session.commitTransaction();
    res.status(201).json(payroll);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message });
  } finally { session.endSession(); }
}

export async function accruePayrollEntry(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const journal = await accruePayroll(req.params.id, { createdBy: req.user._id }, session);
    await session.commitTransaction();
    res.json({ message: 'Payroll accrued', journal });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message });
  } finally { session.endSession(); }
}

export async function disbursePayrollEntry(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { paymentMethod, paidDate } = req.body;
    const journal = await disbursePayroll(req.params.id, {
      paymentMethod,
      paidDate: paidDate ? new Date(paidDate) : undefined,
      createdBy: req.user._id,
    }, session);
    await session.commitTransaction();
    res.json({ message: 'Payroll disbursed', journal });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message });
  } finally { session.endSession(); }
}

export async function updatePayroll(req, res) {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ message: 'Not found' });
    if (payroll.status !== 'draft') return res.status(400).json({ message: 'Only draft payrolls can be edited' });

    const { lines, notes } = req.body;
    if (lines) {
      payroll.lines = lines;
      payroll.totalGross      = lines.reduce((s, l) => s + (l.basicSalary || 0) + (l.allowances || 0), 0);
      payroll.totalDeductions = lines.reduce((s, l) => s + (l.deductions || 0) + (l.tds || 0) + (l.pf || 0), 0);
      payroll.totalNet        = lines.reduce((s, l) => s + (l.netSalary || 0), 0);
    }
    if (notes !== undefined) payroll.notes = notes;
    await payroll.save();
    res.json(payroll);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function getTeacherPayrollHistory(req, res) {
  try {
    const { teacherId } = req.params;
    const { academicYear } = req.query;
    const filter = { 'lines.teacher': teacherId, status: { $ne: 'draft' } };
    if (academicYear) filter.academicYear = academicYear;

    const payrolls = await Payroll.find(filter).sort({ createdAt: -1 });
    const history = payrolls.map(p => {
      const line = p.lines.find(l => l.teacher.toString() === teacherId);
      return {
        _id: p._id,
        payrollNumber: p.payrollNumber,
        month: p.month,
        academicYear: p.academicYear,
        status: p.status,
        paidDate: p.paidDate,
        paymentMethod: p.paymentMethod,
        line,
      };
    }).filter(h => h.line);

    res.json(history);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

export async function deletePayroll(req, res) {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) return res.status(404).json({ message: 'Not found' });
    if (payroll.status !== 'draft') return res.status(400).json({ message: 'Only draft payrolls can be deleted' });
    await payroll.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
}
