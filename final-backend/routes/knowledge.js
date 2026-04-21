const express = require('express');
const router = express.Router();
const BookKnowledge = require('../models/BookKnowledge');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// POST /api/knowledge/add
router.post('/add', protect, async (req, res) => {
  try {
    const { bookId, topic } = req.body;
    
    // Safety check: only if completed (returned) in history
    const history = await Transaction.findOne({
      userId: req.user.id,
      bookId,
      status: 'returned'
    });

    if (!history) {
      return res.status(403).json({ message: 'You must complete reading this book before sharing knowledge.' });
    }

    const knowledge = await BookKnowledge.create({
      book_id: bookId,
      student_id: req.user.id,
      topic
    });

    res.status(201).json(knowledge);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/knowledge/:book_id
router.get('/:book_id', protect, async (req, res) => {
  try {
    const experts = await BookKnowledge.find({ book_id: req.params.book_id })
      .populate('student_id', 'name rollNumber'); // Assuming rollNumber exists in User model
    res.json(experts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/knowledge/search?topic=xyz
router.get('/search', protect, async (req, res) => {
  try {
    const { topic } = req.query;
    const results = await BookKnowledge.find({ topic: { $regex: topic, $options: 'i' } })
      .populate('student_id', 'name')
      .populate('book_id', 'title');
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
