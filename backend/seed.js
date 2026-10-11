const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Room = require('./models/Room');
const Payment = require('./models/Payment');
const Complaint = require('./models/Complaint');
const Booking = require('./models/Booking');
const Attendance = require('./models/Attendance');
const Visitor = require('./models/Visitor');
const Notification = require('./models/Notification');

async function seedInitialData() {
  try {
    const ownerCount = await User.countDocuments({ role: 'owner' });
    if (ownerCount > 0) {
      console.log('Database already initialized.');
      return;
    }

    console.log('Seeding initial demonstration & setup data...');
    const salt = await bcrypt.genSalt(10);
    const ownerPassword = await bcrypt.hash('owner123', salt);
    const residentPassword = await bcrypt.hash('resident123', salt);

    // 1. Create Default Owner
    const owner = await User.create({
      name: 'Rajesh Sharma',
      email: 'owner@smartpg.com',
      phone: '+91 98450 12345',
      password: ownerPassword,
      role: 'owner',
      pgName: 'Smart Stay Executive PG',
      pgAddress: 'Plot 42, HSR Layout Sector 2, Bangalore - 560102'
    });

    // 2. Create Rooms
    const room101 = await Room.create({
      roomNumber: '101',
      floor: 1,
      roomType: 'Single',
      capacity: 1,
      currentOccupancy: 1,
      rentPerMonth: 12000,
      amenities: ['AC', 'WiFi', 'Attached Bathroom', 'Balcony', 'Geyser', 'Wardrobe'],
      status: 'occupied',
      residents: []
    });

    const room102 = await Room.create({
      roomNumber: '102',
      floor: 1,
      roomType: 'Double Sharing',
      capacity: 2,
      currentOccupancy: 1,
      rentPerMonth: 8500,
      amenities: ['WiFi', 'Attached Bathroom', 'Geyser', 'Study Desk', 'Cupboard'],
      status: 'available',
      residents: []
    });

    const room201 = await Room.create({
      roomNumber: '201',
      floor: 2,
      roomType: 'Triple Sharing',
      capacity: 3,
      currentOccupancy: 0,
      rentPerMonth: 6500,
      amenities: ['WiFi', 'Common Balcony', 'Geyser', 'Individual Lockers'],
      status: 'available',
      residents: []
    });

    const room202 = await Room.create({
      roomNumber: '202',
      floor: 2,
      roomType: 'Double Sharing',
      capacity: 2,
      currentOccupancy: 0,
      rentPerMonth: 9000,
      amenities: ['AC', 'WiFi', 'Attached Bathroom', 'Smart TV'],
      status: 'available',
      residents: []
    });

    // 3. Create Default Resident
    const resident = await User.create({
      name: 'Aarav Patel',
      email: 'resident@smartpg.com',
      phone: '+91 99887 76655',
      password: residentPassword,
      role: 'resident',
      room: room101._id,
      emergencyContact: '+91 91234 56789 (Father)',
      address: '24 MG Road, Indore, MP',
      gender: 'male',
      verificationStatus: 'verified',
      verificationNote: 'Aadhaar ID verified by Owner.',
      idProof: {
        docType: 'Aadhaar Card',
        filePath: '',
        fileName: 'aadhaar_aarav.pdf',
        uploadedAt: new Date()
      }
    });

    // Link resident to room 101
    room101.residents = [resident._id];
    await room101.save();

    // 4. Create sample Payment
    await Payment.create({
      resident: resident._id,
      room: room101._id,
      month: 'October 2026',
      amount: 12000,
      paymentType: 'Rent',
      paymentMethod: 'UPI',
      transactionId: 'UPI2026101198273',
      status: 'paid',
      verifiedAt: new Date()
    });

    // 5. Create sample Complaint
    await Complaint.create({
      resident: resident._id,
      title: 'Geyser heating takes too long',
      category: 'Electricity/Water',
      description: 'The geyser in bathroom 101 is taking 20+ minutes to heat up.',
      priority: 'Medium',
      status: 'in-progress',
      resolutionNote: 'Electrician scheduled for inspection on Monday 10 AM.'
    });

    // 6. Create Attendance for today
    const today = new Date().toISOString().split('T')[0];
    await Attendance.create({
      resident: resident._id,
      date: today,
      status: 'Present',
      checkInTime: '08:30 AM',
      remarks: 'Morning bio-metric scan'
    });

    // 7. Create Visitor
    await Visitor.create({
      resident: resident._id,
      visitorName: 'Rohan Verma',
      relationship: 'Friend / Colleague',
      phone: '+91 98112 23344',
      visitDate: today,
      entryTime: '04:15 PM',
      exitTime: '06:00 PM',
      purpose: 'College project discussion',
      status: 'checked-out'
    });

    // 8. Create Notification
    await Notification.create({
      recipient: resident._id,
      title: 'Welcome to Smart PG!',
      message: 'Your room #101 allocation is active. Explore your resident portal!',
      type: 'general'
    });

    console.log('Sample seed data created successfully!');
    console.log('Owner credentials: owner@smartpg.com / owner123');
    console.log('Resident credentials: resident@smartpg.com / resident123');
  } catch (err) {
    console.error('Error seeding data:', err);
  }
}

module.exports = seedInitialData;
