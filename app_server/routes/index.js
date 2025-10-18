var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {
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

  // Get user from database to check role
  const User = require('../../models/User');
  let dbUser = null;
  if (user && user.email) {
    try {
      dbUser = await User.findOne({ email: user.email });
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  }

  // Fetch latest complaint
  const Complaint = require('../../models/Complaint');
  let latestComplaint = null;
  try {
    const now = Date.now();
    const userRole = dbUser ? dbUser.role : (user ? user.role : null);
    // Filter out harassment for students and unauthenticated users (case-insensitive)
    if (userRole === 'student' || !user) {
      latestComplaint = await Complaint.findOne({ 
        category: { $not: { $regex: /^harassment$/i } },
        $or: [ 
          { expiresAt: { $gt: now } }, 
          { expiresAt: { $exists: false } } 
        ] 
      }).sort({ _id: -1 }).limit(1);
    } else {
      latestComplaint = await Complaint.findOne({ 
        $or: [ 
          { expiresAt: { $gt: now } }, 
          { expiresAt: { $exists: false } } 
        ] 
      }).sort({ _id: -1 }).limit(1);
    }
  } catch (err) {
    console.error('Error fetching latest complaint:', err);
  }

  if (user && user.email) {
    console.log('Home page user object:', dbUser || user);
    res.render('home', {
      title: 'Home',
      email: dbUser ? dbUser.email : user.email,
      name: dbUser ? dbUser.name : user.name,
      username: dbUser ? dbUser.username : user.username,
      phone: dbUser ? dbUser.phone : user.phone,
      user: dbUser || user,
      latestComplaint: latestComplaint
    });
  } else {
    res.render('home', {
      title: 'Home',
      email: '',
      name: '',
      username: '',
      phone: '',
      user: null,
      latestComplaint: latestComplaint
    });
  }
});

module.exports = router;
