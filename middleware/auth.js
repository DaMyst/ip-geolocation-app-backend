const jwt = require('jsonwebtoken');
// Import the User model correctly
const { User } = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      console.log('No Authorization header found');
      return res.status(401).json({ 
        success: false, 
        error: 'No authentication token provided' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.log('No token found in Authorization header');
      return res.status(401).json({ 
        success: false, 
        error: 'No authentication token provided' 
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError.message);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    const user = await User.findOne({ _id: decoded.userId });
    if (!user) {
      console.log(`User not found for ID: ${decoded.userId}`);
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Check if token is in user's tokens array (if you're tracking tokens)
    if (user.tokens && !user.tokens.some(t => t.token === token)) {
      console.log('Token not found in user\'s token list');
      return res.status(401).json({ 
        success: false, 
        error: 'Session expired' 
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

module.exports = auth;
