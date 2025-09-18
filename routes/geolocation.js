import express from 'express';
import axios from 'axios';
import { body, validationResult } from 'express-validator';
import auth from '../middleware/auth.js';
import History from '../models/History.js';
import requestIp from 'request-ip';

const router = express.Router();

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

    // Save to history using the saveToHistory helper
    const result = await saveToHistory(req.user._id, ip, geoData);
    
    if (!result) {
      throw new Error('Failed to save search to history');
    }
    
    console.log('Successfully saved search to history:', result._id);
    
    res.json({ 
      success: true, 
      message: 'Search saved to history',
      historyItem: result
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
    
    return {
      ip: response.data.query,
      country: response.data.country,
      countryCode: response.data.countryCode,
      region: response.data.regionName,
      regionCode: response.data.region,
      city: response.data.city,
      zip: response.data.zip,
      lat: response.data.lat,
      lon: response.data.lon,
      timezone: response.data.timezone,
      isp: response.data.isp,
      org: response.data.org,
      as: response.data.as
    };
  } catch (error) {
    console.error('Error getting geolocation data:', error.message);
    throw new Error('Failed to retrieve geolocation data');
  }
}

// Helper function to save IP lookup to history
async function saveToHistory(userId, ip, geoData) {
  try {
    console.log('Saving to history:', { 
      userId: userId.toString(), 
      ip, 
      hasGeoData: !!geoData,
      timestamp: new Date().toISOString()
    });
    
    const historyData = {
      user: userId,
      ipAddress: ip,
      location: {
        country: geoData.country,
        region: geoData.region,
        city: geoData.city,
        coordinates: {
          lat: geoData.lat,
          lng: geoData.lon
        }
      },
      isp: geoData.isp,
      timestamp: new Date(),
      geoData // Store the full geoData for backward compatibility
    };
    
    console.log('History item to save:', JSON.stringify(historyData, null, 2));
    
    const result = await History.findOneAndUpdate(
      { user: userId, ip },
      { 
        $set: historyData,
        $setOnInsert: { createdAt: new Date() }
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
      ip: result?.ipAddress,
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
}

export default router;
