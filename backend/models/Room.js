const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true },
    floor: { type: Number, default: 1 },
    roomType: { type: String, enum: ['Single', 'Double Sharing', 'Triple Sharing'], default: 'Double Sharing' },
    capacity: { type: Number, required: true, default: 2 },
    currentOccupancy: { type: Number, default: 0 },
    rentPerMonth: { type: Number, required: true },
    amenities: [{ type: String }],
    status: { type: String, enum: ['available', 'occupied', 'maintenance'], default: 'available' },
    residents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
