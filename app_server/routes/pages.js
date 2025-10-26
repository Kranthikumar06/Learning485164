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
router.post('/delete-complaint', async function(req, res) {
	const { id, index } = req.body;
	
	// Check authorization
	if (!req.cookies || !req.cookies.token) {
		return res.status(401).send('Unauthorized: Please log in');
	}
	
	let currentUser;
	try {
		const User = require('../../models/User');
		const decoded = jwt.verify(req.cookies.token, JWT_SECRET);
		currentUser = await User.findOne({ email: decoded.email });
		
		if (!currentUser) {
			return res.status(401).send('Unauthorized: User not found');
		}
		
		// Get the complaint to check ownership (only if id is provided)
		if (id) {
			const complaint = await Complaint.findById(id);
			if (!complaint) {
				return res.status(404).send('Complaint not found');
			}
			
			// Check if user is authorized (complaint owner, admin, or faculty)
			const isOwner = currentUser.email.toLowerCase() === complaint.email.toLowerCase();
			const isAdminOrFaculty = currentUser.role === 'admin' || currentUser.role === 'faculty';
			
			if (!isOwner && !isAdminOrFaculty) {
				return res.status(403).send('Forbidden: You do not have permission to delete this complaint');
			}
		}
	} catch (error) {
		console.error('Authorization error:', error);
		return res.status(401).send('Unauthorized: Invalid token');
	}
	
	const doDeleteById = async (toDeleteId, complaint, deleterUser) => {
		try {
			// Delete the complaint
			await Complaint.findByIdAndDelete(toDeleteId);
			
			// Delete from dashboard
			try {
				await Dashboard.deleteOne({ complaintId: toDeleteId });
			} catch (e) {
				console.error('Failed to delete dashboard item for complaint:', e.message);
			}
			
			// Send deletion email notification to complaint creator
			try {
				const sgMail = require('@sendgrid/mail');
				sgMail.setApiKey(process.env.SENDGRID_API_KEY);
				
				const complaintDate = complaint.date ? new Date(complaint.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
				const deletedDate = new Date().toLocaleDateString('en-GB', { 
					year: 'numeric', 
					month: 'long', 
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				});
				
				const deleterName = deleterUser.name || deleterUser.email;
				const deleterEmail = deleterUser.email;

				const msg = {
					to: complaint.email,
					from: process.env.EMAIL_USER,
					subject: 'Complaint Deleted - Secure My Campus',
					html: `
					<div style="font-family: Arial, sans-serif; background: #f0f9ff; padding: 32px;">
						<div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); overflow: hidden;">
							<div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px; text-align: center;">
								<h1 style="color: #fff; margin: 0; font-size: 28px;">Complaint Deleted</h1>
							</div>
							<div style="padding: 32px;">
								<p style="font-size: 17px; color: #222; margin-bottom: 8px;">Dear ${complaint.name || 'User'},</p>
								<p style="font-size: 16px; color: #333; margin-bottom: 24px;">
									Your complaint has been <strong style="color: #ef4444;">deleted</strong> from the system.
								</p>
								
								<div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
									<h3 style="color: #991b1b; margin: 0 0 16px 0; font-size: 18px;">Complaint Details:</h3>
									<table style="width: 100%; border-collapse: collapse;">
										<tr>
											<td style="padding: 8px 0; font-weight: bold; color: #991b1b; width: 140px;">Category:</td>
											<td style="padding: 8px 0; color: #333;">${complaint.category}</td>
										</tr>
										<tr>
											<td style="padding: 8px 0; font-weight: bold; color: #991b1b;">Location:</td>
											<td style="padding: 8px 0; color: #333;">${complaint.location || 'Not provided'}</td>
										</tr>
										<tr>
											<td style="padding: 8px 0; font-weight: bold; color: #991b1b;">Description:</td>
											<td style="padding: 8px 0; color: #333;">${complaint.description}</td>
										</tr>
										<tr>
											<td style="padding: 8px 0; font-weight: bold; color: #991b1b;">Submitted On:</td>
											<td style="padding: 8px 0; color: #333;">${complaintDate}</td>
										</tr>
									</table>
								</div>

								<div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
									<h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 18px;">Deletion Information:</h3>
									<table style="width: 100%; border-collapse: collapse;">
										<tr>
											<td style="padding: 8px 0; font-weight: bold; color: #1e40af; width: 140px;">Deleted By:</td>
											<td style="padding: 8px 0; color: #333;">${deleterName}</td>
										</tr>
										<tr>
											<td style="padding: 8px 0; font-weight: bold; color: #1e40af;">Email:</td>
											<td style="padding: 8px 0; color: #333;">${deleterEmail}</td>
										</tr>
										<tr>
											<td style="padding: 8px 0; font-weight: bold; color: #1e40af;">Deleted On:</td>
											<td style="padding: 8px 0; color: #333;">${deletedDate}</td>
										</tr>
										<tr>
											<td style="padding: 8px 0; font-weight: bold; color: #1e40af;">Status:</td>
											<td style="padding: 8px 0;"><span style="color: #ef4444; font-weight: bold;">✗ Deleted</span></td>
										</tr>
									</table>
								</div>

								<p style="font-size: 15px; color: #555; margin-bottom: 24px;">
									If you have any questions or believe this complaint was deleted in error, please contact the campus security office or administrator.
								</p>

								<div style="text-align: center; margin: 32px 0;">
									<a href="${process.env.BASE_URL || 'http://localhost:3000'}/complaint" 
									   style="display: inline-block; background: #3b82f6; color: #fff; padding: 14px 32px; 
									   border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
										View Complaint Box
									</a>
								</div>

								<div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-top: 24px;">
									<p style="font-size: 14px; color: #6b7280; margin: 0; text-align: center;">
										Thank you for using Secure My Campus to help maintain a safe environment.
									</p>
								</div>
							</div>
							<div style="background: #f3f4f6; padding: 20px; text-align: center;">
								<p style="font-size: 13px; color: #9ca3af; margin: 0;">
									© 2025 Secure My Campus. All rights reserved.
								</p>
							</div>
						</div>
					</div>
					`
				};
				
				await sgMail.send(msg);
				console.log('Deletion email sent successfully to:', complaint.email);
			} catch (mailErr) {
				console.error('Failed to send deletion email:', mailErr);
				// Don't block deletion if email fails
			}
			
			res.redirect('/complaint');
		} catch (err) {
			console.error('Delete complaint failed:', err.message);
			res.redirect('/complaint');
		}
	};

	if (id) {
		const complaint = await Complaint.findById(id);
		if (!complaint) {
			return res.status(404).send('Complaint not found');
		}
		return doDeleteById(id, complaint, currentUser);
	}
	// Fallback: legacy index-based delete
	try {
		const complaints = await Complaint.find();
		if (typeof index !== 'undefined' && complaints.length > index) {
			const toDelete = complaints[index];
			return doDeleteById(toDelete._id, toDelete, currentUser);
		} else {
			res.redirect('/complaint');
		}
	} catch (error) {
		console.error('Error in legacy delete:', error);
		res.redirect('/complaint');
	}
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
				// Send confirmation email to user after complaint registration
				try {
						const sgMail = require('@sendgrid/mail');
						sgMail.setApiKey(process.env.SENDGRID_API_KEY);
						const formattedDate = date ? new Date(date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
						const status = 'Unsolved';
						const statusColor = status === 'Unsolved' ? '#d32f2f' : '#388e3c';
						const msg = {
								to: email,
								from: process.env.EMAIL_USER, // Must be a verified sender in SendGrid
								subject: 'Complaint Registered Successfully',
								html: `
								<div style="font-family: Arial, sans-serif; background: #f6f7fb; padding: 32px;">
									<div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #e0e0e0; padding: 32px;">
										<h2 style="color: #0070f3; margin-bottom: 18px;">Complaint Registered Successfully</h2>
										<p style="font-size: 17px; color: #222; margin-bottom: 8px;">Dear ${name || email},</p>
										<p style="font-size: 16px; color: #333; margin-bottom: 24px;">Your complaint has been successfully registered with Secure My Campus.<br>We will review and address it as soon as possible.</p>
										<div style="background: #f4f8fc; border-left: 4px solid #2196f3; border-radius: 8px; padding: 18px 20px 14px 20px; margin-bottom: 24px;">
											<div style="font-weight: bold; color: #1976d2; font-size: 16px; margin-bottom: 10px;">Complaint Details:</div>
											<div style="margin-bottom: 6px;"><span style="font-weight: bold; color: #222;">Category:</span> ${category}</div>
											<div style="margin-bottom: 6px;"><span style="font-weight: bold; color: #222;">Location:</span> ${location || 'Not provided'}</div>
											<div style="margin-bottom: 6px;"><span style="font-weight: bold; color: #222;">Description:</span> ${description}</div>
											<div style="margin-bottom: 6px;"><span style="font-weight: bold; color: #222;">Date Submitted:</span> ${formattedDate}</div>
											<div style="margin-bottom: 6px;"><span style="font-weight: bold; color: #222;">Status:</span> <span style="color: ${statusColor}; font-weight: bold;">${status}</span></div>
										</div>
										<p style="font-size: 15px; color: #333; margin-bottom: 18px;">You can track the status of your complaint by visiting the <a href="${process.env.BASE_URL || 'http://localhost:3000'}/complaint" style="color: #1976d2; text-decoration: underline;">Complaint Box</a>.</p>
										<p style="font-size: 15px; color: #666; margin-bottom: 18px;">Thank you for helping us maintain a safe campus environment.</p>
										<div style="margin-top: 24px; font-size: 15px; color: #222;">Best regards,<br><span style="font-weight: bold; color: #222;">Secure My Campus Team</span></div>
										<div style="margin-top: 32px; text-align: center; color: #aaa; font-size: 12px;">This is an automated email. Please do not reply to this message.</div>
									</div>
								</div>
								`
						};
						await sgMail.send(msg);
				} catch (mailErr) {
						// Optionally log or ignore email errors, but do not block complaint registration
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
router.post('/change-complaint-color', async function(req, res) {
	const { id, index } = req.body;
	
	// Check authorization
	if (!req.cookies || !req.cookies.token) {
		return res.status(401).send('Unauthorized: Please log in');
	}
	
	let currentUser;
	try {
		const User = require('../../models/User');
		const decoded = jwt.verify(req.cookies.token, JWT_SECRET);
		currentUser = await User.findOne({ email: decoded.email });
		
		if (!currentUser) {
			return res.status(401).send('Unauthorized: User not found');
		}
	} catch (error) {
		console.error('Authorization error:', error);
		return res.status(401).send('Unauthorized: Invalid token');
	}

	const markSolvedById = async (toUpdateId) => {
		try {
			// Get the complaint details before updating
			const complaint = await Complaint.findById(toUpdateId);
			if (!complaint) {
				console.error('Complaint not found');
				return res.redirect('/complaint');
			}
			
			// Check if user is authorized (complaint owner, admin, or faculty)
			const isOwner = currentUser.email.toLowerCase() === complaint.email.toLowerCase();
			const isAdminOrFaculty = currentUser.role === 'admin' || currentUser.role === 'faculty';
			
			if (!isOwner && !isAdminOrFaculty) {
				return res.status(403).send('Forbidden: You do not have permission to mark this complaint as solved');
			}

			// Update complaint: set explicit solved status and color for UI
			await Complaint.findByIdAndUpdate(toUpdateId, { status: 'solved', color: 'green' });

			// Get the email of the user performing the action
			let solverEmail = '';
			let solverName = '';
			if (req.cookies && req.cookies.token) {
				try {
					const User = require('../../models/User');
					const user = jwt.verify(req.cookies.token, JWT_SECRET);
					solverEmail = user.email;
					// Get solver's full name from database
					const solverUser = await User.findOne({ email: user.email });
					solverName = solverUser && solverUser.name ? solverUser.name : solverEmail;
				} catch (e) {
					solverEmail = '';
					solverName = 'Admin';
				}
			}

			// Update dashboard
			await Dashboard.findOneAndUpdate(
				{ complaintId: toUpdateId },
				{ status: 'Solved', solvedBy: solverEmail, solvedDate: new Date() },
				{ new: true }
			);

			// Send email notification to complaint creator
			try {
				const sgMail = require('@sendgrid/mail');
				sgMail.setApiKey(process.env.SENDGRID_API_KEY);
				
				const complaintDate = complaint.date ? new Date(complaint.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
				const solvedDate = new Date().toLocaleDateString('en-GB', { 
					year: 'numeric', 
					month: 'long', 
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				});

				const msg = {
					to: complaint.email,
					from: process.env.EMAIL_USER,
					subject: 'Complaint Resolved - Secure My Campus',
					html: `
					<div style="font-family: Arial, sans-serif; background: #f0f9ff; padding: 32px;">
						<div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); overflow: hidden;">
							<div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
								<h1 style="color: #fff; margin: 0; font-size: 28px;"> Complaint Resolved</h1>
							</div>
							<div style="padding: 32px;">
								<p style="font-size: 17px; color: #222; margin-bottom: 8px;">Dear ${complaint.name || 'User'},</p>
								<p style="font-size: 16px; color: #333; margin-bottom: 24px;">
									Great news! Your complaint has been <strong style="color: #10b981;">successfully resolved</strong>.
								</p>
								
								<div style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
									<h3 style="color: #065f46; margin: 0 0 16px 0; font-size: 18px;">Complaint Details:</h3>
									<table style="width: 100%; border-collapse: collapse;">
										<tr>
											<td style="padding: 8px 0; font-weight: bold; color: #065f46; width: 140px;">Category:</td>
											<td style="padding: 8px 0; color: #333;">${complaint.category}</td>
										</tr>
										<tr>
											<td style="padding: 8px 0; font-weight: bold; color: #065f46;">Location:</td>
											<td style="padding: 8px 0; color: #333;">${complaint.location || 'Not provided'}</td>
										</tr>
										<tr>
											<td style="padding: 8px 0; font-weight: bold; color: #065f46;">Description:</td>
											<td style="padding: 8px 0; color: #333;">${complaint.description}</td>
										</tr>
										<tr>
											<td style="padding: 8px 0; font-weight: bold; color: #065f46;">Submitted On:</td>
											<td style="padding: 8px 0; color: #333;">${complaintDate}</td>
										</tr>
									</table>
								</div>

								<div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
									<h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 18px;">Resolution Information:</h3>
									<table style="width: 100%; border-collapse: collapse;">
										<tr>
											<td style="padding: 8px 0; font-weight: bold; color: #1e40af; width: 140px;">Resolved By:</td>
											<td style="padding: 8px 0; color: #333;">${solverName}</td>
										</tr>
										<tr>
											<td style="padding: 8px 0; font-weight: bold; color: #1e40af;">Email:</td>
											<td style="padding: 8px 0; color: #333;">${solverEmail || 'System Admin'}</td>
										</tr>
										<tr>
											<td style="padding: 8px 0; font-weight: bold; color: #1e40af;">Resolved On:</td>
											<td style="padding: 8px 0; color: #333;">${solvedDate}</td>
										</tr>
										<tr>
											<td style="padding: 8px 0; font-weight: bold; color: #1e40af;">Status:</td>
											<td style="padding: 8px 0;"><span style="color: #10b981; font-weight: bold;">✓ Solved</span></td>
										</tr>
									</table>
								</div>

								<p style="font-size: 15px; color: #555; margin-bottom: 24px;">
									Thank you for reporting this issue. Your feedback helps us maintain a safe and secure campus environment for everyone.
								</p>

								<div style="text-align: center; margin: 32px 0;">
									<a href="${process.env.BASE_URL || 'http://localhost:3000'}/complaint" 
									   style="display: inline-block; background: #10b981; color: #fff; padding: 14px 32px; 
									          border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;
									          box-shadow: 0 4px 12px rgba(16,185,129,0.3);">
										View Complaint Box
									</a>
								</div>

								<div style="border-top: 2px solid #e5e7eb; margin-top: 32px; padding-top: 24px;">
									<p style="font-size: 15px; color: #222; margin-bottom: 8px;">Best regards,</p>
									<p style="font-size: 16px; color: #059669; font-weight: bold; margin: 0;">Secure My Campus Team</p>
								</div>
							</div>
							<div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
								<p style="margin: 0; font-size: 13px; color: #6b7280;">
									This is an automated email. Please do not reply to this message.
								</p>
							</div>
						</div>
					</div>
					`
				};

				await sgMail.send(msg);
				console.log('Complaint resolved email sent to:', complaint.email);
			} catch (mailErr) {
				console.error('Failed to send resolution email:', mailErr.message);
				// Continue regardless - don't block the resolution
			}

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
