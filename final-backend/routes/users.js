const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorizeRoles } = require('../middleware/auth');

// GET /api/users — get all users except admin
router.get('/', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
        console.log(`[GET /api/users] Found ${users.length} users`);
        res.json(users);
    } catch (err) {
        console.error(`[GET /api/users] Error:`, err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/users/subscribe - save push subscription
router.post('/subscribe', protect, async (req, res) => {
    try {
        const { subscription } = req.body;
        if (!subscription) return res.status(400).json({ message: 'Missing subscription' });

        await User.findByIdAndUpdate(req.user.id, { pushSubscription: subscription });
        res.status(200).json({ message: 'Subscription saved successfully.' });
    } catch (err) {
        console.error(`[POST /api/users/subscribe] Error:`, err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
