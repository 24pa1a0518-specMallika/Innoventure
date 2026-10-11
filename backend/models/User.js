const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['resident', 'owner'], required: true },
    // Profile details
    emergencyContact: { type: String, default: '' },
    address: { type: String, default: '' },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
    
    // Resident specific fields
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    idProof: {
      docType: { type: String, default: 'Aadhaar' },
      filePath: { type: String, default: '' },
      fileName: { type: String, default: '' },
      uploadedAt: { type: Date }
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verificationNote: { type: String, default: '' },
    
    // Owner specific fields
    pgName: { type: String, default: 'Sunrise Luxury PG' },
    pgAddress: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
