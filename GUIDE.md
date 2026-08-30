<div align="center">

# 🧠 PagePal AI — Complete Guide

### AI Co-pilot for Any Webpage — Summarize, Chat, Quiz, Translate

**Chrome Extension (React + Vite) + Express Proxy (Claude) + Supabase + Stripe + Landing (Vite)**

[![Production Ready](https://img.shields.io/badge/Production-Ready-00c853?style=for-the-badge)](#-production-ready-checklist)
[![Proxy](https://img.shields.io/badge/Proxy-Express_:_3001-000000?style=for-the-badge)](#-4-proxy-server)
[![Landing](https://img.shields.io/badge/Landing-Vercel-000000?style=for-the-badge)](#-5-landing-page)

</div>

---

## 📑 Table of Contents

1. [What Is PagePal AI?](#-what-is-pagepal-ai)
2. [How It Works (Architecture + Flow)](#-how-it-works)
3. [Project Structure](#-project-structure)
4. [Tech Stack](#-tech-stack)
5. [Prerequisites](#-prerequisites)
6. [Supabase Setup (Auth + DB)](#-supabase-setup)
7. [Proxy Server (Backend)](#-4-proxy-server)
8. [Chrome Extension (Frontend)](#-5-chrome-extension)
9. [Landing Page](#-5-landing-page)
10. [Environment Variables](#-environment-variables)
11. [API Reference](#-api-reference)
12. [Free vs Pro (Stripe)](#-free-vs-pro)
13. [How To Run Everything Locally](#-how-to-run-everything-locally)
14. [Production Deploy (Railway + Vercel)](#-production-deploy)
15. [CI/CD](#-cicd)
16. [Troubleshooting](#-troubleshooting)
17. [Security Notes](#-security-notes)

---

## 🧠 What Is PagePal AI?

**PagePal AI** lives as a `380×600` **Chrome popup** (`extension/manifest.json:19`). Click the 🧠 icon on *any* tab and:

| Use Case | What Happens | Where |
|---|---|---|
| 📄 **Article / Docs** | Extracts readable text (`content/content_script.js:38` + `article` selectors) → `POST /api/summarize` → 2-3 sentence summary + 5 key points + sentiment/readingTime/language | `popup/components/SummaryTab.jsx:1` |
| 📺 **YouTube** | `youtube.com/watch` → grabs title/description + timedtext (via `content/youtube_extractor.js:4` helper) → generates chapter `timestamps: [{time, label}]` | `TimelineTab.jsx:1` + `jumpToTime` |
| 💬 **Chat** | Grounded Q&A over page content (`context` = raw page text 12k chars) with `claude-sonnet-4-6` system prompt + last 10 messages | `ChatTab.jsx:30` + `proxy-server/routes/ask.js:13` |
| 🎯 **Quiz** | Pro-only: 5 MCQs JSON `{"questions":[{"q","options","answer","explanation"}]}` | `ToolsTab.jsx:72` → `/api/quiz` |
| 🌐 **Translate** | Pro-only: translates `Summary + Key Points` to 50+ langs | `ToolsTab.jsx:97` → `/api/translate` |
| 📤 **Export** | Markdown download `Title.md` + copy toast | `ToolsTab.jsx:33` |
| ✂️ **Selection** | Highlight text → context menu `PagePal AI: Explain Selection` → `chrome.storage.session.selectedText` | `background/service_worker.js:28` |

Auth is **Supabase everywhere** — same user on extension + landing + proxy. Daily limits enforced in `middleware/requireAuth.js:8` via `user_plans` table.

---

## 🏗 How It Works

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CHROME BROWSER                           │
│                                                                 │
│  content_script.js               service_worker.js              │
│  (extractPageContent)  ─message─► (detectPageType, session)     │
│         ▲                               │                       │
│         │ chrome.tabs.sendMessage       │ chrome.storage.*      │
│         │ / scripting fallback          ▼                       │
│  ┌──────────────────────────────────────────────┐               │
│  │  React Popup 380×600  popup/App.jsx:1        │               │
│  │  Header  ContextBar  TabBar  Footer          │               │
│  │  Summary | Chat | Timeline | Tools           │               │
│  └──────────────────────┬───────────────────────┘               │
└─────────────────────────┼───────────────────────────────────────┘
                          │ fetch Bearer <Supabase JWT>
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  PROXY proxy-server/index.js:1  :3001                           │
│  helmet → cors(allowlist) → express.json → rateLimit 60/min    │
│  → requireAuth (verify JWT, load/create user_plans, daily reset)│
│  → zod validate → Anthropic claude-sonnet-4-6 → Supabase       │
│  Routes: /api/health, /api/summarize, /api/chat, /api/quiz,    │
│          /api/translate, /api/billing/*, /api/webhooks/stripe  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  Supabase PostgreSQL  supabase_schema.sql:7                     │
│  auth.users ─┬─ user_plans (plan, daily_*, stripe_*, last_reset)│
│              ├─ saved_summaries (summary, key_points, timestamps)│
│              └─ chat_history (messages jsonb) + RLS             │
│  Stripe → webhook → update user_plans.plan = 'pro'/'free'      │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  Landing  landing/src/main.jsx:1  Vite + Supabase Auth          │
│  Navbar + Hero + Features + Models + HowItWorks + CTA           │
│  Shares same Supabase project → postMessage SUPABASE_AUTH_UPDATE │
│  (AuthSync.jsx) for extension sync when ?sign_in=true           │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow — Summarize

1. User opens popup → `popup/App.jsx:22` loads `supabase.auth.getSession()` + `chrome.storage.session` (`pageType/tabUrl/tabTitle`) set by `service_worker.js:16` on `tabs.onUpdated`.
2. `useEffect` debounces (400ms) → `extractPageContent()` → tries `chrome.tabs.sendMessage({action:'getPageContent'})` → fallback `chrome.scripting.executeScript` inline.
3. `POST ${VITE_PROXY_URL}/api/summarize` with `Bearer token` + `{content, pageType, title, url}`.
4. Proxy `requireAuth.js:8` verifies JWT via `supabase.auth.getUser(token)`, loads/creates `user_plans`, resets if `last_reset_date != today`.
5. `routes/summarize.js:12` checks `free daily_summaries <5` else 429 `upgrade:true`, calls `anthropic.messages.create` with system prompt expecting strict JSON, extracts `summary/keyPoints/...` via brace-slice + `JSON.parse`, then `supabase.rpc('increment_usage')` (atomic) + `saved_summaries` insert.

Chat/Quiz/Translate follow same auth + limit + Anthropic pattern.

### Auth — Why Supabase Everywhere?

Before: Landing used Clerk (`@clerk/react`) while extension used Supabase — two identities, no sync.  
Now: **Supabase only** (`extension/popup/lib/supabase.js:1` uses `chrome.storage.local` adapter for persistence, `landing/src/lib/supabase.js:1` uses normal storage). `landing/src/components/AuthSync.jsx:1` broadcasts `SUPABASE_AUTH_UPDATE` so extension can auto-close `?sign_in=true` tab. Fixes token race and plan sync.

### YouTube Note

`content/youtube_extractor.js:4` `getYouTubeTranscript` via `timedtext?v=VIDEO&lang=en&fmt=json3` is bundled (`vite.config.js:14` staticCopy) but currently **not wired** — summaries use page description fallback. Wire it by fetching from offscreen/proxy if needed.

---

## 📁 Project Structure

```
Ai_Tools/
├── extension/                 # Chrome MV3 Extension (React 18 + Vite 5)
│   ├── manifest.json          # MV3, permissions: activeTab/scripting/storage/tabs/contextMenus/identity
│   ├── vite.config.js         # popup build + staticCopy (manifest, background, content, assets)
│   ├── background/service_worker.js  # pageType detect, session+local mirror, contextMenus
│   ├── content/content_script.js     # getPageContent, getYouTubeInfo, jumpToTime
│   ├── content/youtube_extractor.js  # timedtext helper (currently unused — wire later)
│   ├── popup/
│   │   ├── index.html / main.jsx / App.jsx  # root (autoSummarize debounce, plan fetch)
│   │   ├── lib/supabase.js      # chrome.storage.local adapter
│   │   └── components/ Header, ContextBar, TabBar, SummaryTab, ChatTab, TimelineTab, ToolsTab, LoginModal, Footer
│   └── assets/icons/ 16/48/128.png
├── proxy-server/              # Express 4 + Anthropic SDK + Supabase + Stripe + zod
│   ├── index.js               # helmet, cors allowlist, rateLimit, raw webhook, health
│   ├── lib/env.js            # validation, getCorsOrigins()
│   ├── lib/supabase.js        # lazy getSupabase()/getAnthropic()
│   ├── lib/validate.js        # zod schemas (summarize/chat/quiz/translate)
│   ├── middleware/requireAuth.js
│   └── routes/ summarize.js, ask.js (chat+quiz), translate.js, billing.js (checkout/portal/webhook)
├── landing/                   # Vite + React + Supabase Auth + framer-motion
│   ├── src/main.jsx / App.jsx / lib/supabase.js
│   └── src/components/ Navbar, AuthSync, Hero, Features, Models, ...
├── supabase_schema.sql        # chat_history, saved_summaries, user_plans, RLS, increment_usage() RPC
├── .github/workflows/ci.yml   # landing build + proxy check + extension build
├── DEPLOYMENT.md              # Railway + Vercel steps
└── GUIDE.md                   # ← you are here
```

---

## 🛠 Tech Stack

- **Extension UI:** React 18, Vite 5, Tailwind 3.4, `supabase-js` custom storage
- **AI:** Anthropic Claude `claude-sonnet-4-6` (max_tokens 1000-2000, temp default)
- **Auth/DB:** Supabase Auth (Google OAuth + email/password), PostgreSQL + RLS
- **Payments:** Stripe Checkout + Billing Portal + webhook `checkout.session.completed`
- **Proxy:** Node 20, Express 4, `helmet`, `cors`, `express-rate-limit`, `zod`, `dotenv`
- **Landing:** Vite 5, React 18, `framer-motion`, `lucide-react`, Supabase
- **CI:** GitHub Actions Node 20

---

## ✅ Prerequisites

```bash
node --version  # >=20
npm --version   # >=9
# Chrome >=114 for MV3 + session storage
# Supabase project, Anthropic key, Stripe (optional for Pro)
```

---

## 🔑 Supabase Setup

1. https://supabase.com → New Project → copy **Project URL**, **anon key**, **service_role** (Settings → API).
2. SQL Editor → paste `supabase_schema.sql` → Run. Creates `user_plans` (with `stripe_*`, `increment_usage()`), `saved_summaries`, `chat_history`, RLS, indexes.
3. Auth → Providers → Enable **Google** → set authorized redirects: `https://<vercel-landing>/`, `http://localhost:5173/`, `chrome-extension://<id>/` (find id at `chrome://extensions`).
4. Auth → URL Configuration → Site URL = `https://<vercel-landing>` or `http://localhost:5173` for dev.

---

## 🚀 4. Proxy Server

### Env

Copy `proxy-server/.env.example` → `proxy-server/.env`:

```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=eyJ...service_role...
ANTHROPIC_API_KEY=sk-ant-...
# Stripe (optional until Pro)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,https://your-landing.vercel.app
MAX_REQUESTS_PER_MINUTE=60
```

In **dev** missing keys only warn (`lib/env.js:8`), in **production** they `process.exit(1)`.

### Run

```bash
cd proxy-server
npm install
npm run dev     # --watch, :3001
# or
npm start
curl http://localhost:3001/api/health
# {"status":"ok","service":"PagePal AI Proxy","env":"development"...}
```

Logs: `GET /api/health → 200 (3ms)` etc.

---

## 🧩 5. Chrome Extension

### Env

Copy `extension/.env.example` → `extension/.env`:

```env
VITE_PROXY_URL=http://localhost:3001
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...anon...
```

### Build & Load

```bash
cd extension
npm install
npm run build    # → dist/
```

1. `chrome://extensions` → **Developer mode** on → **Load unpacked** → select `extension/dist`
2. Pin 🧠 icon. Open any `https://` page (not `chrome://`) → click icon → Sign In → Summarize.

**Dev reload:** edit → `npm run build` → `chrome://extensions` ↻ PagePal.

**Debug:**
- Popup: right-click popup → Inspect
- Content: page F12 → Console filter `[PagePal]`
- Service worker: `chrome://extensions` → `Service Worker` link

### Permissions Why

`manifest.json:6` `activeTab` (inject only when needed) + `scripting` (fallback executeScript) + `storage` (session/local) + `tabs` (query active) + `contextMenus` + `identity` (Google OAuth redirect). `host_permissions: https://*/*` needed for fetch to proxy + YouTube timedtext.

---

## 🌐 5. Landing Page

### Env

Copy `landing/.env.example` → `landing/.env`:

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...anon...
VITE_PROXY_URL=http://localhost:3001
```

### Run

```bash
cd landing
npm install
npm run dev    # http://localhost:5173
npm run build  # → dist/ (deploy to Vercel: build cmd vite build, output dist)
```

Landing shares Supabase project → same login as extension. `AuthSync.jsx` will auto-close `?sign_in=true` tab from extension.

---

## 🔐 Environment Variables

| Var | Where | Required | Note |
|---|---|---|---|
| `SUPABASE_URL` | both `.env` | ✅ | `https://<id>.supabase.co` |
| `SUPABASE_ANON_KEY` | extension+landing | ✅ | publishable |
| `SUPABASE_SERVICE_KEY` | proxy | ✅ | service_role, never expose to client |
| `ANTHROPIC_API_KEY` | proxy | ✅ | `sk-ant-...` |
| `PORT` | proxy | — | default 3001 |
| `FRONTEND_URL` | proxy | prod | for Stripe success/cancel + CORS |
| `ALLOWED_ORIGINS` | proxy | prod | comma-separated Vercel URL(s) |
| `STRIPE_SECRET_KEY` | proxy | Pro | `sk_test/live` |
| `STRIPE_WEBHOOK_SECRET` | proxy | Pro | `whsec_...` |
| `STRIPE_PRO_PRICE_ID` | proxy | Pro | `price_...` $9/mo |
| `VITE_PROXY_URL` | extension/landing | ✅ | `http://localhost:3001` dev or `https://<railway>` prod |
| `MAX_REQUESTS_PER_MINUTE` | proxy | — | default 60 |

---

## 📡 API Reference

All `POST` need `Authorization: Bearer <supabase JWT>` except `/api/health` and `POST /api/webhooks/stripe` (raw + `stripe-signature`).

| Method | Path | Body | Auth | Limit |
|---|---|---|---|---|
| GET | `/api/health` | — | no | — |
| POST | `/api/summarize` | `{content, pageType, title, url?}` | yes | free 5/day, pro ∞ |
| POST | `/api/chat` | `{messages:[{role,content}], context?, pageType?, title?}` | yes | free 10/day |
| POST | `/api/quiz` | `{content, title?}` | yes | **pro only 403** |
| POST | `/api/translate` | `{text, targetLanguage}` | yes | **pro only 403** |
| POST | `/api/billing/create-checkout` | — | yes | creates Stripe session → `{url}` |
| POST | `/api/billing/create-portal` | — | yes | portal → `{url}` |
| GET | `/api/billing/status` | — | yes | `{plan, daily_summaries, daily_chats}` |
| POST | `/api/webhooks/stripe` | raw JSON | stripe sig | flips `user_plans.plan` |

Validation via `zod` → `400 {error, details}`; free limit → `429 {upgrade:true}`; AI JSON parse fail → `502`.

---

## 💳 Free vs Pro

| Feature | Free | Pro $9/mo (Stripe) |
|---|---|---|
| Summaries/day | 5 | ∞ |
| Chat/day | 10 | ∞ |
| Translate 50+ langs | ❌ | ✅ |
| Quiz 5 MCQs | ❌ | ✅ |
| Export | Markdown | same (PDF/Notion stub) |
| Chat history | 7d (future) | forever (future) |
| Stripe | — | Checkout + Portal + webhook |

Header shows `Free Plan → Upgrade $9/mo` or `Pro ✓` + `daily_summaries/5` etc. `ToolsTab` Pro tools show upgrade CTA.

---

## ▶️ How To Run Everything Locally

**Terminal 1 — Proxy**
```bash
cd proxy-server
cp .env.example .env  # fill keys
npm install
npm run dev
# open http://localhost:3001/api/health
```

**Terminal 2 — Landing (optional)**
```bash
cd landing
cp .env.example .env
npm install
npm run dev  # http://localhost:5173
```

**Chrome — Extension**
```bash
cd extension
cp .env.example .env
npm install
npm run build
# chrome://extensions → Load unpacked → extension/dist
```

**End-to-end test:**
1. Open `https://en.wikipedia.org/wiki/Artificial_intelligence` → click 🧠 → Sign In → should auto-summarize (SummaryTab skeleton → summary + 5 points + sentiment).
2. Chat: type `What are main arguments?` → reply grounded in page.
3. YouTube: open `youtube.com/watch?v=...` → Timeline tab shows timestamps (currently from description; wire transcript for full).
4. Tools → Export → downloads `Title.md`, Quiz/Translate → if Free shows Upgrade CTA.

---

## 🚀 Production Deploy

See `DEPLOYMENT.md` for Railway (proxy) + Vercel (landing). Summary:

- **Railway** root `proxy-server`, Node 20, set all envs with `NODE_ENV=production`, `FRONTEND_URL=https://<vercel>`. Health `GET /api/health`.
- **Vercel** root `landing`, build `npm run build`, output `dist`, envs `VITE_SUPABASE_*`, `VITE_PROXY_URL=https://<railway>`.
- **Extension** update `VITE_PROXY_URL` to Railway → `npm run build` → zip `dist` → Chrome Web Store. Add `ALLOWED_ORIGINS` with Vercel URL + `chrome-extension://` auto-allowed.

---

## 🔁 CI/CD

`.github/workflows/ci.yml` on `main/master`:
- `build-landing` → `landing/npm ci && npm run build`
- `check-proxy` → `proxy-server/npm ci && node --check index.js`
- `build-extension` → `extension/npm ci && npm run build && cat dist/manifest.json`

Fix `/server` → `/proxy-server` bug previously breaking CI.

---

## 🐛 Troubleshooting

| Symptom | Fix |
|---|---|
| `ANTHROPIC_API_KEY not configured` warn on start | Fill `proxy-server/.env`, restart |
| `Supabase not configured` 500 on summarize | Check `SUPABASE_URL`/`SERVICE_KEY` not placeholder |
| `No authentication token` 401 | Sign In on popup, `supabase.auth.getSession()` must have token |
| `Daily summary limit reached` 429 | Wait next UTC day (`last_reset_date`) or upgrade to Pro via Header → Stripe |
| `Content script did not respond` | Reload extension, try `https://` page (not `chrome://`), check `chrome://extensions` Errors |
| `Failed to fetch` in popup | Proxy not running or `VITE_PROXY_URL` mismatch/CORS blocked — check `ALLOWED_ORIGINS` in prod |
| `Migration` RLS `new row violates` | Ensure `supabase_schema.sql` run; `user_plans` insert happens in `requireAuth.js:34` with `service_role` bypassing RLS |
| Landing `Missing Supabase env` warn | Fill `landing/.env` |
| `STIRPE_SECRET_KEY not set — billing disabled` | Pro checkout returns 500 until Stripe env set — expected in dev |

---

## 🔒 Security Notes

- Never commit `.env` (ignored). Placeholders (`your-`, `placeholder`) allowed in dev but **exit 1 in prod** `lib/env.js:6`.
- `service_role` only on server (`proxy-server/lib/supabase.js:7` lazy). Client uses `anon` with RLS `supabase_schema.sql:45`.
- `helmet` + `express-rate-limit` + strict CORS (`chrome-extension://` + `FRONTEND_URL`) in prod `index.js:11`.
- Stripe webhook uses `express.raw` + `stripe.webhooks.constructEvent` signature check `routes/billing.js:54`.
- No `err.message` leak in prod — `500 {error: 'Internal...'}` only `index.js:52`.

---

<div align="center">

Production checklist in `DEPLOYMENT.md` • Legacy `CLERK_UI_GUIDE.md` deprecated (now Supabase) • MIT

</div>
