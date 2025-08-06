const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { connectDB } = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database FIRST, then start server
connectDB().then(() => {
  console.log('🚀 Database connected, setting up Express...');
  
  // Express configuration
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'Views'));
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Session configuration - IMPORTANT!
  app.use(session({
    secret: 'yourSecretKey_' + Date.now(), // More unique secret
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false,  // Must be false for HTTP (development)
      httpOnly: true, // Security
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body || {});
    next();
  });

  // Routes
  const authRoutes = require('./routes/auth'); 
  const appointmentRoutes = require('./routes/appointments');

  app.use('/auth', authRoutes);
  app.use('/appointments', appointmentRoutes);

  // Main routes
  app.get('/', (req, res) => {
    console.log('Root route accessed, session:', req.session);
    if (req.session.userName) {
      console.log('User already logged in:', req.session.userName);
      return res.redirect('/home');
    }
    res.render('login', { error: null, userName: null });
  });

  app.get('/login', (req, res) => {
    res.render('login', { error: null, userName: null });
  });

  app.get('/signup', (req, res) => {
    res.render('signup', { error: null, userName: null });
  });

  // Home route (protected)
  app.get('/home', (req, res) => {
    console.log('🏠 Home route accessed');
    console.log('   - Session:', req.session);
    console.log('   - Username in session:', req.session.userName);
    
    if (!req.session.userName) {
      console.log('❌ User not logged in, redirecting to login');
      return res.redirect('/');
    }
    
    console.log('✅ User logged in, rendering home page');
    res.render('home', { userName: req.session.userName });
  });

  // Other protected routes
  app.get('/services', (req, res) => {
    res.render('services', { userName: req.session.userName || null });
  });

  app.get('/products', (req, res) => {
    res.render('products', { userName: req.session.userName || null });
  });

  app.get('/about', (req, res) => {
    res.render('about', { userName: req.session.userName || null });
  });

  app.get('/contact', (req, res) => {
    res.render('contact', { userName: req.session.userName || null });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).render('404', { userName: req.session.userName || null });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`🌟 Server running on http://localhost:${PORT}`);
    console.log('📋 Test URLs:');
    console.log('   - Database test: http://localhost:' + PORT + '/auth/test-db');
    console.log('   - Users debug: http://localhost:' + PORT + '/auth/debug-users');
    console.log('   - bcrypt test: http://localhost:' + PORT + '/auth/test-bcrypt/testpass');
    console.log('   - Create test user: http://localhost:' + PORT + '/auth/create-clean-user');
  });

}).catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});