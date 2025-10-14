// ...existing code...
// Place this route after router is defined
// Utility route to migrate color to status for all complaints
// (Move this below 'var router = express.Router();')
var express = require('express');
const Complaint = require('../../models/Complaint');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'securemycampusjwt';
var router = express.Router();


// Delete complaint by index
router.post('/delete-complaint', function(req, res) {
	const { index } = req.body;
	Complaint.find().then(complaints => {
		if (typeof index !== 'undefined' && complaints.length > index) {
			const toDelete = complaints[index]._id;
			Complaint.findByIdAndDelete(toDelete).then(() => {
				res.redirect('/complaint');
			});
		} else {
			res.redirect('/complaint');
		}
	});
});


// Complaint page
const fs = require('fs');
const path = require('path');
router.get('/complaint', function(req, res) {
	let user = null;
	if (req.cookies && req.cookies.token) {
		try {
			user = jwt.verify(req.cookies.token, JWT_SECRET);
		} catch (e) {
			user = null;
		}
	}

	const selectedCategory = req.query.category || '';
	const now = Date.now();

	// Get all non-expired complaints
	Complaint.find({ $or: [ { expiresAt: { $gt: now } }, { expiresAt: { $exists: false } } ] }).then(complaints => {
		let filteredComplaints = complaints;

		// Filter complaints based on user role
		if (!user || user.role === 'student') {
			// Public access and students can't see harassment complaints
			filteredComplaints = complaints.filter(c => 
				c.category.toLowerCase() !== 'harassment'
			);
		}
		// Admin and faculty can see all complaints

		// Apply category filter if selected
		if (selectedCategory) {
			filteredComplaints = filteredComplaints.filter(c => c.category === selectedCategory);
		}

		// Get available categories
		let categories = [];
		if (!user || user.role === 'student') {
			// Public access and students don't see harassment category
			categories = [...new Set(complaints
				.map(c => c.category)
				.filter(Boolean)
				.filter(cat => cat.toLowerCase() !== 'harassment'))];
		} else {
			// Admin and faculty see all categories
			categories = [...new Set(complaints.map(c => c.category).filter(Boolean))];
		}

		res.render('complaint', { 
			title: 'Complaint', 
			complaints: filteredComplaints, 
			categories, 
			selectedCategory, 
			now, 
			email: user ? user.email : null,
			user: user || { role: 'public' } // Pass user object or default to public role
		});
	});
});

// Form page
router.get('/form', function(req, res) {
					let user = null;
					if (req.cookies && req.cookies.token) {
						try {
							user = jwt.verify(req.cookies.token, JWT_SECRET);
						} catch (e) {
							user = null;
						}
					}
						if (!user) {
							return res.render('signin', { title: 'Sign In', error: 'Please sign in to access the form.', email: '' });
						}
					res.render('form', { title: 'Form', email: user.email });
});
// Handle form submission and store data in a file
const { saveComplaint } = require('../models/complaint');
const multer = require('multer');
const upload = multer({
	dest: 'public/images/uploads/',
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
	fileFilter: (req, file, cb) => {
		if (file.mimetype.startsWith('image/')) {
			cb(null, true);
		} else {
			cb(new Error('Only image files are allowed!'), false);
		}
	}
});
router.post('/submit-incident', upload.single('photo'), function(req, res) {
	// Verify user is logged in and has proper role
	let user = null;
	if (req.cookies && req.cookies.token) {
		try {
			user = jwt.verify(req.cookies.token, JWT_SECRET);
		} catch (e) {
			user = null;
		}
	}

	if (!user) {
		return res.redirect('/users/signin');
	}

	const { name, phone, date, email, category, location, description } = req.body;

	// Check if student is trying to submit restricted categories
	if (user.role === 'student' && 
		(category.toLowerCase() === 'harassment' || category.toLowerCase() === 'faculty')) {
		return res.render('form', {
			title: 'Form',
			error: 'Students are not allowed to submit complaints in this category.',
			email: user.email,
			user: user
		});
	}

	let photo = '';
	if (req.file && req.file.filename) {
		photo = '/images/uploads/' + req.file.filename;
	} else if (req.body.photo) {
		photo = req.body.photo;
	}

	const now = Date.now();
	const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days from now

	const complaint = new Complaint({
		phone,
		date,
		email,
		category,
		location,
		description,
		photo,
		color: 'red',
		expiresAt,
		status: 'unsolved',
		submittedBy: user.role // Add role information to track who submitted
	});

	complaint.save().then(() => {
		res.redirect('/complaint');
	}).catch(err => {
		res.render('form', {
			title: 'Form',
			error: 'Error submitting complaint: ' + err.message,
			email: user.email,
			user: user
		});
	});
});
// Change complaint color to green
router.post('/change-complaint-color', function(req, res) {
		const { index } = req.body;
		Complaint.find().then(complaints => {
			if (typeof index !== 'undefined' && complaints.length > index) {
				const toUpdate = complaints[index]._id;
				Complaint.findByIdAndUpdate(toUpdate, { status: 'solved' }).then(() => {
					res.redirect('/complaint');
				});
			} else {
				res.redirect('/complaint');
			}
		});
});
router.get('/help', function(req, res) {
				let user = null;
				if (req.cookies && req.cookies.token) {
					try {
						user = jwt.verify(req.cookies.token, JWT_SECRET);
					} catch (e) {
						user = null;
					}
				}
					if (!user) {
						return res.render('signin', { title: 'Sign In', error: 'Please sign in to access the help center.', email: '' });
					}
				res.render('help', { title: 'Help Center', email: user.email });
});
// Chatbot JS for help page
function appendMessage(sender, text, id) {
	const conversation = typeof document !== 'undefined' ? document.getElementById('conversation') : null;
	if (!conversation) return;
	const msgDiv = document.createElement('div');
	msgDiv.style.margin = '10px 0';
	msgDiv.className = sender === 'You' ? 'user-msg' : 'bot-msg';
	msgDiv.innerHTML = `<b>${sender}:</b> <span id="${id||''}">${text}</span>`;
	conversation.appendChild(msgDiv);
	conversation.scrollTop = conversation.scrollHeight;
}
function sendToPython() {
	const inputBox = typeof document !== 'undefined' ? document.getElementById('inputBox') : null;
	if (!inputBox) return;
	const value = inputBox.value.trim();
	if (!value) return;
	appendMessage('You', value);
	window.history = window.history || [];
	window.history.push({ role: 'user', content: value });
	inputBox.value = '';
	// Add bot loading message
	const botMsgId = 'botmsg-' + Date.now();
	appendMessage('Bot', '<span class="loader"></span>', botMsgId);
	fetch('/api/submit', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ history: window.history })
	})
	.then(response => response.json())
	.then(data => {
		const botMsg = document.getElementById(botMsgId);
		if (botMsg) botMsg.innerText = data.response;
		window.history.push({ role: 'bot', content: data.response });
	})
	.catch(error => {
		const botMsg = document.getElementById(botMsgId);
		if (botMsg) botMsg.innerText = 'Error: ' + error;
	});
}
// Profile page
router.get('/profile', function(req, res) {
			let user = null;
			if (req.cookies && req.cookies.token) {
				try {
					user = jwt.verify(req.cookies.token, JWT_SECRET);
				} catch (e) {
					user = null;
				}
			}
			if (!user || !user.email) {
				return res.redirect('/users/signin');
			}
			const User = require('../../models/User');
			User.findOne({ email: user.email }).then(dbUser => {
				if (!dbUser) {
					return res.render('profile', {
						title: 'Profile',
						email: user.email,
						name: user.name,
						username: user.username,
						phone: user.phone,
						location: '',
						user: user,
						error: 'User not found.'
					});
				}
				res.render('profile', {
					title: 'Profile',
					email: dbUser.email,
					name: dbUser.name,
					username: dbUser.username,
					phone: dbUser.phone,
					location: dbUser.location,
					user: dbUser
				});
			}).catch(err => {
				console.error('Error fetching user for profile:', err);
				res.render('profile', {
					title: 'Profile',
					email: user.email,
					name: user.name,
					username: user.username,
					phone: user.phone,
					location: '',
					user: user,
					error: 'Error loading profile.'
				});
			});
});

// Sign In page
// ...removed sign in/up routes from pages.js...


module.exports = router;
