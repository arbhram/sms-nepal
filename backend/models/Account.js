import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  // unique: true removed — uniqueness is per-school via compound index below
  code:          { type: String, required: true, trim: true },
  name:          { type: String, required: true, trim: true },
  type:          { type: String, enum: ['asset', 'liability', 'equity', 'revenue', 'expense'], required: true },
  subtype: {
    type: String,
    enum: [
      'current_asset', 'fixed_asset',
      'current_liability', 'long_term_liability',
      'equity',
      'revenue', 'other_income',
      'cost_of_service', 'operating_expense', 'other_expense',
    ],
  },
  normalBalance: { type: String, enum: ['debit', 'credit'], required: true },
  parent:        { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
  isGroup:       { type: Boolean, default: false },
  isSystem:      { type: Boolean, default: false },
  description:   { type: String, default: '' },
  isActive:      { type: Boolean, default: true },
}, { timestamps: true });

accountSchema.index({ schoolId: 1, code: 1 }, { unique: true });
accountSchema.index({ schoolId: 1, type: 1, isGroup: 1 });
accountSchema.index({ parent: 1 });

export default mongoose.model('Account', accountSchema);
