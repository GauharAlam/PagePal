<div align="center">

# 🧠 PagePal AI

### Summarize Anything. Instantly.

**An AI-powered Chrome Extension that reads any webpage, YouTube video, or selected text and explains it in simple language — using the smartest AI model for each job.**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](./extension)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](./server)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](./landing)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](./server)
[![License](https://img.shields.io/badge/License-MIT-6c63ff?style=for-the-badge)](./LICENSE)

[🚀 Quick Start](#-quick-start) · [📖 Full Setup Guide](./SETUP.md) · [🏗 Architecture](#-architecture) · [📁 Project Structure](#-project-structure)

</div>

---

## 📸 What It Does

PagePal lives as a **right-side panel** inside Chrome. Open any page, click the icon, and instantly:

| Use Case | What Happens |
|----------|-------------|
| 📄 **Reading an article** | Summarizes in bullet points, explains key ideas |
| 🎬 **Watching YouTube** | Understands the video topic from the page content |
| 💻 **Looking at code** | Explains what the code does, step by step |
| ✂️ **Highlighting text** | Explains exactly the selected passage |
| 💬 **Follow-up questions** | Maintains conversation memory across turns |

**Smart Model Routing** — PagePal doesn't use one AI. It automatically picks the best one:

| Model | Best For |
|-------|---------|
| ✦ **Gemini 1.5 Flash** | Long articles, YouTube, large documents |
| 🔍 **DeepSeek Chat** | Code, technical content, fast summaries |
| ⚡ **GPT-4o-mini** | Standard articles, blogs, general Q&A |
| 𝕏 **Grok** | Trending topics, news, social content |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                  │
│  ┌─────────────────┐    messages    ┌──────────────────────┐    │
│  │  content.js     │◄──────────────►│   background.js      │    │
│  │  (DOM scraper)  │                │   (service worker)   │    │
│  └─────────────────┘                └──────────┬───────────┘    │
│                                               │                 │
│                                     ┌─────────▼──────────┐     │
│                                     │    sidebar.html     │     │
│                                     │    (side panel UI)  │     │
│                                     └─────────┬──────────┘     │
└───────────────────────────────────────────────│─────────────────┘
                                                │ POST /api/chat
                                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND  :5000                       │
│                                                                  │
│   helmet → cors → morgan → rateLimit → validateRequest           │
│                          │                                       │
│                   chat.controller                                │
│                    │          │                                  │
│             prompt.service   contentCleaner                      │
│                    │                                             │
│            ┌───────▼──────────────────────────────┐             │
│            │        AI ROUTER SERVICE             │             │
│            │  analyzes: length, type, mode        │             │
│            │       ↓           ↓                  │             │
│            │  Gemini   DeepSeek   OpenAI   Grok   │             │
│            └───────────────────┬──────────────────┘             │
│                                │                                 │
│                         MongoDB (save messages)                  │
└──────────────────────────────────────────────────────────────────┘
                                                │
                                    ┌───────────▼──────────┐
                                    │   Landing Page :5173  │
                                    │   React + Vite        │
                                    └──────────────────────┘
```

---

## 📁 Project Structure

```
Ai_Tools/
│
├── 📂 extension/               # Chrome Extension (Manifest V3)
│   ├── manifest.json           # Extension config, permissions
│   ├── background.js           # Service worker, message routing
│   ├── content.js              # DOM scraper, text extractor
│   ├── sidebar.html            # Side panel UI
│   ├── sidebar.css             # All styles (dark/light theme)
│   ├── sidebar.js              # Full UI logic, API calls
│   └── icons/                  # Extension icons (16/32/48/128px)
│
├── 📂 server/                  # MERN Backend (Node.js + Express)
│   ├── server.js               # Entry point
│   └── src/
│       ├── config/             # DB + AI client setup
│       ├── models/             # MongoDB schemas
│       ├── routes/             # API route definitions
│       ├── controllers/        # Request handlers
│       ├── services/
│       │   ├── router.service.js     # 🧠 AI model selector
│       │   ├── ai.service.js         # Dispatcher to models
│       │   ├── prompt.service.js     # Prompt builder
│       │   └── models/         # Individual model wrappers
│       │       ├── openai.model.js
│       │       ├── gemini.model.js
│       │       ├── deepseek.model.js
│       │       └── grok.model.js
│       ├── middlewares/        # Rate limiting, validation, errors
│       └── utils/              # Content cleaner, token counter
│
├── 📂 landing/                 # Marketing Landing Page
│   ├── src/
│   │   ├── components/         # 8 page sections as components
│   │   ├── utils/constants.js  # All static data
│   │   └── App.jsx             # Root component
│   ├── index.html
│   └── vite.config.js
│
├── README.md                   # ← You are here
└── SETUP.md                    # Full step-by-step setup guide
```

---

## 🚀 Quick Start

> **Need the full guide?** See [SETUP.md](./SETUP.md) for detailed instructions with troubleshooting.

### 1. Backend (2 minutes)

```bash
cd Ai_Tools/server
npm install
cp .env.example .env
# Edit .env → add your OPENAI_API_KEY and MONGODB_URI
npm run dev
# ✅ Server running at http://localhost:5000
```

### 2. Chrome Extension (1 minute)

```
1. Open chrome://extensions
2. Enable Developer mode (top-right toggle)
3. Click "Load unpacked"
4. Select the Ai_Tools/extension/ folder
5. Click the 🧠 icon in your Chrome toolbar
```

### 3. Landing Page (optional)

```bash
cd Ai_Tools/landing
npm install
npm run dev
# ✅ Landing page at http://localhost:5173
```

---

## 🔑 Required API Keys

| Key | Required | Get It |
|-----|----------|--------|
| `OPENAI_API_KEY` | ✅ Yes (default model) | [platform.openai.com](https://platform.openai.com/api-keys) |
| `GEMINI_API_KEY` | ⚡ Recommended | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `DEEPSEEK_API_KEY` | Optional | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| `GROK_API_KEY` | Optional | [console.x.ai](https://console.x.ai/) |

> **Only `OPENAI_API_KEY` is required.** Missing models fall back to OpenAI automatically.

---

## 🛠 Tech Stack

### Chrome Extension
- **Manifest V3** — latest Chrome extension standard
- **Vanilla JS** — no framework needed for a sidebar
- **Chrome Side Panel API** — native browser panel (not injected)

### Backend
- **Node.js 18+** + **Express 4** — REST API
- **MongoDB** + **Mongoose** — conversation storage
- **OpenAI SDK** — used for OpenAI, DeepSeek, and Grok (all OpenAI-compatible)
- **@google/generative-ai** — Gemini SDK
- **express-rate-limit** — abuse protection
- **helmet** + **morgan** — security & logging

### Landing Page
- **React 18** + **Vite 5** — fast dev builds
- **Tailwind CSS 3** — utility-first styling
- **Framer Motion 11** — scroll animations
- **lucide-react** — icons

---

## 🔐 Security Notes

- API keys live **only** in `server/.env` — never in the extension frontend
- Extension sends content to **your own backend**, not directly to AI APIs
- Rate limiting: 30 requests/minute per IP by default
- Content truncated to **6,000 characters** before sending to AI
- Input validation on all routes

---

## 📡 API Reference

### `POST /api/chat`

```json
{
  "message":        "What is this article about?",
  "context":        "...extracted page text...",
  "conversationId": "uuid (optional — omit to start new)",
  "mode":           "explain | summarize | keypoints | beginner | code | selection",
  "pageUrl":        "https://example.com",
  "pageTitle":      "Article Title",
  "isYouTube":      false,
  "userPreference": "best_quality | fast | cheap | null"
}
```

**Response:**

```json
{
  "success":        true,
  "conversationId": "550e8400-...",
  "response":       "Here are the key points...",
  "tokensUsed":     312,
  "model":          "gemini",
  "reason":         "Large content detected",
  "confidence":     "high"
}
```

### `GET /api/health`

```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

---

## 🗺 Roadmap

- [x] Webpage summarization
- [x] Selected text explanation
- [x] Multi-AI model routing (Gemini, DeepSeek, OpenAI, Grok)
- [x] Conversation memory (6-message window)
- [x] Dark / light mode
- [x] Model badge in chat UI
- [ ] YouTube transcript extraction
- [ ] PDF support
- [ ] Voice input / output
- [ ] Chrome Web Store publish
- [ ] User accounts + history panel
- [ ] Custom mode settings

---

## 📄 License

MIT — free to use, fork, and build on.

---

<div align="center">
Built with ♥ using React, Node.js, MongoDB, and the OpenAI / Gemini / DeepSeek / Grok APIs.
</div>
