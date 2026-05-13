import mongoose from 'mongoose';

const { Schema } = mongoose;

const assignedComponentSchema = new Schema({
  name:           { type: String, required: true },
  baseAmount:     { type: Number, required: true, min: 0 },
  frequency:      { type: String, enum: ['monthly', 'termly', 'yearly', 'one-time'], required: true },
  category:       { type: String, default: 'Custom' },
  isIncluded:     { type: Boolean, default: true },
  overrideAmount: { type: Number, default: null },
  overrideReason: { type: String, default: '' },
}, { _id: true });

const adjustmentSchema = new Schema({
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['discount_fixed', 'discount_percent', 'scholarship_fixed', 'scholarship_percent', 'surcharge_fixed'],
    required: true,
  },
  value:         { type: Number, required: true, min: 0 },
  scope:         { type: String, enum: ['total', 'component'], default: 'total' },
  componentName: { type: String, default: '' },
  reason:        { type: String, default: '' },
}, { _id: true });

const studentFeeAssignmentSchema = new Schema({
  student:         { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  class:           { type: Schema.Types.ObjectId, ref: 'Class',   required: true },
  academicYear:    { type: String, required: true },
  sourceStructure: { type: Schema.Types.ObjectId, ref: 'FeeStructure' },

  components:  [assignedComponentSchema],
  adjustments: [adjustmentSchema],

  summary: {
    monthlyGross:    { type: Number, default: 0 },
    monthlyNet:      { type: Number, default: 0 },
    yearlyGross:     { type: Number, default: 0 },
    yearlyNet:       { type: Number, default: 0 },
    totalAnnualGross: { type: Number, default: 0 },
    totalAnnualNet:   { type: Number, default: 0 },
    totalDiscounts:  { type: Number, default: 0 },
  },

  assignedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  lastModifiedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// One assignment per student per academic year per school
studentFeeAssignmentSchema.index({ schoolId: 1, student: 1, academicYear: 1 }, { unique: true });

export default mongoose.model('StudentFeeAssignment', studentFeeAssignmentSchema);
