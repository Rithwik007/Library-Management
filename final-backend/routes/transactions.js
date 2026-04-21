const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const Other = require('../models/Other');
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
      details: `Due: ${dueDate}`
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

// POST /api/transactions/borrow-other — only faculty/admin can borrow
router.post('/borrow-other', protect, authorizeRoles('faculty', 'admin'), async (req, res) => {
  try {
    const { otherId } = req.body;
    let item = await Other.findById(otherId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // If specific item is out, look for any available item in the same logical group
    if (item.availableCopies < 1) {
      item = await Other.findOne({ otherId: item.otherId, availableCopies: { $gt: 0 } });
    }

    if (!item)
      return res.status(400).json({ message: `No copies available` });

    const due = new Date();
    due.setDate(due.getDate() + 14);
    const dueDate = getISTString(due);

    const transaction = await Transaction.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      otherId: item._id,
      bookTitle: item.title, // Reuse field for simplicity in history
      bookNumber: item.otherId,
      type: 'borrow',
      dueDate,
      status: 'active'
    });

    await Other.findByIdAndUpdate(item._id, { $inc: { availableCopies: -1 } });

    await ActivityLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'BORROWED_OTHER',
      bookTitle: item.title,
      details: `Borrowed item ${item.otherId}. Due: ${dueDate}`
    });

    res.json({ message: 'Item borrowed successfully', transaction, dueDate });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/transactions/reading-other — both faculty and students can read
router.post('/reading-other', protect, async (req, res) => {
  try {
    const { otherId } = req.body;
    let item = await Other.findById(otherId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // If specific item is out, look for any available item in the same logical group
    if (item.availableCopies < 1) {
      item = await Other.findOne({ otherId: item.otherId, availableCopies: { $gt: 0 } });
    }

    if (!item)
      return res.status(400).json({ message: 'No copies available for reading' });

    const transaction = await Transaction.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      otherId: item._id,
      bookTitle: item.title,
      bookNumber: item.otherId,
      type: 'reading',
      status: 'reading'
    });

    await Other.findByIdAndUpdate(item._id, { $inc: { availableCopies: -1 } });

    await ActivityLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'READING_OTHER',
      bookTitle: item.title,
      details: `Reading item ${item.otherId} at library`
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

    // Increase available copies (for books) or update status (for others)
    if (transaction.bookId) {
      await Book.findByIdAndUpdate(transaction.bookId, { $inc: { availableCopies: 1 } });
    } else if (transaction.otherId) {
      await Other.findByIdAndUpdate(transaction.otherId, { $inc: { availableCopies: 1 } });
    }

    await ActivityLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'RETURNED',
      bookTitle: transaction.bookTitle,
      details: `${transaction.bookId ? 'Book' : 'Item'} returned`
    });

    res.json({ message: 'Returned successfully' });
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

// POST /api/transactions/pay-fine — pay fine and return book
router.post('/pay-fine', protect, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.status !== 'active') return res.status(400).json({ message: 'Transaction is not active' });

    // Calculate fine based on dueDate
    let fineAmount = 0;
    if (transaction.dueDate) {
      // Parse the IST string: "03 Apr 2026 20:00:00"
      const due = new Date(transaction.dueDate.replace(',', ''));
      const now = new Date();
      const diffMs = now - due;
      if (diffMs > 0) {
        const overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        fineAmount = 10 + (overdueDays * 5);
      }
    }

    await Transaction.findByIdAndUpdate(transactionId, {
      status: 'returned',
      fineAmount,
      finePaid: true,
      returnedAt: getISTString(),
      updatedAt: getISTString()
    });

    // Restore availability
    if (transaction.bookId) {
      await Book.findByIdAndUpdate(transaction.bookId, { $inc: { availableCopies: 1 } });
    } else if (transaction.otherId) {
      await Other.findByIdAndUpdate(transaction.otherId, { $inc: { availableCopies: 1 } });
    }

    await ActivityLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'FINE_PAID',
      bookTitle: transaction.bookTitle,
      details: `Fine of ₹${fineAmount} paid and item returned`
    });

    res.json({ message: 'Fine paid and returned successfully', fineAmount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/transactions/fines/my — get my fine history
router.get('/fines/my', protect, async (req, res) => {
  try {
    const fines = await Transaction.find({ userId: req.user.id, finePaid: true })
      .sort({ returnedAt: -1 });
    res.json(fines);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/transactions/fines/all — admin only: all fine payments ever made
router.get('/fines/all', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const fines = await Transaction.find({ finePaid: true })
      .sort({ returnedAt: -1 });
    res.json(fines);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

