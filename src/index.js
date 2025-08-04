const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { connectDB, getCollection } = require('./config');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(session({
  secret: 'yourSecretKey', // use a strong secret in production
  resave: false,
  saveUninitialized: false
}));

// Render login EJS view
app.get('/', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const collection = getCollection();

  try {
    const user = await collection.findOne({ email });

    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userName = user.name || user.email; // Use 'name' field from DB
      res.redirect('/home');
    } else {
      res.render('login', { error: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'Something went wrong. Please try again.' });
  }
});

// Protect the /home route
app.get('/home', (req, res) => {
  if (!req.session.userName) {
    return res.redirect('/');
  }
  const userName = req.session.userName || 'User';
  res.render('home', { userName });
});

app.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

// Register User
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  const collection = getCollection();

  try {
    const existingUser = await collection.findOne({ email });

    if (existingUser) {
      return res.render('signup', { error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await collection.insertOne({ name: username, email, password: hashedPassword });

    res.redirect('/');
  } catch (err) {
    console.error('Signup error:', err);
    res.render('signup', { error: 'Something went wrong. Please try again.' });
  }
});

(async () => {
  await connectDB(); // Ensure DB is connected before starting server

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
})();