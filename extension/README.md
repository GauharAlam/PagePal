# 🧠 PagePal AI — Chrome Extension

> **Your AI browser assistant** — explains any page, selection, or video in simple language.

PagePal AI is a **Manifest V3 Chrome Extension** that opens as a side panel beside any webpage. It extracts the page's text, sends it to your local AI backend, and lets you have a full conversation about whatever you're reading or watching.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📄 **Page Explainer** | Summarise or explain any article, blog post, or documentation |
| ✂️ **Selection Mode** | Highlight any text → ask PagePal to explain just that passage |
| 🎬 **YouTube Support** | Detects YouTube and can discuss the video's topic |
| 💬 **Multi-turn Chat** | Full conversation with memory across turns |
| 🌙 **Dark / Light Mode** | One-click theme toggle, preference saved across sessions |
| ⚡ **Quick Actions** | Six one-click shortcuts (Explain, Summarize, Key Points, Beginner, Code, Selection) |

---

## 📁 Project Structure

```
extension/
├── manifest.json      # Extension manifest (Manifest V3)
├── background.js      # Service worker — panel control, message routing, caching
├── content.js         # Injected into every page — text extraction & selection
├── sidebar.html       # Side panel HTML
├── sidebar.css        # All styles (dark/light theme, animations)
├── sidebar.js         # All sidebar logic (chat, API calls, UI)
├── icons/             # Extension icons (see Icon Requirements below)
└── README.md          # This file
```

---

## 🚀 Loading the Extension (Unpacked)

1. **Clone / download** this repository.

2. **Open Chrome** and go to `chrome://extensions`.

3. Enable **Developer mode** (toggle in the top-right corner).

4. Click **"Load unpacked"**.

5. Select the `extension/` folder (the one containing `manifest.json`).

6. The **PagePal AI** extension will appear in your toolbar.

> **Tip:** Pin it to the toolbar by clicking the puzzle-piece icon → pin PagePal AI.

---

## 🔧 Using the Extension

1. Navigate to any webpage.
2. Click the **PagePal AI icon** in the toolbar.
3. The **side panel** opens to the right of the browser window.
4. Use **Quick Actions** or type your own question in the input box.
5. To use **Selection Mode**: highlight text on the page, then click **✂️ Explain Selection**.
6. Click **🔄** (refresh) to re-read the page after navigation.

---

## 🔌 Backend API

PagePal AI talks to a local backend server. By default it expects:

```
http://localhost:5000/api/chat
```

You can change this by editing the constant in `sidebar.js`:

```js
const BACKEND_URL = 'http://localhost:5000/api';
```

### Expected Request Format

`POST /api/chat`

```json
{
  "message": "Explain this content in simple, clear language.",
  "context": "<extracted page text, up to 8000 chars>",
  "conversationId": "abc123",
  "mode": "explain",
  "pageUrl": "https://example.com/article",
  "pageTitle": "My Article Title"
}
```

### Expected Response Format

```json
{
  "reply": "Here's a simple explanation...",
  "conversationId": "abc123"
}
```

> The response field can also be named `message` or `response` — PagePal tries all three.

### Quick-start Backend (Python + Flask example)

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai, uuid

app = Flask(__name__)
CORS(app)

conversations = {}

@app.route('/api/chat', methods=['POST'])
def chat():
    body = request.json
    conv_id = body.get('conversationId') or str(uuid.uuid4())
    history = conversations.get(conv_id, [])

    system_prompt = (
        "You are PagePal, a helpful AI assistant that explains web pages. "
        "The user has shared some page content with you. Be concise and clear."
    )
    if body.get('context'):
        system_prompt += f"\n\nPage content:\n{body['context']}"

    history.append({"role": "user", "content": body['message']})

    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": system_prompt}] + history
    )
    reply = response.choices[0].message.content
    history.append({"role": "assistant", "content": reply})
    conversations[conv_id] = history

    return jsonify({"reply": reply, "conversationId": conv_id})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
```

Install dependencies: `pip install flask flask-cors openai`

Set your API key: `export OPENAI_API_KEY=sk-...`

Run: `python app.py`

---

## 🔐 Permissions Explained

| Permission | Why it's needed |
|------------|----------------|
| `activeTab` | Read the URL and title of the current tab |
| `scripting` | Inject `content.js` into pages to extract text |
| `storage` | Save the theme preference (dark/light) |
| `sidePanel` | Open the Chrome side panel UI |
| `<all_urls>` | Allow content script to run on any website |

> **Privacy note:** No page content is ever sent anywhere except to your own local backend at `localhost:5000`. Nothing is logged or stored remotely.

---

## 🖼️ Icon Requirements

The extension references these icon files (you need to provide real PNG images):

| File | Size | Usage |
|------|------|-------|
| `icons/icon16.png` | 16×16 px | Favicon / tab icon |
| `icons/icon32.png` | 32×32 px | Windows taskbar |
| `icons/icon48.png` | 48×48 px | Extensions page |
| `icons/icon128.png` | 128×128 px | Chrome Web Store / install dialog |

**Quick way to generate placeholder icons** (requires ImageMagick):

```bash
for size in 16 32 48 128; do
  convert -size ${size}x${size} xc:#6c63ff \
    -fill white -gravity center \
    -pointsize $((size / 2)) \
    -annotate 0 "P" \
    icons/icon${size}.png
done
```

Or use any design tool (Figma, Canva, etc.) to export a brain/sparkle logo at the required sizes.

---

## 🛠️ Development Tips

- **Reloading after edits**: Go to `chrome://extensions` → click the **↻ reload** button on PagePal AI.
- **Debugging the sidebar**: Right-click inside the side panel → **Inspect** to open DevTools for `sidebar.js`.
- **Debugging the service worker**: On `chrome://extensions` → click **"Service Worker"** link under PagePal AI.
- **Debugging content.js**: Open DevTools on any page → Console → filter by `[PagePal]`.
- **CORS**: If your backend returns CORS errors, add the appropriate `Access-Control-Allow-Origin` headers or use `flask-cors`.

---

## 📜 License

MIT — free to use, modify, and distribute.
