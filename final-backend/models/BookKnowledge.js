const mongoose = require('mongoose');

const bookKnowledgeSchema = new mongoose.Schema({
  book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true, index: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BookKnowledge', bookKnowledgeSchema);
