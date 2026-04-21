const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const Book = require('../models/Book');
const { protect } = require('../middleware/auth');

// POST /api/appointments/book
router.post('/book', protect, async (req, res) => {
  try {
    const { expert_id, book_id, slot_datetime } = req.body;

    if (expert_id === req.user.id) {
      return res.status(400).json({ message: 'You cannot book an appointment with yourself.' });
    }

    const appointment = await Appointment.create({
      requester_id: req.user.id,
      expert_id,
      book_id,
      slot_datetime
    });

    // Fetch book title for notification
    const book = await Book.findById(book_id);
    const bookTitle = book ? book.title : 'a book';

    // Create notification for expert
    const dateStr = new Date(slot_datetime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    await Notification.create({
      user_id: expert_id,
      message: `${req.user.name} wants to discuss "${bookTitle}" with you on ${dateStr}.`
    });

    res.status(201).json({ message: 'Appointment booked successfully', appointment });
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
    .sort({ slot_datetime: -1 });
    
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

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Only the expert can confirm/accept
    if (appointment.expert_id._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the expert can update status' });
    }

    appointment.status = status;
    await appointment.save();

    // Notify the requester
    if (status === 'confirmed') {
      await Notification.create({
        user_id: appointment.requester_id,
        message: `Expert ${req.user.name} accepted your appointment for "${appointment.book_id.title}". Check "My Appointments" for details.`
      });
    }

    res.json({ message: `Appointment ${status}`, appointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
