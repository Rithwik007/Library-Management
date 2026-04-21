const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  bookNumber:      { type: String },
  title:           { type: String, required: true },
  author:          { type: String },
  publisher:       { type: String },
  source:          { type: String },
  dateAdded:       { type: String },
  totalCopies:     { type: Number, default: 1 },
  availableCopies: { type: Number, default: 1 },
  avg_rating:      { type: Number, default: 0 },
  rating_count:    { type: Number, default: 0 },
  status:          { type: String, default: 'available' }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema, 'books');
