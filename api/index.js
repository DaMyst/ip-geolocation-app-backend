const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('../routes/auth');
const geoRoutes = require('../routes/geolocation');
const historyRoutes = require('../routes/history');
const userLoginRoutes = require('../routes/userLogins');
const { errorHandler } = require('../middleware/errorHandler');

// Create Express app
const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.options('*', cors(corsOptions));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Initialize routes
app.use('/api/auth', authRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/user-logins', userLoginRoutes);

// Error handling middleware
app.use(errorHandler);

// This is the Vercel serverless function handler
module.exports = async (req, res) => {
  // Connect to the database if not already connected
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
  
  // Handle the request
  return app(req, res);
};
