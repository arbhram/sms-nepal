import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "First Term Exam"
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    subjects: [{
      name: String,
      fullMarks: { type: Number, default: 100 },
      passMarks: { type: Number, default: 40 },
      examDate: Date,
    }],
    status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
  },
  { timestamps: true }
);

const resultSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    marks: [{
      subject: String,
      obtained: Number,
      fullMarks: Number,
      grade: String,
    }],
    totalObtained: { type: Number, default: 0 },
    totalFull: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    grade: { type: String },
    rank: { type: Number },
    remarks: { type: String },
  },
  { timestamps: true }
);

resultSchema.index({ exam: 1, student: 1 }, { unique: true });

export const Exam = mongoose.model('Exam', examSchema);
export const Result = mongoose.model('Result', resultSchema);
