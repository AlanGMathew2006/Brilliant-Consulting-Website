// src/middlewares/authMiddleware.js
function verifyAdmin(req, res, next) {
  console.log('🔐 Admin middleware check');
  
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    console.log('✅ Admin verified');
    next();
  } else {
    console.log('❌ Not admin, redirecting');
    res.redirect('/');
  }
}

module.exports = { verifyAdmin };
