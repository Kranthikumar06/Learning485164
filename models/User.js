const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  username: String,
  phone: String,
  password: String,
  location: String,
  photo: String,
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
