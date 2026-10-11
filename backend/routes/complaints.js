const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken, requireRole } = require('../middleware/auth');

// FILE A NEW COMPLAINT (Resident)
router.post('/', authenticateToken, requireRole('resident'), async (req, res) => {
  try {
    const { title, category, description, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const complaint = new Complaint({
      resident: req.user._id,
      title: title.trim(),
      category: category || 'Maintenance',
      description: description.trim(),
      priority: priority || 'Medium',
      status: 'open'
    });

    await complaint.save();

    // Notify owners
    const owners = await User.find({ role: 'owner' });
    for (const owner of owners) {
      await Notification.create({
        recipient: owner._id,
        title: `New Resident Complaint: ${title}`,
        message: `${req.user.name} reported a ${priority} priority issue under ${category}.`,
        type: 'complaint'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully!',
      complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit complaint.' });
  }
});

// GET MY COMPLAINTS (Resident)
router.get('/my-complaints', authenticateToken, requireRole('resident'), async (req, res) => {
  try {
    const complaints = await Complaint.find({ resident: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch complaints.' });
  }
});

// GET ALL COMPLAINTS (Owner)
router.get('/all', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('resident', 'name email phone room')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch complaints.' });
  }
});

// UPDATE COMPLAINT STATUS (Owner)
router.put('/:id/status', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { status, resolutionNote } = req.body;
    if (!['open', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    complaint.status = status;
    if (resolutionNote !== undefined) complaint.resolutionNote = resolutionNote;
    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    await Notification.create({
      recipient: complaint.resident,
      title: `Complaint Updated: ${complaint.title}`,
      message: `Your complaint status changed to "${status}". Note: ${resolutionNote || 'No extra note.'}`,
      type: 'complaint'
    });

    res.status(200).json({
      success: true,
      message: `Complaint marked as ${status}!`,
      complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update complaint.' });
  }
});

module.exports = router;
