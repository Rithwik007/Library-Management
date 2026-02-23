const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const ActivityLog = require('../models/ActivityLog');
const { protect, authorizeRoles } = require('../middleware/auth');

const getISTString = (date = new Date()) => {
  const options = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  return new Intl.DateTimeFormat('en-GB', options).format(date).replace(',', '');
};

// POST /api/transactions/borrow — only faculty/admin can borrow
router.post('/borrow', protect, authorizeRoles('faculty', 'admin'), async (req, res) => {
  try {
    const { bookId } = req.body;
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.availableCopies < 1)
      return res.status(400).json({ message: 'No copies available' });

    // Create transaction
    const due = new Date();
    due.setDate(due.getDate() + 14); // 14 days
    const dueDate = getISTString(due);

    const transaction = await Transaction.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      bookId: book._id,
      bookTitle: book.title,
      bookNumber: book.bookNumber,
      type: 'borrow',
      dueDate,
      status: 'active'
    });

    // Decrease available copies
    await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } });

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'BORROWED',
      bookTitle: book.title,
      details: `Due: ${dueDate.toDateString()}`
    });

    res.json({ message: 'Book borrowed successfully', transaction, dueDate });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/transactions/reading — both faculty and students can read at library
router.post('/reading', protect, async (req, res) => {
  try {
    const { bookId } = req.body;
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.availableCopies < 1)
      return res.status(400).json({ message: 'No copies available for reading' });

    const transaction = await Transaction.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      bookId: book._id,
      bookTitle: book.title,
      bookNumber: book.bookNumber,
      type: 'reading',
      status: 'reading'
    });

    // Decrease available copies
    await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } });

    await ActivityLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'READING',
      bookTitle: book.title,
      details: 'Reading at library'
    });

    res.json({ message: 'Reading session logged', transaction });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/transactions/return — return a borrowed book
router.post('/return', protect, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    await Transaction.findByIdAndUpdate(transactionId, {
      status: 'returned',
      returnedAt: getISTString(),
      updatedAt: getISTString()
    });

    // Increase available copies
    await Book.findByIdAndUpdate(transaction.bookId, { $inc: { availableCopies: 1 } });

    await ActivityLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'RETURNED',
      bookTitle: transaction.bookTitle,
      details: 'Book returned'
    });

    res.json({ message: 'Book returned successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/transactions/my — get my transactions
router.get('/my', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/transactions/all — admin only: get all transactions
router.get('/all', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(200);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
