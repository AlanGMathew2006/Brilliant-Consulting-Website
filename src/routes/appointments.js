const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');
const sendEmail  = require('../utils/mailer');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

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

// POST: Book an appointment (store pending booking for payment)
router.post('/appointments/book', (req, res) => {
  if (!req.session.user || !req.session.user._id) {
    return res.status(401).send('Not logged in');
  }
  req.session.pendingBooking = {
    user: req.session.user._id,
    date: req.body.date,
    timeSlot: req.body.timeSlot,
    notes: req.body.notes,
    consultationType: req.body.consultationType,
    userEmail: req.session.user.email,
    userFullName: req.session.user.fullName
  };
  res.json({ success: true });
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

    // Send cancellation email
    const appointment = await Appointment.findById(id); // Fetch appointment details
    const user = req.session.user;
    await sendEmail({
      to: [user.email, ADMIN_EMAIL],
      subject: 'Appointment Cancelled',
      text: `Appointment cancelled for ${user.fullName} on ${appointment.date} at ${appointment.timeSlot}.`,
      html: `<p>Appointment cancelled for <b>${user.fullName}</b> on <b>${appointment.date}</b> at <b>${appointment.timeSlot}</b>.</p>`
    });

    res.send('Appointment cancelled successfully');
  } catch (err) {
    console.error('Cancel appointment error:', err);
    res.status(500).send('Internal server error');
  }
});

// GET: Load calendar view
router.get('/calendar', async (req, res) => {
  try {
    const appointments = await Appointment.find({});
    res.render('calendar', { appointments });
  } catch (err) {
    console.error('Calendar error:', err);
    res.status(500).send('Error loading calendar');
  }
});

// Return appointments as JSON for FullCalendar
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.session.user._id }); // or {} for all
    // Map to FullCalendar event format
    const events = appointments.map(app => ({
      id: app._id,
      title: app.timeSlot,
      start: app.date,
      consultationType: app.consultationType,
      notes: app.notes,
      status: app.status,
    }));
    res.json(events);
  } catch (err) {
    console.error('Failed to load appointments:', err);
    res.status(500).json({ error: 'Failed to load appointments' });
  }
});

// Cancel appointment
router.delete('/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndDelete({
      _id: req.params.id,
      user: req.session.user._id // Only allow user to delete their own
    });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    // Send cancellation email
    await sendEmail(
      appointment.userEmail,
      'Appointment Cancelled',
      `Your appointment on ${appointment.date} at ${appointment.timeSlot} has been cancelled.`
    );
    await sendEmail(
      process.env.ADMIN_EMAIL,
      'Appointment Cancelled',
      `Appointment for ${appointment.userEmail} on ${appointment.date} at ${appointment.timeSlot} was cancelled.`
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

module.exports = router;
