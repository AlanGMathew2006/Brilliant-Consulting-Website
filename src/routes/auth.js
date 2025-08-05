// routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const { getCollection } = require('../config');
const router = express.Router();

// GET: login page
router.get('/', (req, res) => {
  res.render('login', { error: null });
});

// POST: login form
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user in database
    const collection = getCollection();
    const user = await collection.findOne({ username: username });
    
    if (!user) {
      return res.render('login', { error: 'User not found' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.render('login', { error: 'Invalid password' });
    }
    
    // Set session and redirect
    req.session.userName = user.username;
    res.redirect('/home');
    
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { error: 'Login failed' });
  }
});

// GET: signup page
router.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

// POST: signup form
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const collection = getCollection();
    
    // Check if user already exists
    const existingUser = await collection.findOne({ username: username });
    if (existingUser) {
      return res.render('signup', { error: 'Username already exists' });
    }
    
    // Hash password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    await collection.insertOne({
      username: username,
      email: email,
      password: hashedPassword
    });
    
    // Set session and redirect
    req.session.userName = username;
    res.redirect('/home');
    
  } catch (error) {
    console.error('Signup error:', error);
    res.render('signup', { error: 'Signup failed' });
  }
});

// Logout route (GET)
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.redirect('/home');
    }
    res.clearCookie('connect.sid'); // Clear session cookie
    res.redirect('/'); // Redirect to login page
  });
});

// Logout route (POST) - for form submission
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.redirect('/home');
    }
    res.clearCookie('connect.sid'); // Clear session cookie
    res.redirect('/'); // Redirect to login page
  });
});

module.exports = router;

