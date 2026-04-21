const mongoose = require('mongoose');

const bookRatingSchema = new mongoose.Schema({
  book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  created_at: { type: Date, default: Date.now }
});

// One rating per student per book
bookRatingSchema.index({ book_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('BookRating', bookRatingSchema);
