require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;

const options = {
  serverSelectionTimeoutMS: 60000,
  socketTimeoutMS: 90000,
  maxPoolSize: 10,
  minPoolSize: 1,
  connectTimeoutMS: 60000,
  family: 4,
  ssl: true,
  authSource: 'admin',
  replicaSet: 'atlas-d60q75-shard-0'
};

const connectWithRetry = async () => {
  try {
    await mongoose.connect(mongoURI, options);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Initial connection
connectWithRetry();

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('MongoDB error:', err);
});

db.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectWithRetry, 5000);
});

module.exports = mongoose;
