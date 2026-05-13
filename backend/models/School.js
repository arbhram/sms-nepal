import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    subdomain:   { type: String, required: true, unique: true, lowercase: true, trim: true },
    plan:        { type: String, enum: ['trial', 'starter', 'pro', 'enterprise'], default: 'trial' },
    dbMode:      { type: String, enum: ['shared', 'dedicated'], default: 'shared' },
    dbUri:       { type: String, default: null },
    isActive:    { type: Boolean, default: true },
    trialEndsAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    address:     { type: String, default: '' },
    phone:       { type: String, default: '' },
    email:       { type: String, default: '' },
    logoUrl:     { type: String, default: '' },
    timezone:    { type: String, default: 'Asia/Kathmandu' },
    currency:    { type: String, default: 'NPR' },
  },
  {
    timestamps: true,
    tenantScoped: false, // School IS the tenant — never filter by schoolId
  },
);

export default mongoose.model('School', schoolSchema);
