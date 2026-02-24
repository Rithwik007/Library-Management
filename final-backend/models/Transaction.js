const mongoose = require('mongoose');

const getISTString = () => {
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
  return new Intl.DateTimeFormat('en-GB', options).format(new Date()).replace(',', '');
};

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  userRole: { type: String },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  bookTitle: { type: String },
  bookNumber: { type: String },
  type: { type: String, enum: ['borrow', 'return', 'reading'], required: true },
  lentAt: { type: String, default: getISTString },
  dueDate: { type: String },
  returnedAt: { type: String },
  status: { type: String, enum: ['active', 'returned', 'reading'], default: 'active' },
  createdAt: { type: String, default: getISTString },
  updatedAt: { type: String, default: getISTString }
});

module.exports = mongoose.model('Transaction', transactionSchema, 'transactions');
