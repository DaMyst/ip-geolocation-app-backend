import express from 'express';
import auth from '../middleware/auth.js';
import History from '../models/History.js';

const router = express.Router();

// @route   GET /api/history
// @desc    Get user's search history
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching history for user:', req.user._id);
    const history = await History.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-geoData -__v');
    
    console.log('Found history items:', history.length);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching history:', {
      message: error.message,
      stack: error.stack,
      user: req.user?._id
    });
    res.status(500).json({ success: false, error: 'Error fetching search history' });
  }
});

// @route   GET /api/history/:id
// @desc    Get search history item by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const historyItem = await History.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!historyItem) {
      return res.status(404).json({ success: false, error: 'History item not found' });
    }

    res.json({ 
      success: true, 
      history: {
        ip: historyItem.ip,
        ...historyItem.geoData,
        createdAt: historyItem.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching history item:', error);
    res.status(500).json({ success: false, error: 'Error fetching history item' });
  }
});

// @route   DELETE /api/history/:id
// @desc    Delete a history item
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const historyItem = await History.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!historyItem) {
      return res.status(404).json({ success: false, error: 'History item not found' });
    }

    res.json({ success: true, message: 'History item deleted' });
  } catch (error) {
    console.error('Error deleting history item:', error);
    res.status(500).json({ success: false, error: 'Error deleting history item' });
  }
});

// @route   DELETE /api/history
// @desc    Delete multiple history items
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide an array of history item IDs to delete' 
      });
    }

    const result = await History.deleteMany({
      _id: { $in: ids },
      user: req.user._id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No matching history items found to delete' 
      });
    }

    res.json({ 
      success: true, 
      message: `Successfully deleted ${result.deletedCount} history items` 
    });
  } catch (error) {
    console.error('Error deleting history items:', error);
    res.status(500).json({ success: false, error: 'Error deleting history items' });
  }
});

export default router;
