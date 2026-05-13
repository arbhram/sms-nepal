import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: String },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Leave', 'Late'],
      default: 'Present',
    },
    remarks: { type: String },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// One record per student per day per school (cross-school uniqueness is meaningless)
attendanceSchema.index({ schoolId: 1, student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ schoolId: 1, date: -1, class: 1 });

export default mongoose.model('Attendance', attendanceSchema);
