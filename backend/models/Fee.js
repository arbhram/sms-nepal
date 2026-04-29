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
  },
  { _id: true }
);

const feeSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, unique: true, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    academicYear: { type: String, default: () => `${new Date().getFullYear()}` },

    category: {
      type: String,
      enum: ['Admission', 'Monthly', 'Exam', 'Transport', 'Hostel', 'Library', 'Identity Card', 'Custom'],
      required: true,
    },

    // Multiple fee line-items bundled in one record (optional detail)
    feeItems: [
      {
        type: { type: String },
        description: { type: String },
        amount: { type: Number, required: true },
      },
    ],

    // ── Fee amounts (all NPR) ────────────────────────────────────────────────
    totalAssignedFee: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },

    // Computed by pre-save — do NOT set these manually
    totalPaid: { type: Number, default: 0 },
    remainingBalance: { type: Number, default: 0 },

    // ── Status ───────────────────────────────────────────────────────────────
    // Unpaid  → no payments made yet
    // Partial → some amount paid, balance remaining
    // Paid    → fully settled
    status: { type: String, enum: ['Unpaid', 'Partial', 'Paid'], default: 'Unpaid' },

    // ── Payments (immutable log — never overwritten) ─────────────────────────
    payments: [paymentSchema],

    // ── Optional metadata ────────────────────────────────────────────────────
    dueDate: { type: Date },
    month: { type: String }, // e.g. "Baishakh 2082"
    remarks: { type: String },
  },
  { timestamps: true }
);

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
