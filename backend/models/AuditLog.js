import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorType: {
      type: String,
      enum: ['super_admin', 'school_admin', 'system'],
      required: true,
    },
    actorId:   { type: mongoose.Schema.Types.ObjectId, required: true },
    actorName: { type: String, default: '' },

    action: { type: String, required: true }, // e.g. 'school.suspended'

    targetType: { type: String },             // 'school', 'user', etc.
    targetId:   { type: mongoose.Schema.Types.ObjectId },
    targetName: { type: String },

    schoolId: { type: mongoose.Schema.Types.ObjectId }, // set when action concerns a specific school

    changes: {
      before: { type: mongoose.Schema.Types.Mixed },
      after:  { type: mongoose.Schema.Types.Mixed },
    },

    reason:    { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true,
    tenantScoped: false, // global — never scoped to a school
  },
);

auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ schoolId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
