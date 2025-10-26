// Script to add sample dashboard data
// Run this script with: node add_dashboard_data.js

const mongoose = require('./mongo');
const Dashboard = require('./models/Dashboard');

async function addSampleData() {
  try {
    // Helper to get random pick
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Generate sample dashboard rows matching the table columns
    const now = new Date();
    const statuses = ['Unsolved', 'Solved'];
    const types = ['Maintenance', 'Harassment', 'Lost & Found', 'Other'];
    const solvers = ['Admin Team', 'Facility Dept.', 'Security', 'Counselor'];
    const emails = ['alice@anurag.edu.in', 'bob@anurag.edu.in', 'carol@anurag.edu.in', 'dave@anurag.edu.in'];

    const sampleData = Array.from({ length: 6 }).map((_, i) => {
      const status = pick(statuses);
      const raisedDate = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
      const solvedDate = status === 'Solved' ? new Date(raisedDate.getTime() + pick([1,2,3]) * 24 * 60 * 60 * 1000) : undefined;
      return {
        complaintType: pick(types),
        raisedBy: pick(emails),
        raisedDate,
        status,
        solvedBy: status === 'Solved' ? pick(solvers) : '',
        solvedDate
      };
    });

    for (const item of sampleData) {
      const dashboardItem = new Dashboard(item);
      await dashboardItem.save();
      console.log(`Added row: ${item.complaintType} | ${item.raisedBy} | ${item.status}`);
    }

    console.log('\nSample dashboard data added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding dashboard data:', error);
    process.exit(1);
  }
}

addSampleData();
