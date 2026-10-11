const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET ALL ROOMS (Residents & Owners can view)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find().populate('residents', 'name email phone verificationStatus');
    res.status(200).json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch rooms.' });
  }
});

// CREATE A NEW ROOM (Owner only)
router.post('/', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { roomNumber, floor, roomType, capacity, rentPerMonth, amenities } = req.body;

    if (!roomNumber || !rentPerMonth) {
      return res.status(400).json({ success: false, message: 'Room number and rent are required.' });
    }

    const existing = await Room.findOne({ roomNumber: roomNumber.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Room number already exists.' });
    }

    const room = new Room({
      roomNumber: roomNumber.trim(),
      floor: floor || 1,
      roomType: roomType || 'Double Sharing',
      capacity: capacity || 2,
      currentOccupancy: 0,
      rentPerMonth,
      amenities: amenities || ['WiFi', 'Attached Bathroom', 'Geyser', 'Cupboard'],
      status: 'available'
    });

    await room.save();
    res.status(201).json({ success: true, message: 'Room created successfully!', room });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ success: false, message: 'Failed to create room.' });
  }
});

// UPDATE ROOM (Owner only)
router.put('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { floor, roomType, capacity, rentPerMonth, amenities, status } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    if (floor !== undefined) room.floor = floor;
    if (roomType) room.roomType = roomType;
    if (capacity !== undefined) room.capacity = capacity;
    if (rentPerMonth !== undefined) room.rentPerMonth = rentPerMonth;
    if (amenities) room.amenities = amenities;
    if (status) room.status = status;

    // Recalculate status
    if (room.residents.length >= room.capacity) {
      room.status = 'occupied';
    } else if (room.status === 'occupied' && room.residents.length < room.capacity) {
      room.status = 'available';
    }

    await room.save();
    const updated = await Room.findById(room._id).populate('residents', 'name email phone');
    res.status(200).json({ success: true, message: 'Room updated successfully!', room: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update room.' });
  }
});

// DELETE ROOM (Owner only)
router.delete('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    if (room.residents && room.residents.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete room with active residents. Deallocate them first.'
      });
    }

    await Room.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Room deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete room.' });
  }
});

// MANUAL ALLOCATE RESIDENT TO ROOM (Owner only)
router.post('/allocate', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { roomId, residentId } = req.body;
    const room = await Room.findById(roomId);
    const resident = await User.findById(residentId);

    if (!room || !resident) {
      return res.status(404).json({ success: false, message: 'Room or resident not found.' });
    }

    if (room.residents.length >= room.capacity) {
      return res.status(400).json({ success: false, message: 'Room is already at full capacity!' });
    }

    // Check if resident was in another room
    if (resident.room && resident.room.toString() !== roomId) {
      await Room.findByIdAndUpdate(resident.room, {
        $pull: { residents: resident._id },
        $inc: { currentOccupancy: -1 },
        status: 'available'
      });
    }

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

    res.status(200).json({
      success: true,
      message: `Resident ${resident.name} allocated to Room ${room.roomNumber}!`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to allocate room.' });
  }
});

// DEALLOCATE RESIDENT (Owner only)
router.post('/deallocate', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { residentId } = req.body;
    const resident = await User.findById(residentId);
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found.' });
    }

    if (resident.room) {
      const room = await Room.findById(resident.room);
      if (room) {
        room.residents = room.residents.filter(id => id.toString() !== resident._id.toString());
        room.currentOccupancy = room.residents.length;
        if (room.currentOccupancy < room.capacity && room.status === 'occupied') {
          room.status = 'available';
        }
        await room.save();
      }
      resident.room = null;
      await resident.save();
    }

    res.status(200).json({ success: true, message: 'Resident deallocated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to deallocate resident.' });
  }
});

module.exports = router;
