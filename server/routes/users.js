const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const PROTECTED_USERNAME = 'admin';

// All routes require auth + admin
router.use(protect, adminOnly);

// GET /api/users — list all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users — create a new user
router.post('/', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = await User.create({
      username,
      passwordHash,
      role: role === 'admin' ? 'admin' : 'standard',
    });

    res.status(201).json({ id: user._id, username: user.username, role: user.role, createdAt: user.createdAt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id/role — change a user's role
router.put('/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'standard'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin or standard' });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (target.username === PROTECTED_USERNAME) {
      return res.status(403).json({ message: 'This account cannot be modified' });
    }

    target.role = role;
    await target.save();
    res.json({ _id: target._id, username: target.username, role: target.role, createdAt: target.createdAt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id — delete a user
router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (target.username === PROTECTED_USERNAME) {
      return res.status(403).json({ message: 'This account cannot be deleted' });
    }

    await target.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
