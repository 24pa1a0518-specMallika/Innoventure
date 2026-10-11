const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Maintenance', 'Cleanliness', 'WiFi/Internet', 'Food/Mess', 'Electricity/Water', 'Security', 'Other'],
      default: 'Maintenance'
    },
    description: { type: String, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved'],
      default: 'open'
    },
    resolutionNote: { type: String, default: '' },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
