import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // unique: true removed — uniqueness is per-school via compound index below
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'teacher', 'student', 'parent'],
      default: 'admin',
    },
    avatar: { type: String, default: '' },
    isActive:  { type: Boolean, default: true },
    schoolId:  { type: mongoose.Schema.Types.ObjectId, ref: 'School', index: true },
    linkedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    linkedTeacher:  { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  },
  { timestamps: true },
);

// Email unique per school (two schools can share the same email address)
userSchema.index({ schoolId: 1, email: 1 }, { unique: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);
