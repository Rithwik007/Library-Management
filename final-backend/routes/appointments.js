const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const Book = require('../models/Book');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const webpush = require('web-push');

// Helper function to send push
const sendPush = async (userId, payload) => {
  try {
    const user = await User.findById(userId);
    if (user && user.pushSubscription) {
      await webpush.sendNotification(user.pushSubscription, JSON.stringify(payload));
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription has expired or is no longer valid
      await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: 1 } });
    }
  }
};

// POST /api/appointments/book (Now Request Knowledge)
router.post('/book', protect, async (req, res) => {
  try {
    const { expert_id, book_id, topic } = req.body;

    if (expert_id === req.user.id) {
      return res.status(400).json({ message: 'You cannot request knowledge from yourself.' });
    }

    const appointment = await Appointment.create({
      requester_id: req.user.id,
      expert_id,
      book_id,
      topic
    });

    // Fetch book title for notification
    const book = await Book.findById(book_id);
    const bookTitle = book ? book.title : 'a book';

    const message = `${req.user.name} requested knowledge on "${topic}" from "${bookTitle}".`;

    // Create DB notification for expert
    await Notification.create({
      user_id: expert_id,
      message
    });

    // Send Push Notification
    await sendPush(expert_id, {
      title: 'New Knowledge Request!',
      body: message,
      url: '/student-dashboard.html'
    });

    res.status(201).json({ message: 'Knowledge requested successfully', appointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/appointments/:user_id
router.get('/:user_id', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      $or: [{ requester_id: req.params.user_id }, { expert_id: req.params.user_id }]
    })
    .populate('requester_id', 'name')
    .populate('expert_id', 'name')
    .populate('book_id', 'title')
    .sort({ created_at: -1 });
    
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/appointments/:id/status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('book_id', 'title')
      .populate('expert_id', 'name');

    if (!appointment) return res.status(404).json({ message: 'Request not found' });

    // Only the expert can confirm/accept
    if (appointment.expert_id._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the expert can update status' });
    }

    appointment.status = status;
    await appointment.save();

    // Notify the requester
    if (status === 'confirmed') {
      const message = `Expert ${req.user.name} accepted your knowledge request for "${appointment.topic}". Check "My Knowledge Requests".`;
      
      await Notification.create({
        user_id: appointment.requester_id,
        message
      });

      await sendPush(appointment.requester_id, {
        title: 'Request Accepted!',
        body: message,
        url: '/student-dashboard.html'
      });
    }

    res.json({ message: `Request ${status}`, appointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
