// routes/appointments.js
const express = require('express');
const router = express.Router();
const { getCollection } = require('../config');

// POST: Book an appointment
router.post('/', async (req, res) => {
  const { date } = req.body;
  const userName = req.session.userName;

  if (!userName) return res.status(401).send('Login required');

  try {
    const appointments = getCollection('appointments');

    const exists = await appointments.findOne({ date: new Date(date) });
    if (exists) return res.status(400).send('Time slot already booked');

    await appointments.insertOne({
      userName,
      date: new Date(date),
      status: 'pending'
    });

    res.send('Appointment booked!');
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;