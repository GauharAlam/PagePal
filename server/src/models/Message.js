"use strict";

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // Foreign key linking to Conversation.conversationId
    conversationId: {
      type: String,
      required: [true, "conversationId is required"],
      index: true, // Fetch all messages for a conversation efficiently
    },

    // Mirrors the OpenAI roles so history can be forwarded directly to the API
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: [true, "role is required"],
    },

    // Full text of the message
    content: {
      type: String,
      required: [true, "content is required"],
    },

    // The interaction mode active when this message was sent
    mode: {
      type: String,
      enum: [
        "explain",
        "summarize",
        "keypoints",
        "beginner",
        "code",
        "selection",
        null,
      ],
      default: null,
    },

    // Truncated snapshot of page context — useful for audit / debugging
    // without storing the entire page content on every message.
    contextUsed: {
      type: String,
      maxlength: 200,
      default: "",
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },

    // Total tokens consumed by the AI API call that produced this message.
    // Stored only on assistant messages.
    tokensUsed: {
      type: Number,
      default: 0,
    },

    // Which AI model generated this assistant message.
    // Stored only on assistant messages; helps with analytics and debugging.
    modelUsed: {
      type: String,
      enum: ["openai", "gemini", "deepseek", "grok", "nvidia"],
      default: "nvidia",
    },
  },
  {
    versionKey: false,
  },
);

// Fetch messages for a conversation in chronological order
messageSchema.index({ conversationId: 1, timestamp: 1 });

module.exports = mongoose.model("Message", messageSchema);
