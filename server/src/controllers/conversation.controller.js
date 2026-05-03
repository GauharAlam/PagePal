'use strict';

const Conversation = require('../models/Conversation');
const Message      = require('../models/Message');

/**
 * GET /api/conversations
 *
 * Returns the 20 most recently updated active conversations,
 * sorted newest-first.
 */
async function getConversations(req, res) {
  try {
    const conversations = await Conversation.find({ isActive: true })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error('[getConversations]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversations.',
    });
  }
}

/**
 * GET /api/conversations/:conversationId/messages
 *
 * Returns all messages for the given conversationId in chronological order.
 * Returns 404 if the conversation does not exist.
 */
async function getConversationMessages(req, res) {
  try {
    const { conversationId } = req.params;

    // Confirm the conversation exists and is active before fetching messages
    const conversation = await Conversation.findOne({
      conversationId,
      isActive: true,
    }).lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found.',
      });
    }

    const messages = await Message.find({ conversationId })
      .sort({ timestamp: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      conversationId,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error('[getConversationMessages]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve messages.',
    });
  }
}

/**
 * DELETE /api/conversations/:conversationId
 *
 * Soft-deletes a conversation by setting isActive = false.
 * The underlying messages are retained for audit purposes.
 * Returns 404 if the conversation does not exist.
 */
async function deleteConversation(req, res) {
  try {
    const { conversationId } = req.params;

    const result = await Conversation.findOneAndUpdate(
      { conversationId, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or already deleted.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Conversation ${conversationId} has been deleted.`,
    });
  } catch (error) {
    console.error('[deleteConversation]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete conversation.',
    });
  }
}

module.exports = {
  getConversations,
  getConversationMessages,
  deleteConversation,
};
