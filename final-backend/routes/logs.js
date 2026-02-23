const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { protect, authorizeRoles } = require('../middleware/auth');

// GET /api/logs — admin sees all, others see their own
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') query = { userId: req.user.id };
    const logs = await ActivityLog.find(query).sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
