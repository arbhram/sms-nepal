import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    teacherId: { type: String, unique: true, required: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true },
    photo: { type: String, default: '' },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    dateOfBirth: { type: Date },
    address: { type: String },
    subject: { type: String, required: true },
    qualification: { type: String },
    salary: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now },
    assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Teacher', teacherSchema);
