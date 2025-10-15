
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
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
        user: dbUser || user
      });
    }).catch(err => {
      console.log('Home page user object (error):', user);
      res.render('home', {
        title: 'Home',
        email: user.email,
        name: user.name,
        username: user.username,
        phone: user.phone,
        user: user
      });
    });
  } else {
    res.render('home', {
      title: 'Home',
      email: '',
      name: '',
      username: '',
      phone: '',
      user: null
    });
  }
});

module.exports = router;
