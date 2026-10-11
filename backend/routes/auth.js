const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// REGISTER (Resident or Owner)
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, emergencyContact, address, gender, pgName, pgAddress } = req.body;

    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    if (!['resident', 'owner'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be resident or owner.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role,
      emergencyContact: emergencyContact || '',
      address: address || '',
      gender: gender || 'male',
      pgName: pgName || 'Sunrise Luxury PG',
      pgAddress: pgAddress || ''
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || 'smartpg_super_secret_jwt_key_2026_production',
      { expiresIn: '7d' }
    );

    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: userObj
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error while registering user.' });
  }
});

// LOGIN (Resident or Owner)
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate('room');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User does not exist.' });
    }

    // Role check if provided
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Account is registered as ${user.role}, but logging in as ${role}. Please switch tabs.`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'smartpg_super_secret_jwt_key_2026_production',
      { expiresIn: '7d' }
    );

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: userObj
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error while logging in.' });
  }
});

// GET CURRENT USER PROFILE
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('room');
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
});

// UPDATE PROFILE
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { name, phone, emergencyContact, address, gender, pgName, pgAddress } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
    if (address !== undefined) user.address = address;
    if (gender) user.gender = gender;
    if (pgName) user.pgName = pgName;
    if (pgAddress !== undefined) user.pgAddress = pgAddress;

    await user.save();
    const updated = await User.findById(user._id).select('-password').populate('room');

    res.status(200).json({ success: true, message: 'Profile updated successfully!', user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

module.exports = router;
