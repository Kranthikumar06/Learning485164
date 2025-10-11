const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  name: String,
  phone: String,
  date: String,
  email: String,
  category: String,
  location: String,
  description: String,
  photo: String,
  color: { type: String, default: 'red' },
  expiresAt: Number,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
