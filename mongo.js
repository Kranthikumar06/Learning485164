require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;

// Mongoose connection options - keep reasonable timeouts and let the driver manage SRV
const options = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 90000,
  maxPoolSize: 10,
  minPoolSize: 1,
  connectTimeoutMS: 30000,
  family: 4,
  // use the driver's default for SRV and TLS; passing ssl/useUnifiedTopology explicitly
  // can sometimes conflict with newer drivers, so avoid setting deprecated flags.
};

const connectWithRetry = async (attempt = 1) => {
  try {
    await mongoose.connect(mongoURI, options);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error(`MongoDB connection error (attempt ${attempt}):`, err && err.message ? err.message : err);

    // If the error looks like an SRV/DNS lookup issue, log SRV resolution results for debugging
    const isSrvErr = (err && (err.code === 'ENOTFOUND' || (err.message && err.message.includes('querySrv')))) ||
                     (err && err.message && err.message.includes('ECONNREFUSED'));
    if (isSrvErr) {
      try {
        const dns = require('dns').promises;
        const hostPart = mongoURI.replace(/^mongodb\+srv:\/\//, '').split('/')[0];
        const srvName = `_mongodb._tcp.${hostPart}`;
        console.log('Attempting manual DNS SRV resolve for', srvName);
        const srv = await dns.resolveSrv(srvName);
        console.log('Manual SRV resolution result:', srv);

        // Build a fallback mongodb:// URI using resolved hosts (one-time fallback)
        if (srv && srv.length) {
          try {
            const authMatch = mongoURI.match(/^mongodb\+srv:\/\/(.*@)?([^/]+)\/?(.*)$/);
            // authMatch[1] contains user:pass@ if present
            const auth = authMatch && authMatch[1] ? authMatch[1].slice(0, -1) : null; // remove trailing @
            const dbName = (mongoURI.split('/').slice(3).join('/') || '').replace(/\?.*$/, '') || '';
            const hosts = srv.map(s => `${s.name}:${s.port}`).join(',');
            const fallbackUri = `mongodb://${auth ? auth + '@' : ''}${hosts}/${dbName || ''}?retryWrites=true&w=majority`;
            console.log('Attempting fallback (non-SRV) MongoDB URI:', fallbackUri.replace(/:[^:@]+@/, ':*****@'));

            // Try connecting with fallback URI (only one fallback attempt)
            await mongoose.connect(fallbackUri, options);
            console.log('Connected to MongoDB via fallback non-SRV URI');
            return; // success
          } catch (fallbackErr) {
            console.error('Fallback non-SRV connection failed:', fallbackErr && fallbackErr.message ? fallbackErr.message : fallbackErr);
          }
        }
      } catch (dnsErr) {
        console.error('Manual SRV resolve failed:', dnsErr && dnsErr.message ? dnsErr.message : dnsErr);
      }
    }

    if (attempt < 5) {
      console.log('Retrying connection in 5 seconds...');
      setTimeout(() => connectWithRetry(attempt + 1), 5000);
    } else {
      console.error('Exceeded maximum MongoDB connection attempts.');
    }
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
