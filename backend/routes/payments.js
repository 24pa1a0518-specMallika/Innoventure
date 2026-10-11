const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const upload = require('../middleware/upload');
const { authenticateToken, requireRole } = require('../middleware/auth');

// RECORD / SUBMIT PAYMENT (Resident)
router.post('/submit', authenticateToken, requireRole('resident'), (req, res) => {
  upload.single('receipt')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload error.' });
    }

    try {
      const { month, amount, paymentType, paymentMethod, transactionId } = req.body;

      if (!req.user.room) {
        return res.status(400).json({
          success: false,
          message: 'You have not been assigned to any room yet. Please book or get a room allocated first.'
        });
      }

      if (!month || !amount) {
        return res.status(400).json({ success: false, message: 'Month and Amount are required.' });
      }

      const payment = new Payment({
        resident: req.user._id,
        room: req.user.room,
        month,
        amount: Number(amount),
        paymentType: paymentType || 'Rent',
        paymentMethod: paymentMethod || 'UPI',
        transactionId: transactionId || '',
        receiptPath: req.file ? `uploads/${req.file.filename}` : '',
        status: 'pending'
      });

      await payment.save();

      // Notify owners
      const owners = await User.find({ role: 'owner' });
      for (const owner of owners) {
        await Notification.create({
          recipient: owner._id,
          title: 'New Payment Submitted',
          message: `${req.user.name} submitted rent payment of ₹${amount} for ${month}.`,
          type: 'rent_due'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Payment recorded and submitted for owner verification!',
        payment
      });
    } catch (error) {
      console.error('Submit payment error:', error);
      res.status(500).json({ success: false, message: 'Server error recording payment.' });
    }
  });
});

// GET RESIDENT PAYMENT HISTORY (Resident)
router.get('/my-history', authenticateToken, requireRole('resident'), async (req, res) => {
  try {
    const payments = await Payment.find({ resident: req.user._id })
      .populate('room', 'roomNumber rentPerMonth')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payment history.' });
  }
});

// GET ALL PAYMENTS (Owner)
router.get('/all', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('resident', 'name email phone')
      .populate('room', 'roomNumber rentPerMonth')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch all payments.' });
  }
});

// OWNER VERIFY OR REJECT PAYMENT (Owner)
router.put('/:id/verify', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['paid', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be paid or rejected.' });
    }

    const payment = await Payment.findById(req.params.id).populate('room');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    payment.status = status;
    payment.verifiedAt = new Date();
    await payment.save();

    await Notification.create({
      recipient: payment.resident,
      title: status === 'paid' ? 'Payment Verified! 💳' : 'Payment Status: Rejected ❌',
      message: `Your payment of ₹${payment.amount} for ${payment.month} has been ${status === 'paid' ? 'verified successfully.' : 'rejected. Please contact owner.'}`,
      type: 'rent_due'
    });

    res.status(200).json({
      success: true,
      message: `Payment marked as ${status}!`,
      payment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update payment status.' });
  }
});

module.exports = router;
