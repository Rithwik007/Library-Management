const express = require('express');
const router = express.Router();
const Other = require('../models/Other');
const { protect } = require('../middleware/auth');

// Helper to get grouped others
const getGroupedOthers = async (filter = {}) => {
    return await Other.aggregate([
        { $match: filter },
        {
            $group: {
                _id: "$otherId",
                // Pick the first document's internal _id for frontend transaction calls
                id: { $first: "$_id" },
                otherId: { $first: "$otherId" },
                title: { $first: "$title" },
                description: { $first: "$description" },
                year: { $first: "$year" },
                volumeNumber: { $first: "$volumeNumber" },
                condition: { $first: "$condition" },
                totalCopies: { $sum: { $ifNull: ["$totalCopies", 1] } },
                availableCopies: { $sum: { $ifNull: ["$availableCopies", 1] } },
                createdAt: { $max: "$createdAt" }
            }
        },
        // Map back to a clean structure including the picking _id as _id
        {
            $project: {
                _id: "$id",
                otherId: 1,
                title: 1,
                description: 1,
                year: 1,
                volumeNumber: 1,
                condition: 1,
                totalCopies: 1,
                availableCopies: 1,
                createdAt: 1
            }
        },
        { $sort: { createdAt: -1 } }
    ]);
};

// @route   GET /api/others
// @desc    Get all other items (grouped by otherId)
router.get('/', protect, async (req, res) => {
    try {
        const others = await getGroupedOthers();
        res.json(others);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   GET /api/others/search
// @desc    Search other items (grouped by otherId)
router.get('/search', protect, async (req, res) => {
    const { q } = req.query;
    try {
        const searchRegex = new RegExp(q, 'i');
        const filter = {
            $or: [
                { title: searchRegex },
                { description: searchRegex },
                { otherId: searchRegex }
            ]
        };
        const others = await getGroupedOthers(filter);
        res.json(others);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
