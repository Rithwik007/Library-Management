const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { protect } = require('../middleware/auth');

// GET /api/books — get all books (with optional search)
router.get('/', protect, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { title:  { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } },
          { bookNumber: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const books = await Book.find(query).limit(100);
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/books/:id — get single book
router.get('/:id', protect, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
