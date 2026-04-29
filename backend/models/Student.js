import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, unique: true, required: true },
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    dateOfBirth: { type: Date, required: true },
    photo: { type: String, default: '' },
    bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-',''], default: '' },
    nationality: { type: String, default: 'Nepali' },

    // Contact
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String },
    guardianName: { type: String, required: true },
    guardianPhone: { type: String, required: true },
    guardianOccupation: { type: String },

    // Academic
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    section: { type: String, default: 'A' },
    rollNumber: { type: String },
    admissionDate: { type: Date, default: Date.now },
    previousSchool: { type: String },

    // Nepal specific
    citizenshipNumber: { type: String },
    municipality: { type: String },
    wardNumber: { type: String },
    province: {
      type: String,
      enum: ['Koshi','Madhesh','Bagmati','Gandaki','Lumbini','Karnali','Sudurpashchim',''],
      default: '',
    },

    // Transportation
    usesTransport: { type: Boolean, default: false },
    transportRoute: { type: String, default: '' },

    status: { type: String, enum: ['active', 'inactive', 'graduated'], default: 'active' },
    documents: [{ name: String, url: String, uploadedAt: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);

studentSchema.index({ fullName: 'text', studentId: 'text' });

export default mongoose.model('Student', studentSchema);
