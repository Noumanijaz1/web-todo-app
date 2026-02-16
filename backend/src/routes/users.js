const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/user');

const router = express.Router();

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
