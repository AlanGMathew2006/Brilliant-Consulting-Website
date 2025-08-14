const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { connectDB } = require('./config');
const Appointment = require('./models/Appointment');

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
    secret: 'yourSecretKey_' + Date.now(),
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body || {});
    next();
  });

  // Import routes
  const adminRoutes = require('./routes/admin');
  const authRoutes = require('./routes/auth'); 
  const appointmentRoutes = require('./routes/appointments');

  // Use route modules FIRST
  app.use('/admin', adminRoutes);
  app.use('/auth', authRoutes);
  app.use('/appointments', appointmentRoutes);

  // Main routes
  app.get('/', (req, res) => {
    console.log('Root route accessed, session user:', req.session.user);
    if (req.session.userName || req.session.user) {
      console.log('User already logged in:', req.session.userName || req.session.user.userName);
      
      // Check if admin and redirect accordingly
      if (req.session.user && req.session.user.role === 'admin') {
        return res.redirect('/admin');
      }
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
    console.log('   - Session user:', req.session.user);
    console.log('   - Username in session:', req.session.userName);
    
    if (!req.session.userName && !req.session.user) {
      console.log('❌ User not logged in, redirecting to login');
      return res.redirect('/');
    }
    
    console.log('✅ User logged in, rendering home page');
    res.render('home', { 
      userName: req.session.userName || req.session.user.userName 
    });
  });

  // Other protected routes
  app.get('/services', (req, res) => {
    res.render('services', { 
      userName: req.session.userName || req.session.user?.userName || null 
    });
  });

  app.get('/products', (req, res) => {
    res.render('products', { 
      userName: req.session.userName || req.session.user?.userName || null 
    });
  });

  app.get('/about', (req, res) => {
    res.render('about', { 
      userName: req.session.userName || req.session.user?.userName || null 
    });
  });

  app.get('/contact', (req, res) => {
    res.render('contact', { 
      userName: req.session.userName || req.session.user?.userName || null 
    });
  });

  // User appointments route - for loading existing appointments
app.get('/user/appointments', async (req, res) => {
  try {
    console.log('📋 Loading appointments for user:', req.session.userName);
    
    if (!req.session.userName) {
      return res.status(401).json({
        success: false,
        error: 'Not logged in'
      });
    }

    const userAppointments = await Appointment.find({ 
      userName: req.session.userName 
    }).sort({ createdAt: -1 });

    console.log(`Found ${userAppointments.length} appointments for ${req.session.userName}`);

    res.json({
      success: true,
      appointments: userAppointments
    });

  } catch (error) {
    console.error('❌ Error loading user appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load appointments'
    });
  }
});

// Alternative route path (in case your frontend calls this)
app.get('/appointments/user', async (req, res) => {
  try {
    if (!req.session.user && !req.session.userName) {
      return res.status(401).json({
        success: false,
        error: 'Not logged in'
      });
    }

    const userName = req.session.userName || req.session.user.userName;
    
    const userAppointments = await Appointment.find({ 
      userName: userName 
    }).sort({ createdAt: -1 });

    console.log(`📋 User ${userName} has ${userAppointments.length} appointments`);

    res.json({
      success: true,
      appointments: userAppointments
    });

  } catch (error) {
    console.error('❌ Error loading appointments:', error);
    res.json({
      success: false,
      error: 'Failed to load appointments'
    });
  }
});

  app.get('/terms', (req, res) => {
    res.render('terms');
  });

  // 404 handler - MUST BE LAST!
  app.use((req, res) => {
    console.log('🔧 404 HANDLER HIT for:', req.path);
    res.status(404).render('404', { 
      userName: req.session.userName || req.session.user?.userName || null 
    });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`🌟 Server running on http://localhost:${PORT}`);
    console.log('📋 Test URLs:');
    console.log('   - Login: http://localhost:' + PORT + '/');
    console.log('   - Admin: http://localhost:' + PORT + '/admin');
    console.log('   - Debug users: http://localhost:' + PORT + '/auth/debug-users');
    console.log('   - Test admin login: http://localhost:' + PORT + '/auth/test-admin-login');
  });

}).catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
