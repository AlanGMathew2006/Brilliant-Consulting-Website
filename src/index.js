const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { connectDB, getCollection } = require('./config');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'Views')); // Updated to point to root Views folder
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static('public')); // Serves CSS, images, etc.

app.use(session({
  secret: 'yourSecretKey', // use a strong secret in production
  resave: false,
  saveUninitialized: false
}));

//Routes
const authRoutes = require('./routes/auth'); 
const appointmentRoutes = require('./routes/appointments');

app.use('/auth', authRoutes);
app.use('/appointments', appointmentRoutes);


// Routes - Make login the default page
app.get('/', (req, res) => {
  // Check if user is already logged in
  if (req.session.userName) {
    return res.redirect('/home');
  }
  // Show login page if not logged in
  res.render('login', { error: null, userName: null });
});

app.get('/login', (req, res) => {
  res.render('login', { error: null, userName: null });
});

app.get('/home', (req, res) => {
  // Protect home route - redirect to login if not logged in
  if (!req.session.userName) {
    return res.redirect('/');
  }
  const userName = req.session.userName || 'User';
  res.render('home', { userName });
});

app.get('/signup', (req, res) => {
  res.render('signup', { error: null, userName: null });
});

// Fixed routes - remove the callback and res.send()
app.get('/services', (req, res) => {
  const userName = req.session.userName || null;
  res.render('services', { userName: userName });
});

app.get('/products', (req, res) => {
  const userName = req.session.userName || null;
  res.render('products', { userName: userName });
});

app.get('/about', (req, res) => {
  const userName = req.session.userName || null;
  res.render('about', { userName: userName });
});

app.get('/contact', (req, res) => {
  const userName = req.session.userName || null;
  res.render('contact', { userName: userName });
});

(async () => {
  await connectDB(); // Ensure DB is connected before starting server

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
})();