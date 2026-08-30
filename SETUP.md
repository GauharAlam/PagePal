# 🛠 PagePal AI — Complete Setup Guide

This guide walks you through setting up all three parts of the PagePal AI project from scratch:

| Part | What it is | Time |
|------|-----------|------|
| **1. Backend** | Node.js + Express API server | ~5 min |
| **2. Chrome Extension** | The actual browser tool | ~2 min |
| **3. Landing Page** | React marketing site (optional) | ~2 min |

---

## 📋 Table of Contents

1. [Prerequisites](#-step-0-prerequisites)
2. [Get Your API Keys](#-step-1-get-your-api-keys)
3. [Setup the Backend](#-step-2-setup-the-backend)
4. [Setup MongoDB](#-step-3-setup-mongodb)
5. [Configure Environment Variables](#-step-4-configure-environment-variables)
6. [Run the Backend](#-step-5-run-the-backend)
7. [Load the Chrome Extension](#-step-6-load-the-chrome-extension)
8. [Test Everything Together](#-step-7-test-everything-together)
9. [Setup the Landing Page](#-step-8-setup-the-landing-page-optional)
10. [Troubleshooting](#-troubleshooting)
11. [Environment Variables Reference](#-environment-variables-reference)

---

## ✅ Step 0: Prerequisites

Make sure you have these installed before starting.

### Check what you have

Open your terminal and run:

```bash
node --version     # Need 18.0.0 or higher
npm --version      # Need 9.0.0 or higher
git --version      # Any version is fine
```

### Install what's missing

**Node.js 18+**
- Go to [nodejs.org](https://nodejs.org) and download the **LTS** version
- Or use a version manager:
  ```bash
  # macOS / Linux — using nvm
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  nvm install 18
  nvm use 18

  # Windows — use nvm-windows
  # Download from: https://github.com/coreybutler/nvm-windows/releases
  ```

**MongoDB** (choose one option below)

| Option | Best For | Cost |
|--------|---------|------|
| MongoDB Atlas (cloud) | Easiest, no install needed | Free tier available |
| Local MongoDB | Offline development | Free |

---

## 🔑 Step 1: Get Your API Keys

You need at least **OpenAI**. The others are optional but recommended.

---

### 1A. OpenAI API Key (Required)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Click your profile → **API Keys**
4. Click **"Create new secret key"**
5. Give it a name like `pagepal-dev`
6. **Copy the key immediately** — you can't see it again

```
sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> 💡 **Cost note:** GPT-4o-mini is very cheap (~$0.00015 per 1K tokens). A typical summary costs less than $0.001.

---

### 1B. Google Gemini API Key (Recommended)

Used for long articles and YouTube content — **free tier is generous**.

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select or create a Google Cloud project
5. Copy the key

```
AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

> 💡 **Gemini 1.5 Flash** has a free tier of 15 requests/minute, which is plenty for personal use.

---

### 1C. DeepSeek API Key (Optional)

Used for code explanation. **Very cheap** — often 10x cheaper than OpenAI.

1. Go to [platform.deepseek.com](https://platform.deepseek.com)
2. Sign up and verify your email
3. Go to **API Keys** in the dashboard
4. Click **"Create API Key"**
5. Copy the key

```
sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 1D. Grok API Key (Optional)

Used for news and trending content.

1. Go to [console.x.ai](https://console.x.ai/)
2. Sign in with your X (Twitter) account
3. Navigate to **API Keys**
4. Create a new key
5. Copy the key

```
xai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> ⚠️ **If you skip DeepSeek and Grok**, no worries. The backend automatically falls back to OpenAI for those content types.

---

## 🖥 Step 2: Setup the Backend

### 2A. Navigate to the server folder

```bash
cd Ai_Tools/server
```

### 2B. Install all dependencies

```bash
npm install
```

You should see output like:
```
added 187 packages in 12s
```

### 2C. Verify the install worked

```bash
node --check server.js
```

No output = no errors. ✅

---

## 🍃 Step 3: Setup MongoDB

Choose **one** of these options:

---

### Option A: MongoDB Atlas (Cloud — Recommended for Beginners)

This is the easiest option. No local install required.

**Step 1:** Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free account.

**Step 2:** Create a free cluster
- Click **"Build a Database"**
- Choose **"M0 Free"** tier
- Choose a cloud provider (any works — AWS is fine)
- Choose a region close to you
- Name your cluster (e.g. `pagepal-cluster`)
- Click **"Create"**

**Step 3:** Create a database user
- In Security → **Database Access**
- Click **"Add New Database User"**
- Choose **"Password"** authentication
- Username: `pagepal`
- Password: something secure (save this!)
- Role: **"Read and write to any database"**
- Click **"Add User"**

**Step 4:** Allow your IP address
- In Security → **Network Access**
- Click **"Add IP Address"**
- Click **"Allow Access from Anywhere"** (for development — restrict later for production)
- Click **"Confirm"**

**Step 5:** Get your connection string
- Go to **Databases** → Click **"Connect"** on your cluster
- Choose **"Connect your application"**
- Driver: **Node.js**, Version: **5.5 or later**
- Copy the connection string, it looks like:

```
mongodb+srv://pagepal:<password>@pagepal-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

- Replace `<password>` with the password you created in Step 3

Your `MONGODB_URI` will be:
```
mongodb+srv://pagepal:YourPassword123@pagepal-cluster.xxxxx.mongodb.net/pagepal?retryWrites=true&w=majority
```

---

### Option B: Local MongoDB

**macOS (using Homebrew):**
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify it's running
mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

Your connection string will be:
```
mongodb://localhost:27017/pagepal
```

**Windows:**
1. Download the MongoDB Community Server installer from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Run the installer (choose "Complete" setup)
3. MongoDB will run as a Windows service automatically
4. Your connection string: `mongodb://localhost:27017/pagepal`

**Ubuntu/Linux:**
```bash
# Import the public key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add the repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start the service
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## ⚙️ Step 4: Configure Environment Variables

### 4A. Create your `.env` file

```bash
# Make sure you're in the server folder
cd Ai_Tools/server

# Copy the example file
cp .env.example .env
```

### 4B. Open the `.env` file and fill in your values

Open `Ai_Tools/server/.env` in any text editor:

```env
# ── Server ────────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── Database ──────────────────────────────────────────────
# Atlas example:
MONGODB_URI=mongodb+srv://pagepal:YourPassword@cluster.xxxxx.mongodb.net/pagepal?retryWrites=true&w=majority

# Local example:
# MONGODB_URI=mongodb://localhost:27017/pagepal

# ── AI Model API Keys ─────────────────────────────────────
# Required — used as default and fallback
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Recommended — for long content and YouTube
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Optional — for code content (falls back to OpenAI if missing)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional — for news/trending content (falls back to OpenAI if missing)
GROK_API_KEY=xai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ── Rate Limiting ─────────────────────────────────────────
MAX_REQUESTS_PER_MINUTE=30

# ── CORS (for production only) ────────────────────────────
# Leave this blank for development — the extension ID changes
# In production: ALLOWED_ORIGINS=chrome-extension://your_extension_id
ALLOWED_ORIGINS=
```

> 🔒 **Important:** The `.env` file is already in `.gitignore`. Never commit it to Git.

---

## ▶️ Step 5: Run the Backend

```bash
# Make sure you're in the server folder
cd Ai_Tools/server

# Start in development mode (auto-restarts on file changes)
npm run dev
```

You should see:

```
[nodemon] starting `node server.js`

✅ MongoDB connected: cluster0.xxxxx.mongodb.net
                    (or: localhost)

🚀 PagePal server running on http://localhost:5000
   Environment : development
   Health check: http://localhost:5000/api/health
```

### Verify the backend is working

Open a new terminal tab and run:

```bash
curl http://localhost:5000/api/health
```

You should get:
```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

Or open [http://localhost:5000/api/health](http://localhost:5000/api/health) in your browser.

### Test the chat endpoint

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is this about?",
    "context": "Node.js is a JavaScript runtime built on Chrome V8 engine.",
    "mode": "explain"
  }'
```

Expected response:
```json
{
  "success": true,
  "conversationId": "some-uuid-here",
  "response": "This is about Node.js, which is...",
  "tokensUsed": 45,
  "model": "openai",
  "reason": "Standard article or Q&A",
  "confidence": "high"
}
```

✅ Backend is working!

---

## 🔌 Step 6: Load the Chrome Extension

### 6A. Open Chrome Extensions page

In Chrome, navigate to:
```
chrome://extensions
```

Or: Chrome menu (⋮) → More Tools → Extensions

### 6B. Enable Developer Mode

In the top-right corner of the Extensions page, toggle on **"Developer mode"**.

You'll see three new buttons appear: `Load unpacked`, `Pack extension`, `Update`.

### 6C. Build & Load the extension

1. Ensure the extension is built by running:
   ```bash
   cd extension
   npm run build
   ```
2. In Chrome, click **"Load unpacked"**
3. A file picker will open
4. Navigate to your project folder and select the **`extension/dist`** folder (the built output containing `manifest.json`)
5. Click **"Select Folder"** (Windows) or **"Open"** (macOS)

### 6D. Confirm it loaded

You should see **"PagePal AI"** appear in your extensions list with:
- A 🧠 icon
- Version: 1.0.0
- No error messages

### 6E. Pin the extension to toolbar

1. Click the puzzle piece icon 🧩 in Chrome's toolbar
2. Find **"PagePal AI"** in the list
3. Click the pin icon 📌 next to it

The 🧠 icon will now always be visible in your toolbar.

### 6F. Test the extension

1. Open any webpage (try a Wikipedia article or a news article)
2. Click the **🧠 PagePal AI** icon in your toolbar
3. A side panel should open on the right
4. Click **"✨ Explain Page"**
5. You should see a loading animation, then an AI response

> ⚠️ **If nothing happens**, make sure:
> - Your backend is running (`npm run dev` is active)
> - You're on a regular `https://` page (not `chrome://` pages)
> - Check the browser console for errors (right-click panel → Inspect)

---

## 🧪 Step 7: Test Everything Together

Here's a quick end-to-end test:

### Test 1: Basic Page Summary
1. Open [https://en.wikipedia.org/wiki/Artificial_intelligence](https://en.wikipedia.org/wiki/Artificial_intelligence)
2. Open PagePal sidebar
3. Click **"📋 Summarize"**
4. ✅ Should get a bullet-point summary

### Test 2: Selected Text
1. Highlight any paragraph on a webpage
2. Open PagePal sidebar
3. Click **"✂️ Explain Selection"**
4. ✅ Should explain just that paragraph

### Test 3: Code Page
1. Open any GitHub repository page (e.g. a `.js` file)
2. Open PagePal sidebar
3. Click **"💻 Explain Code"**
4. ✅ Should route to DeepSeek (if key set) and explain the code

### Test 4: Custom Question
1. Open any webpage
2. Type in the input box: `"What are the main arguments in this article?"`
3. Press Enter or click Send
4. ✅ Should get a direct answer

### Check the model badge
After each response, you should see a small badge like:
```
● ✦ Gemini 1.5  ·  Large content detected
```
This confirms the AI Router is working.

---

## 🌐 Step 8: Setup the Landing Page (Optional)

The landing page is a separate React app. It's just a marketing page — the extension works without it.

```bash
# Navigate to the landing folder
cd Ai_Tools/landing

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
cd Ai_Tools/landing
npm run build
```

Output goes to `landing/dist/`. You can deploy this to:
- **Vercel**: `npx vercel` (easiest)
- **Netlify**: drag and drop the `dist` folder
- **GitHub Pages**: push `dist` to a `gh-pages` branch

---

## 🔧 Development Workflow

Once setup, here's your daily workflow:

### Start everything

**Terminal 1 — Backend:**
```bash
cd Ai_Tools/server
npm run dev
```

**Terminal 2 — Landing (optional):**
```bash
cd Ai_Tools/landing
npm run dev
```

**Browser — Extension:**
- Already loaded. Reloads automatically when you edit extension files
- Or go to `chrome://extensions` and click the **↻** reload button on PagePal AI

### After editing extension files

Go to `chrome://extensions` → Find PagePal AI → Click **↻** (reload icon)

Then refresh the webpage you're testing on.

### Debugging

**Debug the sidebar (sidebar.js):**
- Right-click inside the PagePal side panel → **Inspect**
- This opens DevTools for the sidebar

**Debug the content script (content.js):**
- Open DevTools on any webpage (F12)
- Go to Console tab
- Filter by `[PagePal]`

**Debug the service worker (background.js):**
- Go to `chrome://extensions`
- Find PagePal AI
- Click **"Service Worker"** link below the extension name

**Debug the backend:**
- Look at the terminal running `npm run dev`
- The router logs: `[PagePal Router] → GEMINI | Large content detected | confidence: high`

---

## 🚨 Troubleshooting

### ❌ "Could not connect to MongoDB"

```
MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**Fix:** MongoDB isn't running. Start it:

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows — check Services app for "MongoDB"
```

Or double-check your Atlas connection string — make sure you replaced `<password>` with the real password.

---

### ❌ "OpenAI API error (401)"

```
OpenAI API error (401): Incorrect API key provided
```

**Fix:** Your `OPENAI_API_KEY` in `.env` is wrong or missing.

- Open `Ai_Tools/server/.env`
- Make sure it starts with `sk-` (not `sk-proj-...` or other variants vary)
- No spaces around the `=` sign: `OPENAI_API_KEY=sk-xxxx` ✅

---

### ❌ Extension side panel doesn't open

**Fix 1 — Check Chrome version:** Side Panel API requires Chrome 114+.
```
chrome://settings/help
```

**Fix 2 — Try reloading the extension:**
- Go to `chrome://extensions`
- Click the ↻ reload button on PagePal AI

**Fix 3 — Check for manifest errors:**
- Go to `chrome://extensions`
- Look for any error badge on PagePal AI
- Click "Errors" to see what's wrong

---

### ❌ "Failed to fetch" in the sidebar

The extension can't reach your backend.

**Fix 1 — Make sure backend is running:**
- Check that `npm run dev` is still running in your terminal
- Open [http://localhost:5000/api/health](http://localhost:5000/api/health) — should return `{"status":"ok"}`

**Fix 2 — Check the BACKEND_URL in sidebar.js:**
```js
// Ai_Tools/extension/sidebar.js — line 19
const BACKEND_URL = 'http://localhost:5000/api';
```
Must match the port your server is running on.

---

### ❌ "Content script did not respond"

Extension tried to read the page but the content script wasn't there.

**This happens on:**
- `chrome://` pages (browser internal pages)
- `chrome-extension://` pages
- Some PDFs

**Fix:** Navigate to a regular `https://` webpage before using PagePal.

---

### ❌ Backend starts but AI returns empty response

**Fix 1 — Check your API key has credits:**
- OpenAI: [platform.openai.com/usage](https://platform.openai.com/usage) — check you have credits
- Add a payment method if needed (even $5 lasts months for development)

**Fix 2 — Check rate limits:**
- The default is 30 requests/minute
- If you're testing fast, you might hit it
- Increase in `.env`: `MAX_REQUESTS_PER_MINUTE=100`

---

### ❌ Gemini model not working (falls back to OpenAI)

```
[PagePal] GEMINI_API_KEY not set — falling back to OpenAI
```

**Fix:** Add your Gemini key to `.env`:
```
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXX
```

Then restart the backend: `Ctrl+C` then `npm run dev`

---

### ❌ npm install fails

```
npm ERR! peer dep missing
```

**Fix:** Use the right Node.js version:
```bash
node --version   # Should be 18+
nvm use 18       # If using nvm
npm install
```

---

### ❌ Port 5000 already in use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Fix 1 — Kill the existing process:**

```bash
# macOS / Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
# Note the PID number, then:
taskkill /PID <pid-number> /F
```

**Fix 2 — Use a different port:**
In `Ai_Tools/server/.env`:
```
PORT=5001
```
And update in `Ai_Tools/extension/sidebar.js`:
```js
const BACKEND_URL = 'http://localhost:5001/api';
```

---

## 📊 Environment Variables Reference

Full reference for `Ai_Tools/server/.env`:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Port the Express server listens on |
| `NODE_ENV` | No | `development` | Set to `production` on deployment |
| `MONGODB_URI` | ✅ Yes | — | Full MongoDB connection string |
| `OPENAI_API_KEY` | ✅ Yes | — | Your OpenAI secret key |
| `GEMINI_API_KEY` | No | — | Google Gemini API key (recommended) |
| `DEEPSEEK_API_KEY` | No | — | DeepSeek API key (optional) |
| `GROK_API_KEY` | No | — | xAI Grok API key (optional) |
| `MAX_REQUESTS_PER_MINUTE` | No | `30` | Rate limit per IP |
| `ALLOWED_ORIGINS` | No | `*` | Restrict CORS in production |

---

## 🌍 Deploying to Production

### Deploy the Backend

**Recommended: Railway (easiest)**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy from the server folder
cd Ai_Tools/server
railway init
railway up
```

Set environment variables in the Railway dashboard — same ones as your `.env`.

**Other options:** Render, Fly.io, Heroku, AWS EC2, DigitalOcean App Platform

### After Deploying

1. Get your deployment URL (e.g. `https://pagepal-backend.railway.app`)

2. Update the extension's backend URL:

```js
// Ai_Tools/extension/sidebar.js — line 19
const BACKEND_URL = 'https://pagepal-backend.railway.app/api';
```

3. Update your `manifest.json` host_permissions:

```json
"host_permissions": [
  "<all_urls>",
  "https://pagepal-backend.railway.app/*"
]
```

4. Set `ALLOWED_ORIGINS` in your backend environment:
```
ALLOWED_ORIGINS=chrome-extension://your_extension_id_here
```

To find your extension ID: Go to `chrome://extensions` → find PagePal AI → copy the long ID string.

---

## 📦 What Each `npm install` Installs

### Backend dependencies (`Ai_Tools/server/`)

| Package | Purpose |
|---------|---------|
| `express` | HTTP server framework |
| `mongoose` | MongoDB object modeling |
| `openai` | OpenAI, DeepSeek, and Grok API client |
| `@google/generative-ai` | Google Gemini API client |
| `cors` | Cross-Origin Resource Sharing headers |
| `helmet` | Security HTTP headers |
| `morgan` | HTTP request logger |
| `express-rate-limit` | Prevents API abuse |
| `dotenv` | Loads `.env` file into `process.env` |
| `uuid` | Generates unique conversation IDs |
| `nodemon` (dev) | Auto-restarts server on file changes |

### Landing page dependencies (`Ai_Tools/landing/`)

| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `framer-motion` | Animations |
| `lucide-react` | SVG icons |
| `vite` | Build tool and dev server |
| `tailwindcss` | Utility CSS framework |
| `autoprefixer` + `postcss` | CSS processing |

---

## ✅ Setup Checklist

Use this to make sure everything is done:

```
Backend
□ Node.js 18+ installed
□ cd Ai_Tools/server && npm install completed
□ .env file created from .env.example
□ MONGODB_URI set (Atlas or local)
□ OPENAI_API_KEY set
□ GEMINI_API_KEY set (recommended)
□ npm run dev shows "🚀 PagePal server running on http://localhost:5000"
□ curl http://localhost:5000/api/health returns { "status": "ok" }

Chrome Extension
□ Chrome 114+ installed
□ chrome://extensions opened
□ Developer mode enabled (top-right toggle)
□ "Load unpacked" → selected Ai_Tools/extension/dist/ folder
□ PagePal AI appears in extensions list with no errors
□ Extension icon pinned to Chrome toolbar
□ Clicking icon opens side panel on a webpage

End-to-End Test
□ Opened a real webpage (e.g. Wikipedia article)
□ Clicked "✨ Explain Page" — got an AI response
□ Saw a model badge (e.g. "✦ Gemini 1.5")
□ Typed a custom question — got a reply

Landing Page (optional)
□ cd Ai_Tools/landing && npm install completed
□ npm run dev shows "Local: http://localhost:5173"
□ Page loads in browser
```

---

*If you're still stuck after following this guide, open the DevTools console (F12) and look for error messages — they usually point directly at the problem.*
