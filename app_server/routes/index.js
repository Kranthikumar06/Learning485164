
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

  // Fetch latest complaint
  const Complaint = require('../../models/Complaint');
  let latestComplaint = null;
  try {
    const now = Date.now();
    latestComplaint = await Complaint.findOne({ 
      $or: [ 
        { expiresAt: { $gt: now } }, 
        { expiresAt: { $exists: false } } 
      ] 
    }).sort({ _id: -1 }).limit(1);
  } catch (err) {
    console.error('Error fetching latest complaint:', err);
  }

  if (user && user.email) {
    const User = require('../../models/User');
    User.findOne({ email: user.email }).then(dbUser => {
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
    }).catch(err => {
      console.log('Home page user object (error):', user);
      res.render('home', {
        title: 'Home',
        email: user.email,
        name: user.name,
        username: user.username,
        phone: user.phone,
        user: user,
        latestComplaint: latestComplaint
      });
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
