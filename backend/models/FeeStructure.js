import mongoose from 'mongoose';

const { Schema } = mongoose;

const componentSchema = new Schema({
  name:        { type: String, required: true, trim: true },
  amount:      { type: Number, required: true, min: 0 },
  frequency:   { type: String, enum: ['monthly', 'termly', 'yearly', 'one-time'], required: true },
  category: {
    type: String,
    enum: ['Admission', 'Monthly', 'Exam', 'Transport', 'Hostel', 'Library', 'Identity Card', 'Custom'],
    default: 'Custom',
  },
  isOptional:  { type: Boolean, default: false },
  description: { type: String, default: '' },
}, { _id: true });

const feeStructureSchema = new Schema({
  class:          { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  academicYear:   { type: String, required: true },
  name:           { type: String, default: '' },
  components:     [componentSchema],
  isActive:       { type: Boolean, default: true },
  createdBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// One structure per class per academic year per school
feeStructureSchema.index({ schoolId: 1, class: 1, academicYear: 1 }, { unique: true });

export default mongoose.model('FeeStructure', feeStructureSchema);
