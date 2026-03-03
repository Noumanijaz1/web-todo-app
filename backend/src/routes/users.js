const express = require('express');
const { protect, requireAdmin } = require('../middleware/auth');
const { uploadProfileImage } = require('../middleware/upload');
const User = require('../models/user');

const router = express.Router();

// Get current authenticated user's profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('_id name email role phone dob profileImage createdAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update current authenticated user's profile
router.put('/me', protect, uploadProfileImage, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, phone, dob } = req.body;

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;
    if (dob !== undefined) {
      user.dob = dob ? new Date(dob) : null;
    }
    if (req.file) {
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        profileImage: user.profileImage,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

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
router.get('/', protect, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('_id name email role createdAt');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get one user by id (admin only)
router.get('/:id', protect, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('_id name email role createdAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create user (admin only)
router.post('/', protect, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const validRoles = ['admin', 'project_manager', 'employee'];
    const chosenRole = validRoles.includes(role) ? role : 'employee';
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: chosenRole
    });
    res.status(201).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user (admin only)
router.put('/:id', protect, requireAdmin, async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email.toLowerCase();
    const validRoles = ['admin', 'project_manager', 'employee'];
    if (role !== undefined) user.role = validRoles.includes(role) ? role : user.role;
    if (password && password.length > 0) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }
      user.password = password;
    }
    await user.save();
    res.status(200).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', protect, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
