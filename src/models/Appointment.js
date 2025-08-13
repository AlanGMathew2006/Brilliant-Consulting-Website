
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  notes: { type: String, default: '' },
  consultationType: { type: String, default: 'General' },
  status: { type: String, enum: ['booked', 'cancelled', 'completed'], default: 'booked' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);

