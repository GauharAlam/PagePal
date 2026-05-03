'use strict';

const mongoose = require('mongoose');

/**
 * Establishes a connection to MongoDB using the URI stored in MONGODB_URI.
 * Throws on failure so the calling bootstrap function can exit gracefully.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  try {
    await mongoose.connect(uri, {
      // These options are the defaults in Mongoose 8 but listed explicitly
      // for clarity and forward-compatibility.
      serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB is unreachable
    });

    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error; // Re-throw so server.js can catch and exit
  }
}

module.exports = { connectDB };
