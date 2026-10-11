const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    status: { type: String, enum: ['Present', 'Absent', 'On Leave'], default: 'Present' },
    checkInTime: { type: String, default: '' },
    checkOutTime: { type: String, default: '' },
    remarks: { type: String, default: '' }
  },
  { timestamps: true }
);

// One attendance record per resident per day
attendanceSchema.index({ resident: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
