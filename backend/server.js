const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const seedInitialData = require('./seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    service: 'Smart PG Management Backend API'
  });
});

// Database Connection with MongoDB Atlas & in-memory fallback
async function connectDB() {
  let mongoUri = process.env.MONGODB_URI;

  if (mongoUri && mongoUri.trim() !== '') {
    try {
      console.log('Connecting to MongoDB Atlas at URI...');
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB Atlas successfully!');
      await seedInitialData();
      return;
    } catch (err) {
      console.error('Atlas connection failed. Falling back to local memory server...', err.message);
    }
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const fallbackUri = mongod.getUri();
    console.log(`Connected to Local Embedded MongoDB: ${fallbackUri}`);
    await mongoose.connect(fallbackUri);
    console.log('MongoDB connection ready.');
    await seedInitialData();
  } catch (memErr) {
    console.error('Failed to initialize MongoDB:', memErr);
  }
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Smart PG Server running on port ${PORT}`);
  });
});
