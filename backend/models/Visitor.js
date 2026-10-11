const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    visitorName: { type: String, required: true, trim: true },
    relationship: { type: String, default: 'Friend' },
    phone: { type: String, required: true },
    visitDate: { type: String, required: true }, // YYYY-MM-DD
    entryTime: { type: String, required: true },
    exitTime: { type: String, default: '' },
    purpose: { type: String, default: 'General Visit' },
    status: { type: String, enum: ['active', 'checked-out'], default: 'active' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Visitor', visitorSchema);
