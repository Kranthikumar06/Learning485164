var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var helmet = require('helmet');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;

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
  callbackURL: '/users/auth/google/callback'
}, function(accessToken, refreshToken, profile, done) {
  // Save user info to users.json if not already present
  const filePath = path.join(__dirname, 'data', 'users.json');
  let users = [];
  if (fs.existsSync(filePath)) {
    try {
      users = JSON.parse(fs.readFileSync(filePath));
    } catch (e) {
      users = [];
    }
  }
  const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
  let user = users.find(u => u.email === email);
  if (!user && email) {
    user = {
      name: profile.displayName,
      email: email,
      username: profile.id,
      phone: '',
      password: '' // No password for Google users
    };
    users.push(user);
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
  }
  return done(null, profile);
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
app.use('/', pagesRouter);         // complaint, form, help, etc.
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
