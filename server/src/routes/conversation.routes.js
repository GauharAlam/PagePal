'use strict';

const { Router } = require('express');
const {
  getConversations,
  getConversationMessages,
  deleteConversation,
} = require('../controllers/conversation.controller');

const router = Router();

/**
 * GET /api/conversations
 * Returns the 20 most recent active conversations.
 */
router.get('/', getConversations);

/**
 * GET /api/conversations/:conversationId/messages
 * Returns all messages in a specific conversation, chronologically sorted.
 */
router.get('/:conversationId/messages', getConversationMessages);

/**
 * DELETE /api/conversations/:conversationId
 * Soft-deletes a conversation (sets isActive = false).
 */
router.delete('/:conversationId', deleteConversation);

module.exports = router;
