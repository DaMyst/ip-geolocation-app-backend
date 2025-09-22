import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from config/local.env
dotenv.config({ path: path.resolve(process.cwd(), 'config/local.env') });
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from '../routes/auth.js';
import geoRoutes from '../routes/geolocation.js';
import historyRoutes from '../routes/history.js';
import userLoginRoutes from '../routes/userLogins.js';
import { errorHandler } from '../middleware/errorHandler.js';

// Create Express app
const app = express();

// CORS Configuration
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction 
  ? [
      'https://ip-geolocation-app-frontend.vercel.app',
      'https://ip-geolocation-app.vercel.app'
    ]
  : ['http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (isProduction) {
      // In production, only allow specific origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    } else {
      // In development, allow all origins
      return callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// MongoDB Connection
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return; // Already connected
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/user-logins', userLoginRoutes);

// Error handling middleware
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// This is the Vercel serverless function handler
// For Vercel serverless function
async function handler(req, res) {
  // Connect to the database if not already connected
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
  
  // Handle the request
  return app(req, res);
}

// Export for both Vercel and local development
export { handler, connectDB, app as default };
