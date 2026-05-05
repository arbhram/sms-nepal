import mongoose from 'mongoose';
import { currentAcademicYear } from '../utils/nepaliDate.js';

/**
 * Singleton document — there is always exactly one SystemConfig.
 * Use SystemConfig.getConfig() to read, SystemConfig.findOneAndUpdate({}, ...) to write.
 */
const systemConfigSchema = new mongoose.Schema({
  // School identity
  schoolName:    { type: String, default: 'SMS Nepal School' },
  address:       { type: String, default: '' },
  phone:         { type: String, default: '' },
  email:         { type: String, default: '' },
  website:       { type: String, default: '' },
  logoUrl:       { type: String, default: '' },
  district:      { type: String, default: '' },
  province:      { type: String, default: '' },
  registrationNo: { type: String, default: '' },
  principalName: { type: String, default: '' },

  // Academic year in BS (Bikram Sambat), e.g. "2083"
  currentAcademicYear: { type: String, default: currentAcademicYear },

  // History of past academic years
  academicYearHistory: [
    {
      year:      String,
      startedAt: Date,
      endedAt:   Date,
      notes:     String,
    },
  ],
}, { timestamps: true });

// Ensure singleton
systemConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

export default mongoose.model('SystemConfig', systemConfigSchema);
