import Counter from '../models/Counter.js';

export async function nextSequence(key, session) {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session },
  );
  return counter.seq;
}

export async function nextJournalNumber(academicYear, session) {
  const seq = await nextSequence(`journal_${academicYear}`, session);
  return `JNL-${academicYear}-${String(seq).padStart(6, '0')}`;
}

export async function nextInvoiceNumber(academicYear, session) {
  const seq = await nextSequence(`invoice_${academicYear}`, session);
  return `INV-${academicYear}-${String(seq).padStart(6, '0')}`;
}

export async function nextReceiptNumber(academicYear, session) {
  const seq = await nextSequence(`receipt_${academicYear}`, session);
  return `RCP-${academicYear}-${String(seq).padStart(6, '0')}`;
}

export async function nextExpenseNumber(academicYear, session) {
  const seq = await nextSequence(`expense_${academicYear}`, session);
  return `EXP-${academicYear}-${String(seq).padStart(6, '0')}`;
}

export async function nextPayrollNumber(academicYear, session) {
  const seq = await nextSequence(`payroll_${academicYear}`, session);
  return `PAY-${academicYear}-${String(seq).padStart(4, '0')}`;
}
