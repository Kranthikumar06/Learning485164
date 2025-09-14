var express = require('express');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'securemycampusjwt';
var router = express.Router();


// Delete complaint by index
router.post('/delete-complaint', function(req, res) {
	const { index } = req.body;
	const filePath = path.join(__dirname, '../../data/complaints.json');
	let complaints = [];
	if (fs.existsSync(filePath)) {
		try {
			complaints = JSON.parse(fs.readFileSync(filePath));
		} catch (e) {
			complaints = [];
		}
	}
	if (typeof index !== 'undefined' && complaints.length > index) {
		complaints.splice(index, 1);
		fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));
	}
	res.redirect('/complaint');
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
	const filePath = path.join(__dirname, '../../data/complaints.json');
	let complaints = [];
	let categories = [];
	if (fs.existsSync(filePath)) {
		try {
			complaints = JSON.parse(fs.readFileSync(filePath));
			categories = [...new Set(complaints.map(c => c.category).filter(Boolean))];
		} catch (e) {
			complaints = [];
			categories = [];
		}
	}
	const selectedCategory = req.query.category || '';
	// Remove expired complaints
	const now = Date.now();
	complaints = complaints.filter(c => !c.expiresAt || c.expiresAt > now);
	// Save filtered complaints back to file
	fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));
	let filteredComplaints = complaints;
	if (selectedCategory) {
		filteredComplaints = complaints.filter(c => c.category === selectedCategory);
	}
	res.render('complaint', { title: 'Complaint', complaints: filteredComplaints, categories, selectedCategory, now, email: user ? user.email : null });
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
	// For file uploads, use multer (not implemented here)
	const { name, phone, date, email, category, location, description } = req.body;
	let photo = '';
	if (req.file && req.file.filename) {
		photo = '/images/uploads/' + req.file.filename;
	} else if (req.body.photo) {
		photo = req.body.photo;
	}
	const now = Date.now();
	const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days from now
	const complaint = {
		phone,
		date,
		email,
		category,
		location,
		description,
		photo,
		color: 'red',
		expiresAt
	};
	// Save complaint
	const filePath = path.join(__dirname, '../../data/complaints.json');
	let complaints = [];
	if (fs.existsSync(filePath)) {
		try {
			complaints = JSON.parse(fs.readFileSync(filePath));
		} catch (e) {
			complaints = [];
		}
	}
	complaints.push(complaint);
	fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));
	res.redirect('/complaint');
});
// Change complaint color to green
router.post('/change-complaint-color', function(req, res) {
	const { index } = req.body;
	const filePath = path.join(__dirname, '../../data/complaints.json');
	let complaints = [];
	if (fs.existsSync(filePath)) {
		try {
			complaints = JSON.parse(fs.readFileSync(filePath));
		} catch (e) {
			complaints = [];
		}
	}
	if (typeof index !== 'undefined' && complaints.length > index) {
		complaints[index].color = 'green';
		fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));
	}
	res.redirect('/complaint');
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
			res.render('profile', {
				title: 'Profile',
				email: user ? user.email : '',
				name: user ? user.name : '',
				username: user ? user.username : '',
				phone: user ? user.phone : '',
				user: user
			});
});

// Sign In page
// ...removed sign in/up routes from pages.js...


module.exports = router;
