const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const { authenticateToken, requireRole } = require('../middleware/auth');

// LOG NEW VISITOR (Resident)
router.post('/', authenticateToken, requireRole('resident'), async (req, res) => {
  try {
    const { visitorName, relationship, phone, visitDate, entryTime, purpose } = req.body;

    if (!visitorName || !phone || !visitDate || !entryTime) {
      return res.status(400).json({ success: false, message: 'Visitor name, phone, date, and entry time required.' });
    }

    const visitor = new Visitor({
      resident: req.user._id,
      visitorName: visitorName.trim(),
      relationship: relationship || 'Friend',
      phone: phone.trim(),
      visitDate,
      entryTime,
      purpose: purpose || 'Visit',
      status: 'active'
    });

    await visitor.save();
    res.status(201).json({ success: true, message: 'Visitor logged successfully!', visitor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to log visitor.' });
  }
});

// RESIDENT CHECK-OUT VISITOR
router.put('/:id/checkout', authenticateToken, async (req, res) => {
  try {
    const timeNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor log not found.' });
    }

    // Must be owner or the resident who created it
    if (req.user.role !== 'owner' && visitor.resident.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    visitor.exitTime = timeNow;
    visitor.status = 'checked-out';
    await visitor.save();

    res.status(200).json({ success: true, message: 'Visitor checked out successfully!', visitor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check out visitor.' });
  }
});

// GET MY VISITORS (Resident)
router.get('/my-visitors', authenticateToken, requireRole('resident'), async (req, res) => {
  try {
    const visitors = await Visitor.find({ resident: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, visitors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch visitors.' });
  }
});

// GET ALL VISITORS (Owner)
router.get('/all', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const visitors = await Visitor.find()
      .populate('resident', 'name email phone room')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, visitors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch visitors.' });
  }
});

module.exports = router;
