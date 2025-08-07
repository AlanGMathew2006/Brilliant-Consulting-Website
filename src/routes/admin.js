// src/routes/admin.js
const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middlewares/authMiddleware');

console.log('🔧 Admin routes loaded!' );

// Admin dashboard route (handles GET /admin/)
router.get('/', (req, res) => {
  console.log('🔐 Admin dashboard accessed from admin.js');
  console.log('   - Session exists:', !!req.session);
  console.log('   - Session user:', req.session.user);
  console.log('   - Username:', req.session.userName);

  // Check if user is logged in and is admin
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    console.log('✅ Admin verified - showing dashboard');
    res.render('admin/dashboard', {
      userName: req.session.userName || req.session.user.userName,
      user: req.session.user
    });
  } else {
    console.log('❌ Not admin - redirecting to login');
    res.redirect('/');
  }
});

module.exports = router;
