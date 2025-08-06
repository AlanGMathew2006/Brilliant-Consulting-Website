// routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { getCollection } = require('../config');

// Test database connection and operations
router.get('/test-db', async (req, res) => {
  try {
    console.log('🧪 Testing database connection...');
    
    const users = getCollection('users');
    console.log('✅ Got users collection');
    
    // Test insert
    const testUser = {
      userName: 'testuser_' + Date.now(),
      email: 'test@test.com',
      password: 'hashedpassword123',
      createdAt: new Date(),
      isTest: true
    };
    
    console.log('🧪 Attempting to insert test user...');
    const insertResult = await users.insertOne(testUser);
    console.log('✅ Insert result:', insertResult);
    
    // Test find
    console.log('🧪 Attempting to find test user...');
    const foundUser = await users.findOne({ _id: insertResult.insertedId });
    console.log('✅ Found user:', foundUser);
    
    // Test count
    const userCount = await users.countDocuments({});
    console.log('✅ Total users in database:', userCount);
    
    // Clean up test user
    await users.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ Test user cleaned up');
    
    res.json({
      success: true,
      message: 'Database operations working correctly',
      testResults: {
        insertWorked: !!insertResult.insertedId,
        findWorked: !!foundUser,
        totalUsers: userCount
      }
    });
    
  } catch (err) {
    console.error('❌ Database test failed:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
});

// GET: login page
router.get('/', (req, res) => {
  res.render('login', { error: null });
});

// POST: login form (add debugging)
router.post('/login', async (req, res) => {
  const { userName, password } = req.body;

  try {
    console.log('\n=== LOGIN ATTEMPT DEBUG ===');
    console.log('Raw req.body:', req.body);
    console.log('Username from form:', userName);
    console.log('Password provided:', !!password);

    const users = getCollection('users');
    
    // Find user in database
    const user = await users.findOne({ userName: userName });
    console.log('Database search result:', user ? 'FOUND' : 'NOT FOUND');
    
    if (user) {
      console.log('Found user details:', {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        hasPassword: !!user.password
      });
    }
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.render('login', { 
        error: 'Invalid username or password',
        userName: null 
      });
    }

    // Compare password with saved hash
    console.log('Comparing passwords...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return res.render('login', { 
        error: 'Invalid username or password',
        userName: null 
      });
    }

    console.log('✅ Password valid - logging in user');

    // Set session - user is now logged in
    req.session.userName = userName;
    console.log('✅ Session created for:', userName);
    console.log('=== END LOGIN DEBUG ===\n');

    // Redirect to home page
    res.redirect('/home');
    
  } catch (err) {
    console.error('❌ Login error:', err);
    res.render('login', { 
      error: 'Login failed. Please try again.',
      userName: null 
    });
  }
});

// GET: signup page
router.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

// POST: signup form
router.post('/signup', async (req, res) => {
  const { userName, email, password } = req.body;

  try {
    console.log('\n=== SIGNUP ATTEMPT DEBUG ===');
    console.log('Raw req.body:', req.body);
    console.log('Username extracted:', userName);
    console.log('Email extracted:', email);
    console.log('Password extracted:', password ? '[PROVIDED]' : '[MISSING]');
    console.log('Username type:', typeof userName);
    console.log('Username length:', userName ? userName.length : 'null/undefined');

    if (!userName || !email || !password) {
      console.log('❌ Missing required fields');
      return res.render('signup', { 
        error: 'All fields are required',
        userName: null 
      });
    }

    const users = getCollection('users');
    
    // Check if user already exists
    const existingUser = await users.findOne({ 
      $or: [{ userName: userName }, { email: email }] 
    });
    
    if (existingUser) {
      console.log('❌ User already exists');
      return res.render('signup', { 
        error: 'Username or email already exists',
        userName: null 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully');

    // Prepare user object
    const newUser = {
      userName: userName,
      email: email,
      password: hashedPassword,
      createdAt: new Date()
    };

    console.log('User object to insert:', {
      userName: newUser.userName,
      email: newUser.email,
      hasPassword: !!newUser.password,
      createdAt: newUser.createdAt
    });

    // Save user to database
    const result = await users.insertOne(newUser);
    console.log('✅ User saved to database:', result.insertedId);

    // Verify what was actually saved
    const savedUser = await users.findOne({ _id: result.insertedId });
    console.log('✅ Verification - saved user:', {
      _id: savedUser._id,
      userName: savedUser.userName,
      email: savedUser.email,
      hasPassword: !!savedUser.password
    });

    // Set session - user is now logged in
    req.session.userName = userName;
    console.log('✅ Session created for:', userName);
    console.log('=== END SIGNUP DEBUG ===\n');

    // Redirect to home page (user is logged in)
    res.redirect('/home');
    
  } catch (err) {
    console.error('❌ Signup error:', err);
    res.render('signup', { 
      error: 'Registration failed. Please try again.',
      userName: null 
    });
  }
});

// Debug route to see all users in database
router.get('/debug-users', async (req, res) => {
  try {
    const users = getCollection('users');
    const allUsers = await users.find({}).toArray();
    
    console.log('📊 All users in database:', allUsers.length);
    
    res.json({
      totalUsers: allUsers.length,
      users: allUsers.map(user => ({
        _id: user._id,
        userName: user.userName,
        email: user.email,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        createdAt: user.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test bcrypt directly (REMOVE IN PRODUCTION)
router.get('/test-bcrypt/:password', async (req, res) => {
  try {
    const password = req.params.password;
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, hash);
    
    res.json({
      originalPassword: password,
      generatedHash: hash,
      comparisonResult: isValid,
      bcryptWorking: isValid === true
    });
  } catch (err) {
    res.status(500).json({ error: err.message, bcryptError: true });
  }
});

// Logout routes
router.get('/logout', (req, res) => {
  console.log('Logging out user:', req.session.userName);
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/'); // Redirect to login page
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.redirect('/home');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// Create a clean test user
router.get('/create-clean-user', async (req, res) => {
  try {
    const users = getCollection('users');
    
    // Delete any existing test users
    await users.deleteMany({ userName: 'testuser' });
    
    // Create a new test user with known credentials
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Creating test user with:');
    console.log('- Username: testuser');
    console.log('- Password: test123');
    console.log('- Hashed:', hashedPassword);
    
    const result = await users.insertOne({
      userName: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      createdAt: new Date()
    });
    
    // Verify it was created
    const verifyUser = await users.findOne({ userName: 'testuser' });
    
    res.json({
      success: true,
      message: 'Clean test user created',
      credentials: {
        username: 'testuser',
        password: 'test123'
      },
      userCreated: !!result.insertedId,
      userVerified: !!verifyUser,
      storedData: {
        userName: verifyUser?.userName,
        email: verifyUser?.email,
        hasPassword: !!verifyUser?.password,
        passwordLength: verifyUser?.password?.length
      }
    });
    
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message,
      stack: err.stack 
    });
  }
});

module.exports = router;

