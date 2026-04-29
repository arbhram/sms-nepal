import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['fee', 'attendance', 'exam', 'general'],
      default: 'general',
    },
    audience: {
      type: String,
      enum: ['all', 'admin', 'teacher', 'student', 'parent'],
      default: 'all',
    },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
