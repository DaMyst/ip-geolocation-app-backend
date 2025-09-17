const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const History = require('../models/History');
const requestIp = require('request-ip');

// @route   GET /api/geo/my-location
// @desc    Get current user's location by IP
// @access  Private
router.get('/my-location', auth, async (req, res) => {
  try {
    // Get client IP from request
    const clientIp = requestIp.getClientIp(req) || '';
    
    // If no IP found in request, use a default IP
    const ipToCheck = clientIp === '::1' || clientIp === '127.0.0.1' ? '8.8.8.8' : clientIp;
    
    // Get geolocation data from ip-api.com
    const geoData = await getGeolocationData(ipToCheck);
    
    // Save to history
    await saveToHistory(req.user._id, ipToCheck, geoData);
    
    res.json({ success: true, ip: ipToCheck, ...geoData });
  } catch (error) {
    console.error('Error getting location:', error);
    res.status(500).json({ success: false, error: 'Error getting location data' });
  }
});

// @route   GET /api/geo/lookup
// @desc    Lookup geolocation by IP
// @access  Private
router.get(
  '/lookup',
  [
    auth,
    body('ip').notEmpty().withMessage('IP address is required')
      .matches(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)
      .withMessage('Invalid IP address format')
  ],
  async (req, res) => {
    try {
      console.log('Lookup request received:', {
        user: req.user?._id,
        query: req.query,
        timestamp: new Date().toISOString()
      });
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { ip } = req.query;
      console.log('Looking up IP:', ip, 'for user:', req.user._id);
      
      // Get geolocation data
      console.log('Fetching geolocation data for IP:', ip);
      const geoData = await getGeolocationData(ip);
      console.log('Received geolocation data:', JSON.stringify(geoData, null, 2));
      
      // Save to history
      console.log('Attempting to save to history...');
      const savedHistory = await saveToHistory(req.user._id, ip, geoData);
      
      if (!savedHistory) {
        console.error('Failed to save to history for IP:', ip);
      } else {
        console.log('Successfully saved to history:', savedHistory._id);
      }
      
      res.json({ success: true, ip, ...geoData });
    } catch (error) {
      console.error('Error looking up IP:', error);
      res.status(500).json({ success: false, error: 'Error looking up IP address' });
    }
  }
);

// Helper function to get geolocation data from ip-api.com
async function getGeolocationData(ip) {
  try {
    const response = await axios.get(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
      { timeout: 5000 }
    );
    
    if (response.data.status === 'fail') {
      console.error('IP API Error:', response.data.message);
      throw new Error(response.data.message);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching geolocation data:', error.message);
    throw error;
  }
};

// Helper function to save IP lookup to history
const saveToHistory = async (userId, ip, geoData) => {
  try {
    console.log('Saving to history:', { 
      userId: userId.toString(), 
      ip, 
      hasGeoData: !!geoData,
      timestamp: new Date().toISOString()
    });
    
    const historyItem = new History({
      user: userId,
      ip,
      geoData
    });
    
    console.log('History item to save:', JSON.stringify(historyItem, null, 2));
    
    const result = await History.findOneAndUpdate(
      { user: userId, ip },
      { 
        $set: {
          user: userId, 
          ip, 
          geoData,
          updatedAt: new Date()
        }
      },
      { 
        upsert: true, 
        new: true, 
        setDefaultsOnInsert: true,
        runValidators: true
      }
    );
    
    console.log('Successfully saved to history:', { 
      id: result?._id, 
      ip: result?.ip,
      savedAt: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    console.error('Error saving to history:', {
      message: error.message,
      stack: error.stack,
      userId,
      ip
    });
    // Don't fail the request if history save fails
    return null;
  }
};

// @route   POST /api/geo/save-search
// @desc    Save IP lookup to search history
// @access  Private
router.post('/save-search', auth, async (req, res) => {
  try {
    const { ip, geoData } = req.body;
    
    if (!ip || !geoData) {
      return res.status(400).json({ 
        success: false, 
        error: 'IP and geoData are required' 
      });
    }

    console.log('Saving search to history:', { 
      userId: req.user._id, 
      ip, 
      geoData: !!geoData 
    });

    // Save to history
    const historyItem = new History({
      user: req.user._id,
      ip,
      geoData
    });

    await historyItem.save();
    
    console.log('Successfully saved search to history:', historyItem._id);
    
    res.json({ 
      success: true, 
      message: 'Search saved to history',
      historyItem
    });
  } catch (error) {
    console.error('Error saving search to history:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      body: req.body
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save search to history' 
    });
  }
});

module.exports = router;
