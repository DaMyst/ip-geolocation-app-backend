const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { UserLogin } = require('../models/UserLogin');
const auth = require('../middleware/auth');
const requestIp = require('request-ip');
const axios = require('axios');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
    });

    await user.save();
    const token = await user.generateAuthToken();

    res.status(201).json({ success: true, user, token });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  console.log('Login attempt received:', { 
    email: req.body.email,
    hasPassword: !!req.body.password,
    headers: req.headers
  });
  
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();
    
    console.log('User authenticated successfully, tracking login...');
    
    // Track the login
    try {
      // Get the most reliable IP address (prioritize the one from the frontend)
      let ipAddress = req.body.ipAddress;
      
      // If the IP from frontend is local/private, try to get a better one
      if (!ipAddress || ['127.0.0.1', '::1', '0.0.0.0', 'unknown'].includes(ipAddress)) {
        const forwardedFor = req.headers['x-forwarded-for'];
        const realIp = req.headers['x-real-ip'];
        
        if (forwardedFor) {
          ipAddress = forwardedFor.split(',')[0].trim();
        } else if (realIp) {
          ipAddress = realIp;
        } else {
          ipAddress = requestIp.getClientIp(req);
        }
      }
      
      // If we still don't have a valid IP, use a placeholder
      if (!ipAddress || ['127.0.0.1', '::1', '0.0.0.0'].includes(ipAddress)) {
        ipAddress = 'unknown';
      }
      
      const userAgent = req.get('user-agent');
      
      // Create login record
      const login = new UserLogin({
        user: user._id,
        ipAddress,
        userAgent: userAgent || 'Unknown',
        isCurrent: true
      });
      
      // Try to get geolocation data
      try {
        const response = await axios.get(`http://ip-api.com/json/${ipAddress}?fields=status,message,country,regionName,city,lat,lon,timezone,query`);
        if (response.data.status === 'success') {
          login.location = {
            city: response.data.city,
            region: response.data.regionName,
            country: response.data.country,
            loc: `${response.data.lat},${response.data.lon}`,
            timezone: response.data.timezone
          };
        }
      } catch (geoError) {
        console.error('Error getting geolocation for login:', geoError);
        // Continue without geolocation data
      }
      
      console.log('Saving login record:', {
        user: user._id,
        ipAddress,
        userAgent: userAgent || 'Unknown'
      });
      
      console.log('Saving login record:', {
        user: user._id,
        ipAddress,
        userAgent: userAgent || 'Unknown',
        location: login.location || 'No location data'
      });
      
      const savedLogin = await login.save();
      console.log('Login record saved successfully:', savedLogin._id);
      
      // Verify the record was saved
      const verifyLogin = await UserLogin.findById(savedLogin._id);
      console.log('Verified login record exists:', !!verifyLogin);
    } catch (trackError) {
      console.error('Error tracking login:', {
        message: trackError.message,
        stack: trackError.stack,
        user: user._id,
        ipAddress,
        userAgent: userAgent || 'Unknown'
      });
      // Don't fail the login if tracking fails
    }
    
    // Send user data and token in the expected format
    res.json({ 
      success: true, 
      token,
      user: {
        _id: user._id,
        email: user.email
        // Add any other user fields you want to send to the frontend
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Invalid login credentials' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // Return user data in a consistent format
    const userData = {
      _id: req.user._id,
      email: req.user.email,
      // Add any other user fields you want to expose
    };
    
    res.json({ 
      success: true, 
      user: userData 
    });
  } catch (error) {
    console.error('Error in /me endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user data' 
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error logging out' });
  }
});

module.exports = router;
