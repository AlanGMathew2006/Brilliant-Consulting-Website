// routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const User = require('../models/User');

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
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// POST: login form - UPDATE THIS SECTION
router.post('/login', async (req, res) => {
  const { userName, password } = req.body;

  try {
    console.log('\n=== LOGIN ATTEMPT DEBUG ===');
    console.log('Username from form:', userName);
    console.log('Password provided:', !!password);

    // Use Mongoose instead of getCollection
    const user = await User.findOne({ userName: userName });
    console.log('Database search result:', user ? 'FOUND' : 'NOT FOUND');
    
    if (user) {
      console.log('Found user details:', {
        role: user.role,
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
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return res.render('login', { 
        error: 'Invalid username or password',
        userName: null 
      });
    }

    if (isValidPassword) {
      console.log('✅ Password valid - logging in user');
      console.log('🔍 User role from database:', user.role);
      
      // Set session with FULL user object including role
      req.session.user = user; // user is the user object from DB
      req.session.userName = user.userName; // or user.fullName, etc.

      console.log('✅ Session created for:', userName, 'with role:', user.role || 'user');

      // CRITICAL: Role-based redirect
      if (user.role === 'admin') {
        console.log('🔐 Admin detected - redirecting to admin dashboard');
        return res.redirect('/admin');
      } else {
        console.log('👤 Regular user - redirecting to home');
        return res.redirect('/home');
      }
    }
    
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

// POST: signup form - UPDATE THIS SECTION
router.post('/signup', async (req, res) => {
  const { userName, email, password } = req.body;

  try {
    console.log('\n=== SIGNUP ATTEMPT DEBUG ===');
    console.log('Username extracted:', userName);
    console.log('Email extracted:', email);

    if (!userName || !email || !password) {
      console.log('❌ Missing required fields');
      return res.render('signup', { 
        error: 'All fields are required',
        userName: null 
      });
    }

    // Check if user already exists using Mongoose
    const existingUser = await User.findOne({ 
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

    // Create new user using Mongoose
    const newUser = new User({
      fullName: req.body.fullName,
      userName: req.body.userName, // <-- Make sure to include this!
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      companyName: req.body.companyName,
      serviceInterest: req.body.serviceInterest,
      projectDescription: req.body.projectDescription,
      password: hashedPassword,
      role: 'user',
      agreedToTerms: req.body.agreedToTerms === 'on'
    });
    const savedUser = await newUser.save();

    // Set session with the full user object
    req.session.user = savedUser;
    req.session.userName = savedUser.userName;

    console.log('✅ Session created for:', savedUser.userName, 'with role:', savedUser.role);

    // Redirect based on role
    if (savedUser.role === 'admin') {
      res.redirect('/admin');
    } else {
      res.redirect('/home');
    }
    
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
        role: user.role,  // ← ADD THIS LINE
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
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      // Still redirect to login even if error
    }
    res.redirect('/login'); // or res.redirect('/') if your login is at /
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

// Temporary debug route - add this before module.exports = router;
router.get('/test-admin-login', async (req, res) => {
  try {
    const users = getCollection('users');
    const admin = await users.findOne({ userName: 'admin' });
    
    if (!admin) {
      return res.json({ error: 'Admin user not found in database' });
    }
    
    const passwordTest = await bcrypt.compare('Melattu@1975', admin.password);
    
    res.json({
      adminExists: !!admin,
      adminDetails: {
        userName: admin.userName,
        email: admin.email,
        role: admin.role,
        hasPassword: !!admin.password
      },
      passwordTest: passwordTest,
      roleCheck: admin.role === 'admin',
      rawAdminObject: admin  // Show the complete object
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

