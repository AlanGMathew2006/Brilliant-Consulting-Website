const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');

console.log('🔧 Appointment routes loaded!');

// GET: Fetch user's appointments
router.get('/', async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
    return res.status(401).json([]);
  }
  const appointments = await Appointment.find({
    user: req.session.user._id,
    status: 'booked'
  });

  // Convert to FullCalendar event format
  const events = appointments.map(app => ({
    id: app._id,
    title: app.timeSlot, // <-- Just the time slot, no extra formatting
    start: app.date,
    consultationType: app.consultationType,
    notes: app.notes,
    status: app.status
  }));

  res.json(events);
});

// POST: Book an appointment
router.post('/book', async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
    return res.status(401).send('Not logged in');
  }
  const appointment = new Appointment({
    user: req.session.user._id,
    date: req.body.date,
    timeSlot: req.body.timeSlot,
    status: 'booked',
    notes: req.body.notes,
    consultationType: req.body.consultationType
  });
  await appointment.save();
  res.send('Appointment booked!');
});

// DELETE: Cancel an appointment
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!req.session.user || !req.session.user._id) {
    return res.status(401).send('Login required');
  }

  try {
    const result = await Appointment.updateOne(
      { _id: new mongoose.Types.ObjectId(id), user: req.session.user._id },
      { $set: { status: 'cancelled' } }
    );

    if (result.matchedCount === 0 && result.n === 0) {
      return res.status(404).send('Appointment not found');
    }

    res.send('Appointment cancelled successfully');
  } catch (err) {
    console.error('Cancel appointment error:', err);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;
