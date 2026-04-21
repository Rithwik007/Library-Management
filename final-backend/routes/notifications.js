const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// GET /api/notifications/:user_id
router.get('/:user_id', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.params.user_id })
      .sort({ created_at: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { is_read: true }, { new: true });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/notifications/read-all/:user_id
router.patch('/read-all/:user_id', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user_id: req.params.user_id }, { is_read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
