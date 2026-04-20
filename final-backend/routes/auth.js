const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Simple plain text password check for now
    const isMatch = (password === user.password);

    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });
    if (!user.isActive) return res.status(403).json({ message: 'Account is disabled' });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        studentId: user.studentId
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    const jwt2 = require('jsonwebtoken');
    const decoded = jwt2.verify(token, process.env.JWT_SECRET);
    const User2 = require('../models/User');
    const user = await User2.findById(decoded.id).select('-password');
    res.json(user);
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;