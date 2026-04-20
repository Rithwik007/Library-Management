const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  roll_number:    { type: String, required: true },
  student_name:   { type: String, required: true },
  project_title:  { type: String, required: true },
  guide_name:     { type: String },
  academic_year:  { type: String }
}, { timestamps: true });

// Mapping to the existing 'Projects' collection (note the case sensitivity)
module.exports = mongoose.model('Project', projectSchema, 'Projects');
