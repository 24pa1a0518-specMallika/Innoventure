const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    month: { type: String, required: true }, // e.g., 'October 2026'
    amount: { type: Number, required: true },
    paymentType: { type: String, enum: ['Rent', 'Maintenance', 'Security Deposit'], default: 'Rent' },
    paymentMethod: { type: String, enum: ['UPI', 'Bank Transfer', 'Cash', 'Card'], default: 'UPI' },
    transactionId: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'paid', 'rejected'], default: 'pending' },
    receiptPath: { type: String, default: '' },
    paidAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
