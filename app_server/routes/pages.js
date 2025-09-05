var express = require('express');
var router = express.Router();

// Complaint page
router.get('/complaint', function(req, res) {
	res.render('complaint', { title: 'Complaint' });
});

// Form page
router.get('/form', function(req, res) {
	res.render('form', { title: 'Form' });
});

// Profile page
router.get('/profile', function(req, res) {
	res.render('profile', { title: 'Profile' });
});

// Sign In page
router.get('/signin', function(req, res) {
	res.render('signin', { title: 'Sign In' });
});

// Sign Up page
router.get('/signup', function(req, res) {
	res.render('signup', { title: 'Sign Up' });
});

module.exports = router;
