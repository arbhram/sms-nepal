import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Class 10", "+2 Science"
    sections: [{ type: String }], // e.g. ["A", "B", "C"]
    classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    defaultFee: { type: Number, default: 0 },
    admissionFee: { type: Number, default: 0 },
    transportFee: { type: Number, default: 0 },
    description: { type: String },
    academicYear: { type: String, default: () => `${new Date().getFullYear()}` },
  },
  { timestamps: true }
);

export default mongoose.model('Class', classSchema);
