import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    audience: {
      type: String,
      enum: ['teacher', 'student', 'both'],
      required: true,
    },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Notice', noticeSchema);
