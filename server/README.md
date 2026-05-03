# PagePal AI — Backend Server

A production-ready **Node.js + Express + MongoDB** REST API that powers the
**PagePal AI** Chrome extension. It acts as a secure gateway between the
browser extension and the OpenAI API, persisting conversations and enforcing
rate limits so your API key never ships to the client.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Prerequisites](#2-prerequisites)
3. [Setup](#3-setup)
4. [API Endpoints](#4-api-endpoints)
5. [Environment Variables](#5-environment-variables)
6. [Connecting the Chrome Extension](#6-connecting-the-chrome-extension)
7. [Architecture Overview](#7-architecture-overview)
8. [Folder Structure](#8-folder-structure)

---

## 1. Project Overview

PagePal AI is a Chrome extension that lets users ask questions about any
webpage they're viewing. This backend:

- Receives page context (scraped text) and the user's question from the
  extension.
- Cleans and truncates the raw page text before it touches the AI.
- Builds a mode-aware system prompt (explain / summarize / key points /
  beginner / code / selection).
- Calls **GPT-4o-mini** via the OpenAI API.
- Stores every conversation and message in MongoDB for history and memory.
- Feeds the last 6 messages back to the model as short-term memory.
- Applies global rate limiting (30 req/min by default) to control costs.

---

## 2. Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18 or later |
| npm | 9 or later (bundled with Node 18) |
| MongoDB | 6+ local **or** a free [MongoDB Atlas](https://cloud.mongodb.com) cluster |
| OpenAI API Key | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |

---

## 3. Setup

```bash
# 1. Clone the repository (or navigate to the project folder)
cd Ai_Tools/server

# 2. Install dependencies
npm install

# 3. Copy the example env file and fill in your values
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pagepal
OPENAI_API_KEY=sk-...your-key-here...
NODE_ENV=development
ALLOWED_ORIGINS=chrome-extension://your_extension_id_here
MAX_REQUESTS_PER_MINUTE=30
```

```bash
# 4. Start the development server (auto-restarts on file changes)
npm run dev

# — or — start without nodemon
npm start
```

The server will log:

```
✅ MongoDB connected: localhost
🚀 PagePal server running on http://localhost:5000
   Environment : development
   Health check: http://localhost:5000/api/health
```

---

## 4. API Endpoints

### Base URL

```
http://localhost:5000/api
```

### Health Check

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Returns `{ status: "ok", timestamp }` |

### Chat

| Method | Path | Description |
|---|---|---|
| `POST` | `/chat` | Send a message and receive an AI response |

**Request body** (`Content-Type: application/json`):

```json
{
  "message":        "What is this article about?",
  "context":        "Raw page text scraped by the extension...",
  "conversationId": "optional-uuid-to-continue-a-conversation",
  "mode":           "explain",
  "pageUrl":        "https://example.com/article",
  "pageTitle":      "Example Article Title"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `message` | string | Yes | The user's question (max 2000 chars) |
| `context` | string | No | Scraped page text — cleaned server-side |
| `conversationId` | string | No | Omit to start a new conversation |
| `mode` | string | No | `explain` \| `summarize` \| `keypoints` \| `beginner` \| `code` \| `selection` |
| `pageUrl` | string | No | Active tab URL |
| `pageTitle` | string | No | Active tab title |

**Success response** `200`:

```json
{
  "success": true,
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "response": "This article explains...",
  "tokensUsed": 312
}
```

### Conversations

| Method | Path | Description |
|---|---|---|
| `GET` | `/conversations` | List the 20 most recent conversations |
| `GET` | `/conversations/:conversationId/messages` | Get all messages in a conversation |
| `DELETE` | `/conversations/:conversationId` | Soft-delete a conversation |

**GET /conversations** — response:

```json
{
  "success": true,
  "count": 5,
  "conversations": [
    {
      "conversationId": "uuid",
      "pageTitle": "Example Page",
      "pageUrl": "https://example.com",
      "messageCount": 6,
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**GET /conversations/:id/messages** — response:

```json
{
  "success": true,
  "conversationId": "uuid",
  "count": 4,
  "messages": [
    { "role": "user",      "content": "What is this about?", "timestamp": "..." },
    { "role": "assistant", "content": "This page is about...", "timestamp": "..." }
  ]
}
```

---

## 5. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port the Express server listens on |
| `MONGODB_URI` | — | Full MongoDB connection string |
| `OPENAI_API_KEY` | — | Your OpenAI secret key — **never commit this** |
| `NODE_ENV` | `development` | Set to `production` to hide stack traces in errors |
| `ALLOWED_ORIGINS` | — | Chrome extension origin for CORS in production |
| `MAX_REQUESTS_PER_MINUTE` | `30` | Rate limit per IP per minute |

---

## 6. Connecting the Chrome Extension

### Development (unpacked extension)

In `server.js` the CORS `origin` is currently set to `'*'`, which allows any
origin. This is intentional during development because unpacked extensions
receive a temporary ID that changes on reload.

**In the extension**, send requests to:

```js
const BASE_URL = 'http://localhost:5000/api';

const response = await fetch(`${BASE_URL}/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message:  userQuestion,
    context:  document.body.innerText,   // or your content-script scraper
    mode:     'explain',
    pageUrl:  window.location.href,
    pageTitle: document.title,
  }),
});

const data = await response.json();
console.log(data.response); // AI reply
```

### Production

1. Deploy this server (e.g. Railway, Render, Fly.io, EC2).
2. Set `ALLOWED_ORIGINS=chrome-extension://<YOUR_EXTENSION_ID>` in your
   server environment.
3. Update `server.js` to use `origin: process.env.ALLOWED_ORIGINS`.
4. Update the extension's `BASE_URL` to point to your deployed URL.
5. Add your deployed URL to the `host_permissions` in `manifest.json`.

---

## 7. Architecture Overview

```
Chrome Extension (content script)
        │  POST /api/chat  { message, context, mode, ... }
        ▼
┌─────────────────────────────────────────────────────┐
│                   Express Server                    │
│                                                     │
│  helmet ──► cors ──► morgan ──► json parser         │
│                          │                          │
│               rateLimiter (global)                  │
│                          │                          │
│           ┌──────────────┴──────────────┐           │
│           │                             │           │
│     /api/chat                /api/conversations     │
│           │                             │           │
│   validateRequest           getConversations        │
│           │                 getMessages             │
│      handleChat             deleteConversation      │
│           │                                         │
│  ┌────────▼─────────┐                              │
│  │  prompt.service  │ buildPrompt()                │
│  └────────┬─────────┘                              │
│           │                                         │
│  ┌────────▼─────────┐                              │
│  │   ai.service     │ getAIResponse()              │
│  └────────┬─────────┘                              │
│           │  OpenAI API (gpt-4o-mini)              │
│           ▼                                         │
│  Save messages to MongoDB                           │
│  Return { conversationId, response, tokensUsed }   │
└─────────────────────────────────────────────────────┘
        │
        ▼
   MongoDB (pagepal DB)
   ├── conversations
   └── messages
```

**Request lifecycle:**

1. Extension sends `POST /api/chat` with page context + user question.
2. `validateRequest` middleware enforces input rules.
3. `chat.controller` cleans context, finds/creates conversation, loads history.
4. `prompt.service` builds a mode-specific system prompt + user prompt.
5. `ai.service` calls GPT-4o-mini with the full message array.
6. Both the user message and AI response are saved to MongoDB.
7. The AI response is returned to the extension.

---

## 8. Folder Structure

```
server/
├── src/
│   ├── config/
│   │   ├── db.js              # Mongoose connection
│   │   └── ai.js              # OpenAI client singleton
│   ├── models/
│   │   ├── User.js            # User preferences schema
│   │   ├── Conversation.js    # Conversation metadata schema
│   │   └── Message.js         # Individual message schema
│   ├── routes/
│   │   ├── chat.routes.js     # POST /api/chat
│   │   └── conversation.routes.js
│   ├── controllers/
│   │   ├── chat.controller.js        # Core chat orchestration
│   │   └── conversation.controller.js
│   ├── services/
│   │   ├── ai.service.js      # OpenAI API wrapper
│   │   └── prompt.service.js  # System/user prompt builder
│   ├── middlewares/
│   │   ├── errorHandler.js    # Global error handler
│   │   ├── rateLimiter.js     # express-rate-limit config
│   │   └── validateRequest.js # Chat request validator
│   └── utils/
│       ├── contentCleaner.js  # Page text cleaning & truncation
│       └── tokenCounter.js    # Token estimation helper
├── .env.example
├── .gitignore
├── package.json
├── server.js                  # Entry point
└── README.md
```
