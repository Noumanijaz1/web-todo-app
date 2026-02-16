const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/user');

const router = express.Router();

// Search users by name or email (any authenticated user, for adding team members etc.)
router.get('/search', protect, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }
    const users = await User.find({
      $or: [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') }
      ]
    }).select('_id name email').limit(10);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all users (admin only)
router.get('/', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins can view all users' 
      });
    }

    const users = await User.find({}).select('_id name email role');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
