const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { authenticateToken, requireRole } = require('../middleware/auth');

// RECORD ATTENDANCE / SELF CHECK-IN (Resident)
router.post('/checkin', authenticateToken, requireRole('resident'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    let record = await Attendance.findOne({ resident: req.user._id, date: today });

    if (!record) {
      record = new Attendance({
        resident: req.user._id,
        date: today,
        status: 'Present',
        checkInTime: timeNow,
        remarks: req.body.remarks || 'Resident self check-in'
      });
    } else {
      record.status = 'Present';
      record.checkInTime = timeNow;
      if (req.body.remarks) record.remarks = req.body.remarks;
    }

    await record.save();
    res.status(200).json({ success: true, message: 'Check-in recorded successfully!', attendance: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record attendance.' });
  }
});

// SELF CHECK-OUT (Resident)
router.post('/checkout', authenticateToken, requireRole('resident'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    let record = await Attendance.findOne({ resident: req.user._id, date: today });

    if (!record) {
      record = new Attendance({
        resident: req.user._id,
        date: today,
        status: 'Present',
        checkOutTime: timeNow,
        remarks: req.body.remarks || 'Resident check-out'
      });
    } else {
      record.checkOutTime = timeNow;
      if (req.body.remarks) record.remarks = req.body.remarks;
    }

    await record.save();
    res.status(200).json({ success: true, message: 'Check-out recorded successfully!', attendance: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record check-out.' });
  }
});

// GET MY ATTENDANCE (Resident)
router.get('/my-attendance', authenticateToken, requireRole('resident'), async (req, res) => {
  try {
    const records = await Attendance.find({ resident: req.user._id }).sort({ date: -1 }).limit(30);
    res.status(200).json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance.' });
  }
});

// GET ALL ATTENDANCE (Owner)
router.get('/all', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { date } = req.query;
    const query = date ? { date } : {};

    const records = await Attendance.find(query)
      .populate('resident', 'name email phone room')
      .sort({ date: -1 });

    res.status(200).json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance records.' });
  }
});

// OWNER MARK ATTENDANCE (Owner)
router.post('/mark', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { residentId, date, status, remarks } = req.body;
    if (!residentId || !date) {
      return res.status(400).json({ success: false, message: 'Resident ID and date required.' });
    }

    const record = await Attendance.findOneAndUpdate(
      { resident: residentId, date },
      { status: status || 'Present', remarks: remarks || 'Marked by Owner' },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: 'Attendance updated successfully!', record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark attendance.' });
  }
});

module.exports = router;
