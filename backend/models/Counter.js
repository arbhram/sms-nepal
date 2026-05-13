import mongoose from 'mongoose';

// Atomic sequence counters — one per school per key (e.g. journal_2083, receipt_2083)
const counterSchema = new mongoose.Schema({
  // unique: true removed — uniqueness is per-school via compound index below
  key: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

counterSchema.index({ schoolId: 1, key: 1 }, { unique: true });

export default mongoose.model('Counter', counterSchema);
