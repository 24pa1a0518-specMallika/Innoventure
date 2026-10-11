const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Booking = require('../models/Booking');
const Visitor = require('../models/Visitor');
const { authenticateToken, requireRole } = require('../middleware/auth');

// OWNER METRICS & REPORT SUMMARY
router.get('/summary', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const totalResidents = await User.countDocuments({ role: 'resident' });
    const verifiedResidents = await User.countDocuments({ role: 'resident', verificationStatus: 'verified' });
    const pendingVerifications = await User.countDocuments({ role: 'resident', verificationStatus: 'pending' });

    const totalRooms = await Room.countDocuments();
    const rooms = await Room.find();
    let totalBeds = 0;
    let occupiedBeds = 0;
    rooms.forEach(r => {
      totalBeds += r.capacity;
      occupiedBeds += (r.residents ? r.residents.length : 0);
    });

    const openComplaints = await Complaint.countDocuments({ status: { $in: ['open', 'in-progress'] } });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });

    // Calculate total verified revenue
    const paidPayments = await Payment.find({ status: 'paid' });
    const totalRevenue = paidPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalResidents,
        verifiedResidents,
        pendingVerifications,
        totalRooms,
        totalBeds,
        occupiedBeds,
        availableBeds: Math.max(0, totalBeds - occupiedBeds),
        openComplaints,
        pendingBookings,
        pendingPayments,
        totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate reports.' });
  }
});

// GET OWNER DETAILS (For Residents to contact owner)
router.get('/owner-details', authenticateToken, async (req, res) => {
  try {
    const owner = await User.findOne({ role: 'owner' }).select('name email phone pgName pgAddress');
    res.status(200).json({
      success: true,
      owner: owner || {
        name: 'PG Administrator',
        email: 'admin@smartpg.com',
        phone: '+91 98765 43210',
        pgName: 'Smart Stay Living PG',
        pgAddress: 'Sector 45, Cyber City, Bangalore - 560001'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch owner details.' });
  }
});

// GET ALL RESIDENTS LIST (Owner only)
router.get('/residents', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const residents = await User.find({ role: 'resident' })
      .select('-password')
      .populate('room')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, residents });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch residents list.' });
  }
});

module.exports = router;
