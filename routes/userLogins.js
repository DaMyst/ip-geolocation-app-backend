const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
// Import the UserLogin model correctly
const { UserLogin } = require('../models/UserLogin');
const axios = require('axios');

// @route   GET /api/user-logins
// @desc    Get user's login history
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching login history for user:', req.user._id);
    const logins = await UserLogin.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`Found ${logins.length} login records for user ${req.user._id}`);
    // Wrap the logins array in a 'logins' property to match frontend expectations
    res.json({ success: true, logins });
  } catch (error) {
    console.error('Error fetching login history:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id
    });
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching login history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/user-logins/track
// @desc    Track a user login
// @access  Public (will be called from auth route)
router.post('/track', async (req, res) => {
  try {
    const { userId, ipAddress, userAgent } = req.body;
    
    if (!userId || !ipAddress) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Get geolocation data for the IP
    let location = {};
    try {
      const response = await axios.get(`http://ip-api.com/json/${ipAddress}?fields=status,message,country,regionName,city,lat,lon,timezone,query`);
      if (response.data.status === 'success') {
        location = {
          city: response.data.city,
          region: response.data.regionName,
          country: response.data.country,
          loc: `${response.data.lat},${response.data.lon}`,
          timezone: response.data.timezone
        };
      }
    } catch (geoError) {
      console.error('Error getting geolocation for login:', geoError);
      // Continue even if geolocation fails
    }

    // Create new login record
    const login = new UserLogin({
      user: userId,
      ipAddress,
      userAgent: userAgent || 'Unknown',
      location,
      isCurrent: true
    });

    await login.save();
    
    res.json({ success: true, login });
  } catch (error) {
    console.error('Error tracking login:', error);
    res.status(500).json({ success: false, error: 'Error tracking login' });
  }
});

module.exports = router;
