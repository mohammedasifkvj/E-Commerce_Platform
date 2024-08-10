// db.js
const mongoose = require('mongoose');


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL_LOCAL);
    console.log('Successfully connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connectin failed', err);
    process.exit(1); // Exit the process with failure
  }
};

module.exports = connectDB;
