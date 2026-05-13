import mongoose from 'mongoose';

const journalLineSchema = new mongoose.Schema({
  account:     { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  accountCode: { type: String, required: true },
  accountName: { type: String, required: true },
  type:        { type: String, enum: ['debit', 'credit'], required: true },
  amount:      { type: Number, required: true, min: 0.01 },
  description: { type: String, default: '' },
  student:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  teacher:     { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
  costCenter:  { type: String, default: '' },
}, { _id: true });

const journalSchema = new mongoose.Schema({
  // unique: true removed from field — uniqueness enforced via compound index below
  journalNumber: { type: String, required: true },
  type: {
    type: String,
    enum: ['automatic', 'manual', 'opening', 'closing', 'reversal'],
    required: true,
  },
  source: {
    type: String,
    enum: ['fee_invoice', 'fee_payment', 'fee_refund', 'salary_accrual', 'salary_payment',
           'expense', 'manual', 'reversal', 'opening_balance'],
    required: true,
  },
  sourceRef:   { type: mongoose.Schema.Types.ObjectId, default: null },
  sourceModel: { type: String, default: '' },
  date:        { type: Date, required: true },
  narration:   { type: String, required: true },
  academicYear: { type: String, required: true },
  status:      { type: String, enum: ['draft', 'posted', 'reversed'], default: 'posted' },
  reversalOf:  { type: mongoose.Schema.Types.ObjectId, ref: 'Journal', default: null },
  reversedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Journal', default: null },
  totalDebit:  { type: Number, required: true },
  totalCredit: { type: Number, required: true },
  lines:       [journalLineSchema],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedAt:    { type: Date },
}, { timestamps: true });

journalSchema.index({ schoolId: 1, journalNumber: 1 }, { unique: true });
journalSchema.index({ schoolId: 1, date: -1 });
journalSchema.index({ schoolId: 1, academicYear: 1, status: 1, date: -1 });
journalSchema.index({ 'lines.account': 1, status: 1 });
journalSchema.index({ sourceRef: 1, sourceModel: 1 });
journalSchema.index({ 'lines.student': 1, status: 1 });

export default mongoose.model('Journal', journalSchema);
