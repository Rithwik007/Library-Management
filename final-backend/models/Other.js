const mongoose = require('mongoose');

const otherSchema = new mongoose.Schema({
  otherId:      { type: String, required: true },
  title:        { type: String, required: true },
  description:  { type: String },
  year:         { type: String },
  volumeNumber: { type: String },
  condition:    { type: String, default: 'good' },
  totalCopies:     { type: Number, default: 1 },
  availableCopies: { type: Number, default: 1 },
  addedAt:      { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Other', otherSchema, 'others');
