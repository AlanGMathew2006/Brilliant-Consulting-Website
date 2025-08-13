const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');

console.log('🔧 Appointment routes loaded!');

// GET: Fetch user's appointments
router.get('/', async (req, res) => {
  const userName = req.session.userName;

  if (!userName) return res.status(401).json({ error: 'Login required' });

  try {
    // Get all appointments for the logged-in user (not cancelled)
    const userAppointments = await Appointment.find({
      userName: userName,
      status: { $ne: 'cancelled' }
    });

    // Format appointments for FullCalendar
    const events = userAppointments.map(appointment => ({
      id: appointment._id.toString(),
      title: appointment.timeSlot,
      start: appointment.date, // Assuming date is already in YYYY-MM-DD format
      backgroundColor: '#4DB8FF',
      borderColor: '#4DB8FF',
      extendedProps: {
        notes: appointment.notes,
        status: appointment.status,
        timeSlot: appointment.timeSlot
      }
    }));

    res.json(events);
  } catch (err) {
    console.error('Fetch appointments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST: Book an appointment
router.post('/book', async (req, res) => {
  try {
    const { date, timeSlot, notes, consultationType } = req.body;
    if (!req.session.userName) {
      return res.status(401).json({ success: false, error: 'Not logged in' });
    }
    const newAppointment = new Appointment({
      userName: req.session.userName,
      date,
      timeSlot,
      notes: notes || '',
      consultationType: consultationType || 'General',
      status: 'booked'
    });
    const savedAppointment = await newAppointment.save();
    res.json({
      success: true,
      message: 'Appointment booked successfully!',
      appointment: savedAppointment
    });
  } catch (error) {
    console.error('❌ Appointment booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to book appointment: ' + error.message
    });
  }
});

// DELETE: Cancel an appointment
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userName = req.session.userName;

  if (!userName) return res.status(401).send('Login required');

  try {
    const result = await Appointment.updateOne(
      { _id: new mongoose.Types.ObjectId(id), userName: userName },
      { $set: { status: 'cancelled' } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send('Appointment not found');
    }

    res.send('Appointment cancelled successfully');
  } catch (err) {
    console.error('Cancel appointment error:', err);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;
