
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  username: String,
  phone: String,
  password: String,
  location: String,
  photo: {
    data: Buffer,
    contentType: String
  },
  role: { type: String, enum: ['admin', 'faculty', 'student'], required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
