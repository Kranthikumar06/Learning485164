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
  res.render('home', {
    title: 'Home',
    email: user ? user.email : '',
    name: user ? user.name : '',
    username: user ? user.username : '',
    phone: user ? user.phone : '',
    user: user
  });
});

module.exports = router;
