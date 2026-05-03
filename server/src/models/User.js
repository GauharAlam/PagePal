'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema(
  {
    // Stable client-generated (or server-generated) identifier.
    // The Chrome extension stores this in chrome.storage.local.
    userId: {
      type: String,
      unique: true,
      default: uuidv4,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    preferences: {
      // Preferred response language (ISO 639-1 code)
      language: {
        type: String,
        default: 'en',
        trim: true,
      },
      // Default interaction mode sent with each chat request
      mode: {
        type: String,
        default: 'explain',
        enum: ['explain', 'summarize', 'keypoints', 'beginner', 'code', 'selection'],
      },
      // Extension UI theme
      theme: {
        type: String,
        default: 'dark',
        enum: ['dark', 'light'],
      },
    },
  },
  {
    // Disable Mongoose's automatic __v field
    versionKey: false,
  }
);

module.exports = mongoose.model('User', userSchema);
