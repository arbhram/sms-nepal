import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB');

// 1. Delete all journal entries
const journalResult = await mongoose.connection.collection('journals').deleteMany({});
console.log(`Deleted ${journalResult.deletedCount} journal entries`);

// 2. Reset journal/receipt/invoice sequence counters
const counterResult = await mongoose.connection.collection('counters').deleteMany({
  key: { $regex: /^(journal_|invoice_|receipt_|expense_|payroll_)/ },
});
console.log(`Reset ${counterResult.deletedCount} sequence counters`);

// 3. Clear invoiceJournalRef on all fee records
const feeInvoiceResult = await mongoose.connection.collection('fees').updateMany(
  {},
  { $unset: { invoiceJournalRef: '' } },
);
console.log(`Cleared invoiceJournalRef on ${feeInvoiceResult.modifiedCount} fee records`);

// 4. Clear journalRef on all payment sub-documents
const feePaymentResult = await mongoose.connection.collection('fees').updateMany(
  { 'payments.journalRef': { $exists: true } },
  { $unset: { 'payments.$[].journalRef': '' } },
);
console.log(`Cleared payment journalRef on ${feePaymentResult.modifiedCount} fee records`);

// 5. Clear journalRef on transactions
const txResult = await mongoose.connection.collection('transactions').updateMany(
  {},
  { $unset: { journalRef: '' } },
);
console.log(`Cleared journalRef on ${txResult.modifiedCount} transactions`);

// 6. Clear payroll journal refs
const payrollResult = await mongoose.connection.collection('payrolls').updateMany(
  {},
  { $unset: { accrualJournalRef: '', paymentJournalRef: '' }, $set: { status: 'draft' } },
);
console.log(`Reset ${payrollResult.modifiedCount} payroll records to draft`);

await mongoose.disconnect();
console.log('\nDone. Accounting data cleared — accounts and fee/student records untouched.');
