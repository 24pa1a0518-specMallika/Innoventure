const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken, requireRole } = require('../middleware/auth');

// UPLOAD ID PROOF / DOCUMENT (Resident)
router.post('/upload', authenticateToken, requireRole('resident'), (req, res) => {
  upload.single('document')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload failed.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please attach a document file (JPG, PNG, PDF <= 1MB).' });
    }

    try {
      const { docType } = req.body;
      const user = await User.findById(req.user._id);

      // Remove older file if existed
      if (user.idProof && user.idProof.filePath) {
        const oldPath = path.join(__dirname, '..', user.idProof.filePath);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      user.idProof = {
        docType: docType || 'Aadhaar / Passport',
        filePath: `uploads/${req.file.filename}`,
        fileName: req.file.originalname,
        uploadedAt: new Date()
      };
      user.verificationStatus = 'pending';
      user.verificationNote = 'Document uploaded. Awaiting owner verification.';
      await user.save();

      // Notify owners
      const owners = await User.find({ role: 'owner' });
      for (const owner of owners) {
        await Notification.create({
          recipient: owner._id,
          title: 'New Document Uploaded for Verification',
          message: `${user.name} uploaded ${user.idProof.docType} for verification.`,
          type: 'verification'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Document uploaded successfully and queued for owner verification!',
        idProof: user.idProof,
        verificationStatus: user.verificationStatus
      });
    } catch (error) {
      console.error('Doc upload error:', error);
      res.status(500).json({ success: false, message: 'Internal server error processing document.' });
    }
  });
});

// GET RESIDENT DOCUMENT SECURELY (Resident themselves or PG Owner)
router.get('/file/:userId', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    // Authorization check: User can access own doc, or owner can access any resident doc
    if (req.user.role !== 'owner' && req.user._id.toString() !== targetUserId) {
      return res.status(403).json({ success: false, message: 'Access denied: unauthorized to view this document.' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser || !targetUser.idProof || !targetUser.idProof.filePath) {
      return res.status(404).json({ success: false, message: 'No document found for this user.' });
    }

    const filePath = path.join(__dirname, '..', targetUser.idProof.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server.' });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving document file.' });
  }
});

// OWNER VERIFY OR REJECT DOCUMENT (Owner only)
router.put('/verify/:userId', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be verified or rejected.' });
    }

    const resident = await User.findById(req.params.userId);
    if (!resident || resident.role !== 'resident') {
      return res.status(404).json({ success: false, message: 'Resident not found.' });
    }

    resident.verificationStatus = status;
    resident.verificationNote = note || (status === 'verified' ? 'Identity verified by PG owner.' : 'Document rejected. Please upload a clear copy.');
    await resident.save();

    await Notification.create({
      recipient: resident._id,
      title: status === 'verified' ? 'ID Proof Verified! ✅' : 'ID Proof Rejected ⚠️',
      message: resident.verificationNote,
      type: 'verification'
    });

    res.status(200).json({
      success: true,
      message: `Document status updated to ${status}!`,
      resident
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating verification status.' });
  }
});

module.exports = router;
