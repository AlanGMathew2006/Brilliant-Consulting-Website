require('dotenv').config();
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Appointment = require('../models/Appointment');
const sendEmail = require('../utils/mailer');

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
      user: req.session.user._id,
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
      status: 'booked'
    });

    // Generate call link (example: Jitsi)
    const callLink = `https://meet.jit.si/${appointment._id}`;
    appointment.callLink = callLink;
    await appointment.save();

    // Send confirmation email to user
    const userEmail = session.metadata.userEmail;
    console.log('userEmail:', userEmail); // Debug log
    if (userEmail && userEmail.includes('@')) {
      await sendEmail({
        to: userEmail,
        subject: 'Your Appointment is Confirmed',
        text: `Your appointment is booked! Join your call here: ${callLink}`
      });
    } else {
      console.error('No valid user email found for appointment confirmation!');
    }

    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL;
    console.log('adminEmail:', adminEmail); // Debug log
    if (adminEmail && adminEmail.includes('@')) {
      await sendEmail({
        to: adminEmail,
        subject: 'New Appointment Booked',
        text: `A new appointment was booked. Join link: ${callLink}`
      });
    } else {
      console.error('No valid admin email found for appointment notification!');
    }

    return res.redirect('/home');
  } catch (err) {
    console.error('Payment success error:', err);
    return res.redirect('/home?error=payment');
  }
});

module.exports = router;