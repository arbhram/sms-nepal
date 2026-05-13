import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'eSewa', 'Khalti', 'FonePay'],
      default: 'Cash',
    },
    paidDate: { type: Date, default: Date.now },
    receiptNumber: { type: String },
    remarks: { type: String, default: '' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    journalRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Journal', default: null },
  },
  { _id: true },
);

const feeSchema = new mongoose.Schema(
  {
    // unique: true removed — uniqueness enforced via compound index below
    receiptNumber: { type: String, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    academicYear: { type: String, default: () => `${new Date().getFullYear()}` },

    category: {
      type: String,
      enum: ['Admission', 'Monthly', 'Exam', 'Transport', 'Hostel', 'Library', 'Identity Card', 'Custom'],
      required: true,
    },

    feeItems: [
      {
        type: { type: String },
        description: { type: String },
        amount: { type: Number, required: true },
      },
    ],

    totalAssignedFee: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },

    totalPaid: { type: Number, default: 0 },
    remainingBalance: { type: Number, default: 0 },

    status: { type: String, enum: ['Unpaid', 'Partial', 'Paid'], default: 'Unpaid' },

    payments: [paymentSchema],

    invoiceJournalRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Journal', default: null },

    dueDate: { type: Date },
    month: { type: String },
    remarks: { type: String },
  },
  { timestamps: true },
);

feeSchema.index({ schoolId: 1, receiptNumber: 1 }, { unique: true });
feeSchema.index({ schoolId: 1, student: 1 });
feeSchema.index({ schoolId: 1, academicYear: 1, status: 1 });

// Always recompute totals and status from the payments array on every save.
feeSchema.pre('save', function (next) {
  this.totalPaid = this.payments.reduce((sum, p) => sum + p.amount, 0);
  const netFee = Math.max(0, this.totalAssignedFee - this.discount);
  this.remainingBalance = Math.max(0, netFee - this.totalPaid);

  if (this.totalPaid === 0) this.status = 'Unpaid';
  else if (this.remainingBalance === 0) this.status = 'Paid';
  else this.status = 'Partial';

  next();
});

export default mongoose.model('Fee', feeSchema);
