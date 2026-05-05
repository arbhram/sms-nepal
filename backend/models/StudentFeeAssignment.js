import mongoose from 'mongoose';

const { Schema } = mongoose;

// Snapshot of a single fee component — copied from the structure, not referenced
const assignedComponentSchema = new Schema({
  name:           { type: String, required: true },
  baseAmount:     { type: Number, required: true, min: 0 },
  frequency:      { type: String, enum: ['monthly', 'termly', 'yearly', 'one-time'], required: true },
  category:       { type: String, default: 'Custom' },
  isIncluded:     { type: Boolean, default: true },
  // null = use baseAmount; a value here overrides baseAmount for this student only
  overrideAmount: { type: Number, default: null },
  overrideReason: { type: String, default: '' },
}, { _id: true });

// Discounts, scholarships, or surcharges applied on top of components
const adjustmentSchema = new Schema({
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['discount_fixed', 'discount_percent', 'scholarship_fixed', 'scholarship_percent', 'surcharge_fixed'],
    required: true,
  },
  value:         { type: Number, required: true, min: 0 },
  // 'total' = applied after summing all components; 'component' = applied to one component only
  scope:         { type: String, enum: ['total', 'component'], default: 'total' },
  componentName: { type: String, default: '' },
  reason:        { type: String, default: '' },
}, { _id: true });

const studentFeeAssignmentSchema = new Schema({
  student:         { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  class:           { type: Schema.Types.ObjectId, ref: 'Class',   required: true },
  academicYear:    { type: String, required: true },
  // Kept for traceability only — changes to the source never affect this record
  sourceStructure: { type: Schema.Types.ObjectId, ref: 'FeeStructure' },

  components:  [assignedComponentSchema],
  adjustments: [adjustmentSchema],

  // Pre-computed summary — recalculated whenever components or adjustments change
  summary: {
    monthlyGross:    { type: Number, default: 0 },
    monthlyNet:      { type: Number, default: 0 },
    yearlyGross:     { type: Number, default: 0 },  // one-time + termly + yearly components
    yearlyNet:       { type: Number, default: 0 },
    totalAnnualGross: { type: Number, default: 0 }, // monthlyGross×12 + yearlyGross
    totalAnnualNet:   { type: Number, default: 0 }, // monthlyNet×12 + yearlyNet
    totalDiscounts:  { type: Number, default: 0 },
  },

  assignedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  lastModifiedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// One assignment per student per academic year
studentFeeAssignmentSchema.index({ student: 1, academicYear: 1 }, { unique: true });

export default mongoose.model('StudentFeeAssignment', studentFeeAssignmentSchema);
