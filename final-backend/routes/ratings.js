const express = require('express');
const router = express.Router();
const BookRating = require('../models/BookRating');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');
const mongoose = require('mongoose');

// POST /api/ratings/rate
router.post('/rate', protect, async (req, res) => {
  try {
    const { bookId, rating } = req.body;
    const studentId = req.user.id;

    // Safety check: only if completed (returned) in history
    const history = await Transaction.findOne({
      userId: studentId,
      bookId,
      status: 'returned'
    });

    if (!history) {
      return res.status(403).json({ message: 'You must complete reading this book before rating it.' });
    }

    // Upsert rating
    await BookRating.findOneAndUpdate(
      { book_id: bookId, student_id: studentId },
      { rating },
      { upsert: true, new: true }
    );

    // Recalculate avg_rating and rating_count for the book
    const bookObjectId = new mongoose.Types.ObjectId(bookId);
    const stats = await BookRating.aggregate([
      { $match: { book_id: bookObjectId } },
      { $group: { _id: '$book_id', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
      await Book.findByIdAndUpdate(bookId, {
        avg_rating: Math.round(stats[0].avg * 10) / 10,
        rating_count: stats[0].count
      });
    }

    res.json({ message: 'Rating submitted successfully', stats: stats[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/ratings/:book_id
router.get('/:book_id', protect, async (req, res) => {
  try {
    const book = await Book.findById(req.params.book_id).select('avg_rating rating_count');
    const individualRatings = await BookRating.find({ book_id: req.params.book_id })
      .populate('student_id', 'name')
      .sort({ created_at: -1 });
      
    res.json({ book, individualRatings });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
