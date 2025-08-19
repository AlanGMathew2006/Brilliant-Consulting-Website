const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
  const { date, timeSlot, notes, consultationType } = req.body;
  if (!req.session.user || !req.session.user._id) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  // Save booking info in session for later use after payment
  req.session.pendingBooking = { date, timeSlot, notes, consultationType };

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Consultation: ${consultationType || 'General'}`
        },
        unit_amount: 5000 // $50.00 in cents
      },
      quantity: 1
    }],
    customer_email: req.session.user.email,
    success_url: `${process.env.BASE_URL}/payments/payment-success`,
    cancel_url: `${process.env.BASE_URL}/home`
  });

  res.json({ url: session.url });
});

module.exports = router;