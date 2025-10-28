var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var helmet = require('helmet');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('./mongo');

var indexRouter = require('./app_server/routes/index');
var usersRouter = require('./app_server/routes/users');
var pagesRouter = require('./app_server/routes/pages');

var app = express();
// Disable x-powered-by header
app.disable('x-powered-by');
app.set('views', path.join(__dirname, 'app_server', 'views'));
app.set('view engine', 'jade');

// view engine setup
const fs = require('fs');
require('dotenv').config();
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.BASE_URL + '/users/auth/google/callback'
}, function(accessToken, refreshToken, profile, done) {
  // Save user info to MongoDB if not already present
  const User = require('./models/User');
  const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
  if (!email) return done(null, profile);
  User.findOne({ email }).then(async user => {
    if (!user) {
      // Determine user role based on email
      let role;
      if (email === 'securemycampus485164@gmail.com') {
        role = 'admin';
      } else if (!email.endsWith('@anurag.edu.in')) {
        return done(null, false, { message: 'Only @anurag.edu.in email addresses are allowed (except for admin).' });
      } else {
        const localPart = email.split('@')[0];
        if (/^[a-zA-Z]+$/.test(localPart)) {
          role = 'faculty';
        } else if (/^[a-zA-Z0-9]+$/.test(localPart)) {
          role = 'student';
        } else {
          return done(null, false, { message: 'Invalid email format. Faculty emails should contain only letters, student emails can contain letters and numbers.' });
        }
      }

      // Extract username from email (part before @)
      const username = email.split('@')[0];
      
      const newUser = new User({
        name: profile.displayName,
        email: email,
        username: username,
        phone: '',
        password: '', // No password for Google users
        role: role,
        isVerified: false
      });
      await newUser.save().then(() => done(null, profile));
    } else {
      done(null, profile);
    }
  }).catch(() => done(null, profile));
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.use(session({
  secret: process.env.SESSION_SECRET || 'securemycampus',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.use('/', indexRouter);         // home page
app.use('/', pagesRouter);         // complaint, form, faqs, etc.
app.use('/users', usersRouter);    // user-related routes

// Root-level signup and signin routes
app.get('/signup', function(req, res) {
  let user = null;
  if (req.cookies && req.cookies.token) {
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = 'securemycampusjwt';
      user = jwt.verify(req.cookies.token, JWT_SECRET);
    } catch (e) {
      user = null;
    }
  }
  res.render('signup', {
    title: 'Sign Up',
    email: user ? user.email : '',
    name: user ? user.name : '',
    username: user ? user.username : '',
    phone: user ? user.phone : '',
    user: user
  });
});
app.get('/signin', function(req, res) {
  let user = null;
  if (req.cookies && req.cookies.token) {
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = 'securemycampusjwt';
      user = jwt.verify(req.cookies.token, JWT_SECRET);
    } catch (e) {
      user = null;
    }
  }
  res.render('signin', {
    title: 'Sign In',
    email: user ? user.email : '',
    name: user ? user.name : '',
    username: user ? user.username : '',
    phone: user ? user.phone : '',
    user: user
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // locals
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
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
  res.render('error', {
    title: 'Error',
    message: err.message,
    error: res.locals.error,
    email
  });
});

module.exports = app;
