const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET USER NOTIFICATIONS
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

// MARK NOTIFICATION AS READ
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true }
    );
    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

// BROADCAST ANNOUNCEMENT (Owner only)
router.post('/broadcast', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message required.' });
    }

    const residents = await User.find({ role: 'resident' });
    const docs = residents.map((r) => ({
      recipient: r._id,
      title,
      message,
      type: 'announcement'
    }));

    if (docs.length > 0) {
      await Notification.insertMany(docs);
    }

    res.status(201).json({
      success: true,
      message: `Announcement broadcast to ${residents.length} resident(s)!`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to broadcast announcement.' });
  }
});

module.exports = router;
