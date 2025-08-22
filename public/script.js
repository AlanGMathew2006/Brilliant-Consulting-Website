// public/script.js

async function handleBookingSubmit(event) {
  event.preventDefault();

  // Get form values (update selectors as needed)
  const date = document.getElementById('date').value;
  const timeSlot = document.getElementById('timeSlot').value;
  const notes = document.getElementById('notes').value;
  const consultationType = document.getElementById('consultationType').value;

  // 1. Book appointment (store in session)
  const bookRes = await fetch('/appointments/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, timeSlot, notes, consultationType })
  });

  if (!bookRes.ok) {
    alert('Error booking appointment');
    return;
  }

  // 2. Create Stripe session
  const payRes = await fetch('/payments/create-checkout-session', { method: 'POST' });
  const data = await payRes.json();

  if (data.url) {
    window.location.href = data.url; // Redirect to Stripe Checkout
  } else {
    alert('Error: ' + (data.error || 'Invalid response from server'));
  }
}

// Attach to your booking form (update the form ID as needed)
document.getElementById('bookingForm').addEventListener('submit', handleBookingSubmit);