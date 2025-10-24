// ...existing code...
// Place this route after router is defined
// Utility route to migrate color to status for all complaints
// (Move this below 'var router = express.Router();')
var express = require('express');
const Complaint = require('../../models/Complaint');
const Dashboard = require('../../models/Dashboard');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'securemycampusjwt';
var router = express.Router();


// Delete complaint by id (fallback to index for backward compat)
router.post('/delete-complaint', function(req, res) {
	const { id, index } = req.body;
	const doDeleteById = (toDeleteId) => {
		Complaint.findByIdAndDelete(toDeleteId).then(async () => {
			try {
				await Dashboard.deleteOne({ complaintId: toDeleteId });
			} catch (e) {
				console.error('Failed to delete dashboard item for complaint:', e.message);
			}
			res.redirect('/complaint');
		}).catch(err => {
			console.error('Delete complaint failed:', err.message);
			res.redirect('/complaint');
		});
	};

	if (id) {
		return doDeleteById(id);
	}
	// Fallback: legacy index-based delete
	Complaint.find().then(complaints => {
		if (typeof index !== 'undefined' && complaints.length > index) {
			const toDelete = complaints[index]._id;
			doDeleteById(toDelete);
		} else {
			res.redirect('/complaint');
		}
	}).catch(() => res.redirect('/complaint'));
});


// Complaint page
const fs = require('fs');
const path = require('path');
router.get('/complaint', async function(req, res) {
	let user = null;
	let dbUser = null;
	if (req.cookies && req.cookies.token) {
		try {
			user = jwt.verify(req.cookies.token, JWT_SECRET);
			const User = require('../../models/User');
			dbUser = await User.findOne({ email: user.email });
		} catch (e) {
			user = null;
			dbUser = null;
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
			user: dbUser || user || { role: 'public' } // Use DB user if available, fallback to JWT user
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

						const User = require('../../models/User');
						User.findOne({ email: user.email }).then(dbUser => {
							if (!dbUser) {
								return res.render('form', { 
									title: 'Form', 
									email: user.email,
									user: user
								});
							}
							res.render('form', { 
								title: 'Form', 
								email: dbUser.email,
								user: dbUser
							});
						}).catch(err => {
							console.error('Error fetching user for form:', err);
							res.render('form', { 
								title: 'Form', 
								email: user.email,
								user: user
							});
						});
});
// Handle form submission and store data in a file
const multer = require('multer');
const upload = multer({
	storage: multer.memoryStorage(),
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

	// Check if student is trying to submit faculty complaints
	if (user.role === 'student' && category.toLowerCase() === 'faculty') {
		return res.render('form', {
			title: 'Form',
			error: 'Students are not allowed to submit complaints about faculty.',
			email: user.email,
			user: user
		});
	}

	let photo = {};
	if (req.file) {
		photo = {
			data: req.file.buffer,
			contentType: req.file.mimetype
		};
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

	complaint.save().then(async (saved) => {
		// Also store a minimal record in the dashboard collection
		try {
			// Parse raised date from form (string) to Date, fallback to now
			let raisedDate = new Date();
			if (date) {
				const parsed = new Date(date);
				if (!isNaN(parsed.getTime())) {
					raisedDate = parsed;
				}
			}
			const dashboardItem = new Dashboard({
				complaintId: saved && saved._id ? saved._id : undefined,
				complaintType: category,
				raisedBy: email,
				raisedDate: raisedDate,
				status: 'Unsolved'
			});
			await dashboardItem.save();
		} catch (dashErr) {
			console.error('Failed to save dashboard item:', dashErr.message);
			// Continue regardless
		}
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
	const { id, index } = req.body;

	const markSolvedById = async (toUpdateId) => {
		try {
			// Update complaint: set explicit solved status and color for UI
			await Complaint.findByIdAndUpdate(toUpdateId, { status: 'solved', color: 'green' });

			// Get the email of the user performing the action
			let solverEmail = '';
			if (req.cookies && req.cookies.token) {
				try {
					const jwt = require('jsonwebtoken');
					const JWT_SECRET = 'securemycampusjwt';
					const user = jwt.verify(req.cookies.token, JWT_SECRET);
					solverEmail = user.email;
				} catch (e) {
					solverEmail = '';
				}
			}
			// Update dashboard
			await Dashboard.findOneAndUpdate(
				{ complaintId: toUpdateId },
				{ status: 'Solved', solvedBy: solverEmail, solvedDate: new Date() },
				{ new: true }
			);
		} catch (e) {
			console.error('Failed to mark solved:', e.message);
		} finally {
			res.redirect('/complaint');
		}
	};

	if (id) {
		return markSolvedById(id);
	}
	// Fallback: legacy index-based update
	Complaint.find().then(complaints => {
		if (typeof index !== 'undefined' && complaints.length > index) {
			const toUpdate = complaints[index]._id;
			return markSolvedById(toUpdate);
		}
		return res.redirect('/complaint');
	}).catch(() => res.redirect('/complaint'));
});
router.get('/faqs', async function(req, res) {
				let user = null;
				let dbUser = null;
				if (req.cookies && req.cookies.token) {
					try {
						user = jwt.verify(req.cookies.token, JWT_SECRET);
						const User = require('../../models/User');
						dbUser = await User.findOne({ email: user.email });
					} catch (e) {
						user = null;
						dbUser = null;
					}
				}
				if (!user) {
					return res.render('signin', { title: 'Sign In', error: 'Please sign in to access FAQs.', email: '' });
				}
				res.render('faqs', { 
					title: 'FAQs', 
					email: user.email,
					user: dbUser || user
				});
});
// Feedback page
router.get('/feedback', async function(req, res) {
				let user = null;
				let dbUser = null;
				if (req.cookies && req.cookies.token) {
					try {
						user = jwt.verify(req.cookies.token, JWT_SECRET);
						const User = require('../../models/User');
						dbUser = await User.findOne({ email: user.email });
					} catch (e) {
						user = null;
						dbUser = null;
					}
				}
				if (!user) {
					return res.render('signin', { title: 'Sign In', error: 'Please sign in to access the feedback page.', email: '' });
				}
				res.render('feedback', { 
					title: 'Feedback', 
					email: user.email,
					user: dbUser || user
				});
});
// Handle feedback submission
router.post('/submit-feedback', async function(req, res) {
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

	const { name, email, type, rating, message } = req.body;

	// Validate rating
	if (!rating || rating < 1 || rating > 5) {
		const User = require('../../models/User');
		const dbUser = await User.findOne({ email: user.email });
		return res.render('feedback', {
			title: 'Feedback',
			error: 'Please select a rating (1-5 stars)',
			email: user.email,
			user: dbUser || user
		});
	}

	try {
		const Feedback = require('../../models/Feedback');
		const feedback = new Feedback({
			name,
			email,
			type,
			rating: parseInt(rating),
			message
		});

		await feedback.save();

		const User = require('../../models/User');
		const dbUser = await User.findOne({ email: user.email });
		res.render('feedback', {
			title: 'Feedback',
			success: 'Thank you for your feedback! We appreciate your input.',
			email: user.email,
			user: dbUser || user
		});
	} catch (err) {
		console.error('Error saving feedback:', err);
		const User = require('../../models/User');
		const dbUser = await User.findOne({ email: user.email });
		res.render('feedback', {
			title: 'Feedback',
			error: 'Error submitting feedback: ' + err.message,
			email: user.email,
			user: dbUser || user
		});
	}
});
// Dashboard page
router.get('/dashboard', async function(req, res) {
	let user = null;
	let dbUser = null;
	if (req.cookies && req.cookies.token) {
		try {
			user = jwt.verify(req.cookies.token, JWT_SECRET);
			const User = require('../../models/User');
			dbUser = await User.findOne({ email: user.email });
		} catch (e) {
			user = null;
			dbUser = null;
		}
	}
	if (!user) {
		return res.render('signin', { title: 'Sign In', error: 'Please sign in to access the dashboard.', email: '' });
	}

	// Get complaints based on user role
	const now = Date.now();
	let complaints = await Complaint.find({ 
		$or: [ 
			{ expiresAt: { $gt: now } }, 
			{ expiresAt: { $exists: false } } 
		] 
	});

	// Filter complaints based on user role
	if (user.role === 'student') {
		complaints = complaints.filter(c => c.category.toLowerCase() !== 'harassment');
	}

	// Get dashboard data
	const Dashboard = require('../../models/Dashboard');
	let dashboardData = await Dashboard.find().sort({ createdAt: -1 });

	// If student, filter out harassment from dashboardData
	if (user && user.role === 'student') {
		dashboardData = dashboardData.filter(d => (d.complaintType || '').toLowerCase() !== 'harassment');
	}

	res.render('dashboard', { 
		title: 'Dashboard', 
		email: user.email,
		user: dbUser || user,
		complaints: complaints,
		dashboardData: dashboardData,
		now: now
	});
});

// Route to add sample dashboard data (for testing)
router.post('/add-dashboard-data', async function(req, res) {
	let user = null;
	if (req.cookies && req.cookies.token) {
		try {
			user = jwt.verify(req.cookies.token, JWT_SECRET);
		} catch (e) {
			user = null;
		}
	}
	
	// Only admin can add dashboard data
	if (!user || user.role !== 'admin') {
		return res.status(403).json({ error: 'Only admins can add dashboard data' });
	}

	const Dashboard = require('../../models/Dashboard');
	const { title, description, data } = req.body;
	
	const dashboardItem = new Dashboard({
		title: title || 'Sample Dashboard Item',
		description: description || 'This is a sample dashboard data entry',
		data: data || { sample: 'data' }
	});

	await dashboardItem.save();
	res.redirect('/dashboard');
});

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


// Serve complaint images
router.get('/complaint-image/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (complaint && complaint.photo && complaint.photo.data) {
      res.set('Content-Type', complaint.photo.contentType);
      res.send(complaint.photo.data);
    } else {
      res.status(404).send('Image not found');
    }
  } catch (err) {
    res.status(500).send('Error retrieving image');
  }
});

// Serve user profile photos
router.get('/profile-image/:id', async (req, res) => {
  try {
    const User = require('../../models/User');
    const user = await User.findById(req.params.id);
    if (user && user.photo && user.photo.data) {
      res.set('Content-Type', user.photo.contentType);
      res.send(user.photo.data);
    } else {
      res.status(404).send('Image not found');
    }
  } catch (err) {
    res.status(500).send('Error retrieving image');
  }
});

module.exports = router;
