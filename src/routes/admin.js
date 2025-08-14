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

module.exports = router;
