<div align="center">

# 🧠 PagePal AI

### AI Co-pilot for Any Webpage

**A Chrome Extension that acts as an AI co-pilot for any browser tab — summarize, chat, translate, quiz, and more using Claude AI.**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](./extension)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](./extension)
[![Anthropic](https://img.shields.io/badge/Claude-AI-D4A574?style=for-the-badge&logo=anthropic&logoColor=white)](./proxy-server)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](./proxy-server)
[![License](https://img.shields.io/badge/License-MIT-6c63ff?style=for-the-badge)](./LICENSE)

</div>

---

## 📸 What It Does

PagePal AI lives as a **popup** inside Chrome. Open any page, click the icon, and instantly:

| Use Case | What Happens |
|----------|-------------|
| 📄 **Reading an article** | Summarizes with key points, sentiment, and reading time |
| 📺 **Watching YouTube** | Extracts transcript, generates chapter timestamps |
| 📋 **Any webpage** | AI-powered Q&A chat about the page content |
| 🎯 **Quiz mode** | Auto-generates MCQs to test your understanding |
| 🌐 **Translation** | Translate summaries to 50+ languages |
| 📤 **Export** | Save notes as Markdown |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     CHROME BROWSER                            │
│                                                                │
│  ┌─────────────────┐    messages    ┌──────────────────────┐  │
│  │  content_script  │◄──────────────►│   service_worker     │  │
│  │  (DOM extractor) │                │   (page detection)   │  │
│  └─────────────────┘                └──────────────────────┘  │
│                                                                │
│                        ┌────────────────────┐                 │
│                        │   React Popup UI    │                 │
│                        │   (380x600 popup)   │                 │
│                        └────────┬───────────┘                 │
└─────────────────────────────────│─────────────────────────────┘
                                  │ POST /api/*
                                  ▼
┌──────────────────────────────────────────────────────────────┐
│                  PROXY SERVER  :3001                           │
│                                                                │
│   cors → express.json → requireAuth middleware                 │
│                    │                                           │
│         ┌──────────▼───────────┐                              │
│         │   Anthropic Claude   │                              │
│         │  (claude-sonnet-4-6) │                              │
│         └──────────────────────┘                              │
│                    │                                           │
│            Supabase PostgreSQL                                │
│     (auth, chat history, summaries, plans)                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Ai_Tools/
│
├── 📂 extension/                  # Chrome Extension (React + Vite)
│   ├── manifest.json              # Manifest V3 config
│   ├── package.json               # Extension dependencies
│   ├── vite.config.js             # Vite build config
│   ├── tailwind.config.js         # Tailwind CSS config
│   ├── background/
│   │   └── service_worker.js      # Page detection, context menus
│   ├── content/
│   │   ├── content_script.js      # DOM text extraction
│   │   └── youtube_extractor.js   # YouTube transcript API
│   ├── popup/
│   │   ├── index.html             # Popup shell
│   │   ├── main.jsx               # React entry point
│   │   ├── App.jsx                # Root component
│   │   ├── lib/supabase.js        # Supabase client
│   │   ├── styles/globals.css     # Tailwind + custom styles
│   │   └── components/
│   │       ├── Header.jsx         # Logo, theme toggle, auth
│   │       ├── ContextBar.jsx     # Page type detection badge
│   │       ├── TabBar.jsx         # Summary/Chat/Timeline/Tools
│   │       ├── SummaryTab.jsx     # AI summary + key points
│   │       ├── ChatTab.jsx        # Q&A chat interface
│   │       ├── TimelineTab.jsx    # YouTube chapter timestamps
│   │       ├── ToolsTab.jsx       # Export, translate, quiz
│   │       ├── LoginModal.jsx     # Auth modal (Google + email)
│   │       └── Footer.jsx         # Quick actions, branding
│   └── assets/icons/              # Extension icons (16/48/128)
│
├── 📂 proxy-server/               # Express API Server
│   ├── index.js                   # Server entry point
│   ├── package.json               # Server dependencies
│   ├── middleware/
│   │   └── requireAuth.js         # Supabase auth + plan limits
│   └── routes/
│       ├── summarize.js           # POST /api/summarize
│       ├── ask.js                 # POST /api/chat, /api/quiz
│       └── auth.js                # POST /api/translate
│
├── 📂 landing/                    # Marketing Landing Page (React)
│
├── supabase_schema.sql            # Database schema for Supabase
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### 1. Proxy Server

```bash
cd proxy-server
npm install
# Edit .env with your API keys
npm run dev
# ✅ Server running at http://localhost:3001
```

### 2. Chrome Extension

```bash
cd extension
npm install
npm run build
```

Then load in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select the `extension/dist` folder
5. Click the 🧠 icon in your toolbar

### 3. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase_schema.sql` in the SQL Editor
3. Enable Google OAuth in Auth → Providers
4. Copy your URL + keys to `.env` files

---

## 🔑 Required API Keys

| Key | Where | Get It |
|-----|-------|--------|
| `ANTHROPIC_API_KEY` | proxy-server/.env | [console.anthropic.com](https://console.anthropic.com/) |
| `SUPABASE_URL` | Both .env files | [supabase.com](https://supabase.com) |
| `SUPABASE_ANON_KEY` | extension/.env | Supabase → Settings → API |
| `SUPABASE_SERVICE_KEY` | proxy-server/.env | Supabase → Settings → API |

---

## 💳 Free vs Pro Plan

| Feature | Free | Pro ($9/mo) |
|---------|------|-------------|
| Summaries/day | 5 | Unlimited |
| Chat messages/day | 10 | Unlimited |
| Export formats | Markdown | PDF + Notion + Google Docs |
| Translation | ❌ | ✅ 50+ languages |
| Quiz generator | ❌ | ✅ |
| Mind map | ❌ | ✅ |
| Chat history | 7 days | Forever |

---

## 🛠 Tech Stack

- **Extension UI**: React 18 + Vite 5 + Tailwind CSS 3.4
- **AI**: Anthropic Claude (claude-sonnet-4-6) via proxy
- **Auth**: Supabase (Google OAuth + Email/Password)
- **Database**: Supabase PostgreSQL
- **Payments**: Stripe (Free / Pro)
- **Proxy**: Node.js + Express

---

## 📄 License

MIT — free to use, fork, and build on.

---

<div align="center">
Built with ♥ using React, Anthropic Claude, and Supabase.
</div>
