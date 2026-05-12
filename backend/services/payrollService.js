import mongoose from 'mongoose';
import Payroll from '../models/Payroll.js';
import Teacher from '../models/Teacher.js';
import Account from '../models/Account.js';
import { postJournal } from './journalService.js';
import { nextPayrollNumber } from '../utils/sequence.js';
import { currentAcademicYear } from '../utils/nepaliDate.js';
import { METHOD_ACCOUNT_MAP } from '../seeders/seedAccounts.js';

async function resolveAccount(code, session) {
  const acct = await Account.findOne({ code, isActive: true }).session(session);
  if (!acct) throw new Error(`Account ${code} not found — run seed first`);
  return acct._id;
}

/**
 * Create a payroll run in draft state.
 * Pulls basicSalary from each Teacher document; caller can override per-line.
 */
export async function createPayrollRun({ month, academicYear, teacherIds, overrides = {}, createdBy }, session) {
  const year = academicYear || currentAcademicYear();

  const teachers = await Teacher.find(
    teacherIds ? { _id: { $in: teacherIds } } : { status: 'active' },
    'fullName salary',
  ).session(session);

  if (!teachers.length) throw new Error('No active teachers found');

  const lines = teachers.map(t => {
    const o = overrides[t._id.toString()] || {};
    const basicSalary = o.basicSalary ?? t.salary ?? 0;
    const allowances  = o.allowances  ?? 0;
    const deductions  = o.deductions  ?? 0;
    const tds         = o.tds         ?? 0;
    const pf          = o.pf          ?? 0;
    const netSalary   = basicSalary + allowances - deductions - tds - pf;
    return { teacher: t._id, teacherName: t.fullName, basicSalary, allowances, deductions, tds, pf, netSalary };
  });

  const totalGross      = lines.reduce((s, l) => s + l.basicSalary + l.allowances, 0);
  const totalDeductions = lines.reduce((s, l) => s + l.deductions + l.tds + l.pf, 0);
  const totalNet        = lines.reduce((s, l) => s + l.netSalary, 0);

  const payrollNumber = await nextPayrollNumber(year, session);

  const [payroll] = await Payroll.create([{
    payrollNumber, month, academicYear: year,
    status: 'draft', lines,
    totalGross, totalDeductions, totalNet,
    createdBy,
  }], { session });

  return payroll;
}

/**
 * Accrue payroll — post the salary expense journal.
 *   Dr  5110/5120  Teacher/Staff Salary   totalGross
 *   Cr  2120       Salary Payable         totalNet
 *   Cr  2140       TDS Payable            totalTDS   (if any)
 *   Cr  2150       PF Payable             totalPF    (if any)
 */
export async function accruePayroll(payrollId, { createdBy }, session) {
  const payroll = await Payroll.findById(payrollId).session(session);
  if (!payroll) throw new Error('Payroll not found');
  if (payroll.status !== 'draft') throw new Error('Only draft payrolls can be accrued');

  const totalTDS = payroll.lines.reduce((s, l) => s + (l.tds || 0), 0);
  const totalPF  = payroll.lines.reduce((s, l) => s + (l.pf  || 0), 0);

  const [teacherSalId, staffSalId, salPayableId, tdsPayableId, pfPayableId] = await Promise.all([
    resolveAccount('5110', session),
    resolveAccount('5120', session),
    resolveAccount('2120', session),
    totalTDS > 0 ? resolveAccount('2140', session) : null,
    totalPF  > 0 ? resolveAccount('2150', session) : null,
  ]);

  // Split gross between teacher salary (5110) and any non-teacher staff (5120)
  // For simplicity, post all gross to 5110 (Teacher Salary)
  const lines = [
    { account: teacherSalId, type: 'debit',  amount: payroll.totalGross, description: `Salary accrual ${payroll.month}` },
    { account: salPayableId, type: 'credit', amount: payroll.totalNet,   description: `Net payable ${payroll.month}` },
  ];
  if (totalTDS > 0) lines.push({ account: tdsPayableId, type: 'credit', amount: totalTDS, description: 'TDS withheld' });
  if (totalPF  > 0) lines.push({ account: pfPayableId,  type: 'credit', amount: totalPF,  description: 'PF withheld' });

  const journal = await postJournal({
    type:        'automatic',
    source:      'salary_accrual',
    sourceRef:   payroll._id,
    sourceModel: 'Payroll',
    date:        new Date(),
    narration:   `Salary accrual — ${payroll.month}`,
    academicYear: payroll.academicYear,
    lines,
    createdBy,
  }, session);

  await Payroll.findByIdAndUpdate(payrollId, {
    status: 'accrued',
    accrualJournalRef: journal._id,
  }, { session });

  return journal;
}

/**
 * Disburse payroll — pay salaries from bank/cash.
 *   Dr  2120  Salary Payable   totalNet
 *   Cr  1110/1120  Cash / Bank  totalNet
 */
export async function disbursePayroll(payrollId, { paymentMethod = 'Bank Transfer', paidDate, createdBy }, session) {
  const payroll = await Payroll.findById(payrollId).session(session);
  if (!payroll) throw new Error('Payroll not found');
  if (payroll.status !== 'accrued') throw new Error('Only accrued payrolls can be disbursed');

  const cashCode = METHOD_ACCOUNT_MAP[paymentMethod] || '1120';
  const [salPayableId, cashId] = await Promise.all([
    resolveAccount('2120', session),
    resolveAccount(cashCode, session),
  ]);

  const journal = await postJournal({
    type:        'automatic',
    source:      'salary_payment',
    sourceRef:   payroll._id,
    sourceModel: 'Payroll',
    date:        paidDate || new Date(),
    narration:   `Salary disbursement — ${payroll.month}`,
    academicYear: payroll.academicYear,
    lines: [
      { account: salPayableId, type: 'debit',  amount: payroll.totalNet, description: `Salary paid ${payroll.month}` },
      { account: cashId,       type: 'credit', amount: payroll.totalNet, description: `${paymentMethod} disbursement` },
    ],
    createdBy,
  }, session);

  await Payroll.findByIdAndUpdate(payrollId, {
    status: 'paid',
    paymentJournalRef: journal._id,
    paymentMethod,
    paidDate: paidDate || new Date(),
  }, { session });

  return journal;
}
