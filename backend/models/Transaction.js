import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'eSewa', 'Khalti', 'FonePay', 'Cheque'],
      default: 'Cash',
    },
    reference: {
      type: String,
      default: '',
    },
    items: {
      type: [itemSchema],
      default: [],
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    journalRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Journal', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
