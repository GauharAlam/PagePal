'use strict';

const { Router }        = require('express');
const validateRequest   = require('../middlewares/validateRequest');
const { handleChat }    = require('../controllers/chat.controller');

const router = Router();

/**
 * POST /api/chat
 *
 * Body:
 *  {
 *    message:        string  (required) — the user's question
 *    context:        string  (optional) — cleaned page text from the extension
 *    conversationId: string  (optional) — omit to start a new conversation
 *    mode:           string  (optional) — explain | summarize | keypoints | beginner | code | selection
 *    pageUrl:        string  (optional) — current tab URL
 *    pageTitle:      string  (optional) — current tab title
 *  }
 *
 * Response:
 *  {
 *    success:        boolean
 *    conversationId: string
 *    response:       string  — AI-generated reply
 *    tokensUsed:     number
 *  }
 */
router.post('/', validateRequest, handleChat);

module.exports = router;
