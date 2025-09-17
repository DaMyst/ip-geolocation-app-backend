const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UserLogin = require('../models/UserLogin');

// @route   GET /api/login-history
// @desc    Get user's login history
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const loginHistory = await UserLogin.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
      
    res.json({ success: true, data: loginHistory });
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
