import mongoose from 'mongoose';

const payrollLineSchema = new mongoose.Schema({
  teacher:      { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  teacherName:  { type: String, required: true },
  basicSalary:  { type: Number, required: true, min: 0 },
  allowances:   { type: Number, default: 0 },
  deductions:   { type: Number, default: 0 },
  tds:          { type: Number, default: 0 },
  pf:           { type: Number, default: 0 },
  netSalary:    { type: Number, required: true },
}, { _id: true });

const payrollSchema = new mongoose.Schema({
  // unique: true removed — uniqueness is per-school via compound index below
  payrollNumber: { type: String, required: true },
  month:         { type: String, required: true },
  academicYear:  { type: String, required: true },
  status: {
    type: String,
    enum: ['draft', 'accrued', 'paid'],
    default: 'draft',
  },
  lines:               [payrollLineSchema],
  totalGross:          { type: Number, default: 0 },
  totalDeductions:     { type: Number, default: 0 },
  totalNet:            { type: Number, default: 0 },
  accrualJournalRef:   { type: mongoose.Schema.Types.ObjectId, ref: 'Journal', default: null },
  paymentJournalRef:   { type: mongoose.Schema.Types.ObjectId, ref: 'Journal', default: null },
  paymentMethod:       { type: String, enum: ['Cash', 'Bank Transfer', 'Cheque'], default: 'Bank Transfer' },
  paidDate:            { type: Date },
  notes:               { type: String, default: '' },
  createdBy:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

payrollSchema.index({ schoolId: 1, payrollNumber: 1 }, { unique: true });
payrollSchema.index({ schoolId: 1, academicYear: 1, month: 1 });
payrollSchema.index({ schoolId: 1, status: 1 });

export default mongoose.model('Payroll', payrollSchema);
