const express = require('express');
const router = express.Router();
const { getCollection } = require('../config');

// GET: Fetch user's appointments
router.get('/', async (req, res) => {
  const userName = req.session.userName;

  if (!userName) return res.status(401).json({ error: 'Login required' });

  try {
    const appointments = getCollection('appointments');
    
    // Get all appointments for the logged-in user
    const userAppointments = await appointments.find({
      userName: userName,
      status: { $ne: 'cancelled' } // Don't show cancelled appointments
    }).toArray();

    // Format appointments for FullCalendar
    const events = userAppointments.map(appointment => ({
      id: appointment._id.toString(),
      title: appointment.timeSlot,
      start: appointment.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
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
router.post('/', async (req, res) => {
  const { date, timeSlot, notes, consultationType } = req.body;
  const userName = req.session.userName;

  if (!userName) return res.status(401).send('Login required');

  try {
    const appointments = getCollection('appointments');

    // Check for conflict on same date + time slot
    const conflict = await appointments.findOne({
      date: new Date(date),
      timeSlot: timeSlot
    });

    if (conflict) return res.status(400).send('That time slot is already booked.');

    await appointments.insertOne({
      userName,
      date: new Date(date),
      timeSlot,
      notes: notes || '',
      consultationType: consultationType || 'General',
      status: 'confirmed',
      createdAt: new Date()
    });

    res.send('Appointment booked successfully!');
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).send('Internal server error');
  }
});

// DELETE: Cancel an appointment
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userName = req.session.userName;

  if (!userName) return res.status(401).send('Login required');

  try {
    const appointments = getCollection('appointments');
    const { ObjectId } = require('mongodb');

    const result = await appointments.updateOne(
      { _id: new ObjectId(id), userName: userName },
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
