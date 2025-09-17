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
const allowedOrigins = [
  'http://localhost:3000',
  'https://ip-geolocation-app-frontend.vercel.app',
  'https://ip-geolocation-app.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200
};

// Handle preflight requests
app.options('*', cors(corsOptions));

// Enable CORS for all routes
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

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
