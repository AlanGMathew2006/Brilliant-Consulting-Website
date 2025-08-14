// src/routes/admin.js
const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middlewares/authMiddleware');

// Model imports
const User = require('../models/User');
const Appointment = require('../models/Appointment');

console.log('🔧 Admin routes loaded!' );

// Admin dashboard route (handles GET /admin/)
router.get('/', async (req, res) => {
  console.log('🔐 Admin dashboard accessed from admin.js');
  console.log('   - Session exists:', !!req.session);
  console.log('   - Session user:', req.session.user);

  // Check if user is logged in and is admin
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    console.log('✅ Admin verified - showing dashboard');
    try {
      // Get real statistics from MongoDB
      console.log('📊 Fetching database stats...');
      const totalUsers = await User.countDocuments();
      const totalAppointments = await Appointment.countDocuments();
      const bookedAppointments = await Appointment.countDocuments({ status: 'booked' });
      const canceledAppointments = await Appointment.countDocuments({ status: 'cancelled' });
      const completedAppointments = await Appointment.countDocuments({ status: 'completed' });

      // New sections
      const recentAppointments = await Appointment.find().sort({ createdAt: -1 }).limit(10);
      const users = await User.find();
      const allAppointments = await Appointment.find();
      const thisMonthAppointments = await Appointment.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      });
      const thisMonthUsers = await User.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      });

      console.log('Database results:', { totalUsers, totalAppointments, bookedAppointments });

      // Render dashboard with real data
      res.render('admin/dashboard', {
        userName: req.session.userName || req.session.user.userName,
        user: req.session.user,
        stats: {
          totalUsers: totalUsers || 0,
          totalAppointments: totalAppointments || 0,
          bookedAppointments: bookedAppointments || 0,
          canceledAppointments: canceledAppointments || 0,
          completedAppointments: completedAppointments || 0,
          thisMonthAppointments: thisMonthAppointments || 0,
          thisMonthUsers: thisMonthUsers || 0
        },
        recentAppointments,
        users,
        allAppointments
      });
    } catch(error) {
      console.error('❌ Database error:', error);
      // Fallback to zeros if database error
      res.render('admin/dashboard', {
        userName: req.session.userName || req.session.user.userName,
        user: req.session.user,
        stats: {
          totalUsers: 0,
          totalAppointments: 0,
          bookedAppointments: 0
        }
      });
    }
  } else {
    console.log('❌ Not admin - redirecting to login');
    res.redirect('/');
  }
});

// Delete user route (AJAX)
router.delete('/user/:id', verifyAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete user.' });
  }
});

// Update user info
router.put('/user/:id', verifyAdmin, async (req, res) => {
  try {
    const {
      fullName, email, phoneNumber, companyName,
      serviceInterest, projectDescription, role, notes
    } = req.body;
    await User.findByIdAndUpdate(req.params.id, {
      fullName, email, phoneNumber, companyName,
      serviceInterest, projectDescription, role, notes
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update user.' });
  }
});

// Reset password (send reset email or set temp password)
router.post('/user/:id/reset-password', verifyAdmin, async (req, res) => {
  try {
    // Example: set a temporary password (or integrate with your email system)
    const tempPassword = Math.random().toString(36).slice(-8);
    await User.findByIdAndUpdate(req.params.id, { password: tempPassword });
    // TODO: Send email to user with tempPassword (integrate with nodemailer)
    res.json({ success: true, tempPassword }); // Remove tempPassword in production!
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reset password.' });
  }
});

module.exports = router;
