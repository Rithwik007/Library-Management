const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');
const { protect, authorizeRoles } = require('../middleware/auth');

// GET /api/stats — admin overview stats
router.get('/', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const totalBooks = await Book.countDocuments();
        const availBooks = await Book.aggregate([
            { $group: { _id: null, total: { $sum: "$availableCopies" } } }
        ]);
        const totalLogs = await Transaction.countDocuments();

        // Get today's date string in en-GB format as used in models (e.g., "24 Feb 2026")
        const options = {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        };
        const todayStr = new Intl.DateTimeFormat('en-GB', options).format(new Date()).replace(',', '');

        // ActivityLog uses this string format in 'timestamp' or 'createdAt'
        // We'll search for logs that start with today's date string
        const todayLogsCount = await ActivityLog.countDocuments({
            timestamp: { $regex: `^${todayStr}` }
        });

        console.log(`[GET /api/stats] totalBooks: ${totalBooks}, totalLogs: ${totalLogs}`);
        res.json({
            totalBooks,
            availableBooks: availBooks.length > 0 ? availBooks[0].total : 0,
            totalLogs,
            todayLogs: todayLogsCount
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
