"use strict";

const { v4: uuidv4 } = require("uuid");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { buildPrompt } = require("../services/prompt.service");
const { getAIResponse } = require("../services/ai.service");
const { cleanContent, truncateContent } = require("../utils/contentCleaner");

/**
 * POST /api/chat
 *
 * Orchestrates the full AI chat flow:
 *  1. Validate & clean inputs
 *  2. Find or create a Conversation document
 *  3. Load recent message history for memory
 *  4. Build system + user prompts
 *  5. Call the AI service
 *  6. Persist both messages to MongoDB
 *  7. Return the AI response to the client
 */
async function handleChat(req, res, next) {
  try {
    const {
      message,
      context = "",
      conversationId: incomingConversationId,
      mode = "explain",
      pageUrl = "",
      pageTitle = "",
    } = req.body;

    // ── 1. Validate message ───────────────────────────────────────────────
    // Note: validateRequest middleware already checked this, but we guard
    // again defensively in case the route is ever called without middleware.
    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: "message" is required.',
      });
    }

    // ── 2. Clean & truncate page context ────────────────────────────────
    const cleaned = cleanContent(context);
    const cleanedContext = truncateContent(cleaned); // max 6000 chars

    // ── 3. Find or create Conversation ──────────────────────────────────
    let conversation;

    if (incomingConversationId) {
      conversation = await Conversation.findOne({
        conversationId: incomingConversationId,
        isActive: true,
      });
    }

    if (!conversation) {
      // Either no ID was provided, or the ID doesn't match any active conversation
      const newId = uuidv4();
      conversation = await Conversation.create({
        conversationId: newId,
        pageUrl,
        pageTitle,
      });
    }

    const conversationId = conversation.conversationId;

    // ── 4. Load recent message history ───────────────────────────────────
    // Fetch the last 6 messages (3 turns) in chronological order so we can
    // feed them to the model as context, giving it short-term memory.
    const recentMessages = await Message.find({ conversationId })
      .sort({ timestamp: -1 })
      .limit(6)
      .lean();

    // Reverse so the oldest is first (chronological order for the API)
    const historyMessages = recentMessages
      .reverse()
      .map(({ role, content }) => ({ role, content }));

    // ── 5. Build prompts ─────────────────────────────────────────────────
    const { systemPrompt, userPrompt } = buildPrompt(
      message.trim(),
      cleanedContext,
      mode,
      pageTitle,
      pageUrl,
    );

    // ── 6. Call AI service ───────────────────────────────────────────────
    const {
      content: aiResponse,
      tokensUsed,
      model,
      reason,
      confidence,
    } = await getAIResponse(
      systemPrompt,
      userPrompt,
      historyMessages,
      cleanedContext, // raw content for routing analysis
      mode, // mode for routing analysis
      req.body.isYouTube || false,
      req.body.userPreference || null,
    );

    // ── 7. Persist messages ──────────────────────────────────────────────
    const contextSnapshot = cleanedContext.slice(0, 200); // Store only the preview

    await Message.create({
      conversationId,
      role: "user",
      content: message.trim(),
      mode,
      contextUsed: contextSnapshot,
    });

    await Message.create({
      conversationId,
      role: "assistant",
      content: aiResponse,
      mode,
      contextUsed: contextSnapshot,
      tokensUsed,
      modelUsed: model,
    });

    // ── 8. Update Conversation metadata ─────────────────────────────────
    await Conversation.updateOne(
      { conversationId },
      {
        $set: { updatedAt: new Date(), pageUrl, pageTitle },
        $inc: { messageCount: 2 }, // user + assistant message
      },
    );

    // ── 9. Respond ───────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      conversationId,
      response: aiResponse,
      tokensUsed,
      model,
      reason,
      confidence,
    });
  } catch (error) {
    // Delegate all unexpected errors to the global error handler
    next(error);
  }
}

module.exports = { handleChat };
