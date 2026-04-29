const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  requester_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expert_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  topic: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'done'], default: 'pending' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
