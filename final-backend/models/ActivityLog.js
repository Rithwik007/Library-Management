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

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  userRole: { type: String },
  action: { type: String },
  bookTitle: { type: String },
  details: { type: String },
  timestamp: { type: String, default: getISTString },
  createdAt: { type: String, default: getISTString }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema, 'activityLogs');
