const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://Kranthi:111222333444555@cluster0.zfm5dnk.mongodb.net/';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

module.exports = mongoose;
