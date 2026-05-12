import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, trim: true },
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
  // normalBalance: asset/expense = debit; liability/equity/revenue = credit
  normalBalance: { type: String, enum: ['debit', 'credit'], required: true },
  parent:        { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
  isGroup:       { type: Boolean, default: false },  // group = folder, not postable
  isSystem:      { type: Boolean, default: false },  // system accounts cannot be deleted
  description:   { type: String, default: '' },
  isActive:      { type: Boolean, default: true },
}, { timestamps: true });

accountSchema.index({ code: 1 });
accountSchema.index({ type: 1, isGroup: 1 });
accountSchema.index({ parent: 1 });

export default mongoose.model('Account', accountSchema);
