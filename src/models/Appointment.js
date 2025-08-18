const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // <-- This is required!
  date: Date,
  timeSlot: String,
  status: String,
  notes: String,
  consultationType: String
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);

