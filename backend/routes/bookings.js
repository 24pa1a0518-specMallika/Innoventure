const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken, requireRole } = require('../middleware/auth');

// CREATE BOOKING REQUEST (Resident)
router.post('/request', authenticateToken, requireRole('resident'), async (req, res) => {
  try {
    const { roomId, moveInDate, message } = req.body;

    if (!roomId || !moveInDate) {
      return res.status(400).json({ success: false, message: 'Room ID and Move-in Date are required.' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    if (room.residents.length >= room.capacity) {
      return res.status(400).json({ success: false, message: 'This room is currently fully booked.' });
    }

    // Check existing pending booking
    const existingBooking = await Booking.findOne({
      resident: req.user._id,
      status: 'pending'
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active pending booking request. Please await owner review.'
      });
    }

    const booking = new Booking({
      resident: req.user._id,
      room: roomId,
      moveInDate,
      message: message || ''
    });

    await booking.save();

    // Create notification for owners
    const owners = await User.find({ role: 'owner' });
    for (const owner of owners) {
      await Notification.create({
        recipient: owner._id,
        title: 'New Room Booking Request',
        message: `${req.user.name} submitted a booking request for Room ${room.roomNumber}.`,
        type: 'booking'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Room booking request submitted successfully! Awaiting owner approval.',
      booking
    });
  } catch (error) {
    console.error('Booking request error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit booking request.' });
  }
});

// GET MY BOOKINGS (Resident)
router.get('/my-bookings', authenticateToken, requireRole('resident'), async (req, res) => {
  try {
    const bookings = await Booking.find({ resident: req.user._id })
      .populate('room')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch your bookings.' });
  }
});

// GET ALL BOOKINGS (Owner)
router.get('/all', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('resident', 'name email phone verificationStatus')
      .populate('room')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
  }
});

// APPROVE OR REJECT BOOKING (Owner)
router.put('/:id/status', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { status, ownerNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    }

    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking request not found.' });
    }

    booking.status = status;
    booking.ownerNote = ownerNote || '';
    await booking.save();

    if (status === 'approved') {
      const room = await Room.findById(booking.room._id);
      const resident = await User.findById(booking.resident);

      if (room && resident) {
        if (!room.residents.includes(resident._id)) {
          room.residents.push(resident._id);
          room.currentOccupancy = room.residents.length;
          if (room.currentOccupancy >= room.capacity) {
            room.status = 'occupied';
          }
          await room.save();
        }

        resident.room = room._id;
        await resident.save();
      }

      await Notification.create({
        recipient: booking.resident,
        title: 'Booking Request Approved! 🎉',
        message: `Your booking for Room ${booking.room.roomNumber} has been approved by the PG owner!`,
        type: 'booking'
      });
    } else {
      await Notification.create({
        recipient: booking.resident,
        title: 'Booking Request Update',
        message: `Your booking for Room ${booking.room.roomNumber} was not approved. Note: ${ownerNote || 'Contact owner for details.'}`,
        type: 'booking'
      });
    }

    res.status(200).json({
      success: true,
      message: `Booking has been ${status}!`,
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status.' });
  }
});

module.exports = router;
