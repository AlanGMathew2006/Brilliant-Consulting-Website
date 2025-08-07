// src/controllers/adminController.js
const { getCollection } = require('../config'); // adjust path if needed

exports.getDashboard = async (req, res) => {
  try {
    const db = await getCollection('appointments');
    const bookings = await db.find().sort({ date: 1 }).toArray();

    res.render('admin/dashboard', { bookings });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading dashboard');
  }
};
