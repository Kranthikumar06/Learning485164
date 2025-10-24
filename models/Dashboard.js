const mongoose = require('mongoose');

// Dashboard items follow the same columns as the complaints dashboard table
// Columns: S.No (derived), Complaint Type, Raised By, Raised Date, Status, Solved By, Solved Date
const dashboardSchema = new mongoose.Schema({
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  complaintType: { type: String },
  raisedBy: { type: String }, // email or name
  raisedDate: { type: Date },
  status: { type: String, enum: ['Unsolved', 'Solved'], default: 'Unsolved' },
  solvedBy: { type: String, default: '' },
  solvedDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Dashboard = mongoose.model('Dashboard', dashboardSchema);

module.exports = Dashboard;
