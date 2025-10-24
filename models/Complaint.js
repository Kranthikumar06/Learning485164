const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  name: String,
  phone: String,
  date: String,
  email: String,
  category: String,
  location: String,
  description: String,
  photo: {
    data: Buffer,
    contentType: String
  },
  color: { type: String, default: 'red' },
  expiresAt: Number,
  status: String,
  submittedBy: { type: String, enum: ['admin', 'faculty', 'student'] }, // Track who submitted the complaint
  createdAt: { type: Date, default: Date.now }
});

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;

