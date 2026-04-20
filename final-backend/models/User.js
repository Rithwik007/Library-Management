const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  role:       { type: String, enum: ['admin', 'faculty', 'student'], required: true },
  employeeId: { type: String },
  studentId:  { type: String },
  department: { type: String },
  phone:      { type: String },
  isActive:   { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
