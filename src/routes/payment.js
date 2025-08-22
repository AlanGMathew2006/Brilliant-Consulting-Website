require('dotenv').config();
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Appointment = require('../models/Appointment');
const { sendEmail } = require('../utils/mailer');

router.post('/create-checkout-session', async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  // Use pending booking from session
  const pending = req.session.pendingBooking;
  console.log('Pending booking in session:', req.session.pendingBooking);
  if (!pending) {
    return res.status(400).json({ error: 'No pending booking found' });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Consultation: ${pending.consultationType || 'General'}`
        },
        unit_amount: 5000 // $50.00 in cents
      },
      quantity: 1
    }],
    customer_email: req.session.user.email,
    success_url: `${process.env.BASE_URL}/payments/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/home`,
    metadata: {
      user: req.session.user._id, // This should be req.session.user._id
      date: pending.date,
      timeSlot: pending.timeSlot,
      notes: pending.notes,
      consultationType: pending.consultationType,
      userEmail: req.session.user.email,
      userFullName: req.session.user.fullName || ''
    }
  });

  res.json({ url: session.url });
});

router.get('/payment-success', async (req, res) => {
  const session_id = req.query.session_id;
  if (!session_id) return res.redirect('/calendar');

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Prevent duplicate appointments if user refreshes
    const existing = await Appointment.findOne({
      date: session.metadata.date,
      timeSlot: session.metadata.timeSlot,
      userEmail: session.metadata.userEmail
    });
    if (existing) return res.redirect('/home');

    // Create appointment in DB
    const appointment = await Appointment.create({
      user: session.metadata.user, // This must match req.session.user._id
      date: session.metadata.date,
      timeSlot: session.metadata.timeSlot,
      notes: session.metadata.notes,
      consultationType: session.metadata.consultationType,
      userEmail: session.metadata.userEmail,
      paymentStatus: 'paid',
      status: 'confirmed'
    });

    // Generate call link (example: Jitsi)
    const callLink = `https://meet.jit.si/${appointment._id}`;
    appointment.callLink = callLink;
    await appointment.save();

    // Send emails
    await sendEmail(
      session.metadata.userEmail,
      'Your Appointment is Confirmed',
      `Your appointment is booked! Join your call here: ${callLink}`
    );
    await sendEmail(
      process.env.ADMIN_EMAIL,
      'New Appointment Booked',
      `A new appointment was booked. Join link: ${callLink}`
    );

    // Redirect to calendar
    res.redirect('/home');
  } catch (err) {
    console.error('Payment success error:', err);
    res.redirect('/home?error=payment'); // also update this line
  }
});


module.exports = router;