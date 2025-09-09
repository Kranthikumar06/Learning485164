const express = require('express');
const passport = require('passport');
const fs = require('fs');
const path = require('path');
var router = express.Router();

// Google OAuth routes
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/users/signin' }),
  function(req, res) {
    // Set JWT token cookie for Google user
    const user = req.user;
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = 'securemycampusjwt';
    const token = jwt.sign({
      email: user.emails[0].value,
      name: user.displayName,
      username: user.id,
      phone: ''
    }, JWT_SECRET, { expiresIn: '2h' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.redirect('/');
  }
);
router.get('/test-users-json-write', function(req, res) {
  const filePath = path.join(__dirname, '../../data/users.json');
  let original = '';
  try {
    if (fs.existsSync(filePath)) {
      original = fs.readFileSync(filePath, 'utf8');
    }
    fs.writeFileSync(filePath, JSON.stringify([{test: 'write'}], null, 2));
    // Restore original
    fs.writeFileSync(filePath, original);
    res.send('users.json is writable');
  } catch (e) {
    res.send('users.json is NOT writable: ' + e.message);
  }
});
router.get('/signup', function(req, res) {
  let email = '';
  if (req.cookies && req.cookies.token) {
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = 'securemycampusjwt';
      const user = jwt.verify(req.cookies.token, JWT_SECRET);
      email = user.email;
    } catch (e) {
      email = '';
    }
  }
  res.render('signup', { title: 'Sign Up', email });
});
// Render signin page
router.get('/signin', function(req, res) {
  let email = '';
  if (req.cookies && req.cookies.token) {
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = 'securemycampusjwt';
      const user = jwt.verify(req.cookies.token, JWT_SECRET);
      email = user.email;
    } catch (e) {
      email = '';
    }
  }
  res.render('signin', { title: 'Sign In', email });
});
// Signup route
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'securemycampusjwt';
router.post('/signup', async function(req, res) {
  const { name, username, phone, email, password, confirm_password } = req.body;
  if (!name || !username || !phone || !email || !password || password !== confirm_password) {
    return res.render('signup', { title: 'Sign Up', error: 'All fields are required and passwords must match.', email: req.session.email });
  }
  const filePath = path.join(__dirname, '../../data/users.json');
  let users = [];
  if (fs.existsSync(filePath)) {
    try {
      users = JSON.parse(fs.readFileSync(filePath));
    } catch (e) {
      users = [];
    }
  }
  if (users.find(u => u.email === email)) {
  return res.render('signup', { title: 'Sign Up', error: 'Email already registered.', email: req.session.email });
  }
  const hashed = await bcrypt.hash(password, 10);
  users.push({ name, username, phone, email, password: hashed });
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
  res.redirect('/users/signin');
});
// Logout route
router.post('/logout', function(req, res) {
  req.session.destroy(function(err) {
  res.clearCookie('token');
  res.redirect('/');
  });
});
// Signin route
router.post('/signin', async function(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render('signin', { title: 'Sign In', error: 'Email and password required.', email: '' });
  }
  const filePath = path.join(__dirname, '../../data/users.json');
  let users = [];
  if (fs.existsSync(filePath)) {
    try {
      users = JSON.parse(fs.readFileSync(filePath));
    } catch (e) {
      users = [];
    }
  }
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render('signin', { title: 'Sign In', error: 'Invalid entry. Email or password is incorrect.', email: '' });
  }
  // Issue JWT token
  const token = jwt.sign({ email: user.email, name: user.name, username: user.username, phone: user.phone }, JWT_SECRET, { expiresIn: '2h' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.redirect('/');
});

module.exports = router;