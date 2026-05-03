/**
 * PagePal AI — sidebar.js
 *
 * All sidebar UI logic:
 *  - Context detection (page / selection / YouTube)
 *  - Quick action shortcuts
 *  - Chat message sending / receiving
 *  - Markdown rendering
 *  - Theme toggle (dark ↔ light) with storage persistence
 *  - Textarea auto-resize
 */

"use strict";

// ============================================================
// Constants
// ============================================================

// Port 5001 — macOS Monterey+ uses port 5000 for AirPlay Receiver.
const BACKEND_URL = "http://localhost:5001/api";

/** Maps quick-action data-action values to prompt strings */
const QUICK_ACTION_PROMPTS = {
  explain: "Explain this content in simple, clear language.",
  summarize: "Summarize the main points in 5 bullet points.",
  keypoints: "List the key takeaways from this content.",
  beginner:
    "Explain this as if I am a complete beginner with no prior knowledge.",
  code: "Explain this code step by step. What does it do and how does it work?",
  selection: "Explain the selected text in simple language.",
};

// ============================================================
// State
// ============================================================

/** @type {string | null} */
let conversationId = null;

/** @type {{ text: string, url: string, title: string, isYouTube: boolean } | null} */
let pageContext = null;

/** @type {string} */
let selectedText = "";

/** @type {boolean} */
let isDarkMode = true;

/** @type {boolean} */
let isLoading = false;

/** @type {HTMLElement | null} Reference to the loading bubble row for removal */
let loadingBubbleEl = null;

// ============================================================
// DOM References (populated after DOMContentLoaded)
// ============================================================

let chatContainer;
let welcomeMessage;
let contextBadge;
let userInput;
let sendBtn;
let themeToggle;
let themeIcon;
let refreshBtn;

// ============================================================
// Initialisation
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Cache DOM references
  chatContainer = document.getElementById("chatContainer");
  welcomeMessage = document.getElementById("welcomeMessage");
  contextBadge = document.getElementById("contextBadge");
  userInput = document.getElementById("userInput");
  sendBtn = document.getElementById("sendBtn");
  themeToggle = document.getElementById("themeToggle");
  themeIcon = document.getElementById("themeIcon");
  refreshBtn = document.getElementById("refreshBtn");

  // 1. Restore theme preference
  loadTheme();

  // 2. Detect page context and selected text
  initializeContext();

  // 3. Wire up event listeners
  bindEvents();
});

// ============================================================
// Theme
// ============================================================

function loadTheme() {
  try {
    chrome.storage.local.get(["pagepalTheme"], (result) => {
      const theme = result.pagepalTheme || "dark";
      applyTheme(theme === "light");
    });
  } catch (_) {
    applyTheme(false); // default dark if storage unavailable
  }
}

function applyTheme(lightMode) {
  isDarkMode = !lightMode;
  const root = document.documentElement;
  root.setAttribute("data-theme", lightMode ? "light" : "dark");

  // Swap icon
  if (themeIcon) {
    themeIcon.textContent = lightMode ? "🌙" : "☀️";
  }
  if (themeToggle) {
    themeToggle.title = lightMode
      ? "Switch to dark mode"
      : "Switch to light mode";
  }
}

function toggleTheme() {
  const newLightMode = isDarkMode; // flip current state
  applyTheme(newLightMode);

  try {
    chrome.storage.local.set({ pagepalTheme: newLightMode ? "light" : "dark" });
  } catch (_) {}
}

// ============================================================
// Context Initialisation
// ============================================================

/**
 * Ask background.js for the current page content and any active selection,
 * then update the context bar.
 */
async function initializeContext() {
  updateContextBadge("loading");

  try {
    // Fetch page content
    const pageResponse = await sendToBackground({ type: "GET_PAGE_CONTENT" });
    if (pageResponse && pageResponse.ok && pageResponse.data) {
      pageContext = pageResponse.data;
    } else {
      pageContext = {
        text: "",
        url: "",
        title: "Unknown Page",
        isYouTube: false,
      };
    }
  } catch (err) {
    console.warn("[PagePal] Could not get page content:", err);
    pageContext = {
      text: "",
      url: "",
      title: "Unknown Page",
      isYouTube: false,
    };
  }

  try {
    // Fetch selected text
    const selResponse = await sendToBackground({ type: "GET_SELECTED_TEXT" });
    if (selResponse && selResponse.ok) {
      selectedText = selResponse.data || "";
    }
  } catch (err) {
    console.warn("[PagePal] Could not get selected text:", err);
    selectedText = "";
  }

  renderContextBadge();
}

function renderContextBadge() {
  if (!contextBadge) return;

  if (selectedText) {
    contextBadge.textContent = "✂️ Selected text ready";
    contextBadge.className = "context-badge selection";
    return;
  }

  if (pageContext && pageContext.isYouTube) {
    contextBadge.textContent = "🎬 YouTube page detected";
    contextBadge.className = "context-badge youtube";
    return;
  }

  const title =
    pageContext && pageContext.title
      ? truncateText(pageContext.title, 40)
      : "Page";

  contextBadge.textContent = `📄 ${title}`;
  contextBadge.className = "context-badge";
}

function updateContextBadge(state) {
  if (!contextBadge) return;
  if (state === "loading") {
    contextBadge.textContent = "🔍 Loading context…";
    contextBadge.className = "context-badge";
  }
}

// ============================================================
// Event Binding
// ============================================================

function bindEvents() {
  // Send button
  sendBtn.addEventListener("click", () => {
    const text = userInput.value.trim();
    if (text) {
      userInput.value = "";
      resetTextareaHeight();
      sendMessage(text, "chat");
    }
  });

  // Enter to send (Shift+Enter = newline)
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = userInput.value.trim();
      if (text) {
        userInput.value = "";
        resetTextareaHeight();
        sendMessage(text, "chat");
      }
    }
  });

  // Textarea auto-resize
  userInput.addEventListener("input", autoResizeTextarea);

  // Theme toggle
  themeToggle.addEventListener("click", toggleTheme);

  // Refresh context
  refreshBtn.addEventListener("click", async () => {
    refreshBtn.style.opacity = "0.5";
    refreshBtn.disabled = true;
    conversationId = null; // reset conversation on context refresh

    try {
      await sendToBackground({ type: "CLEAR_CACHE" });
    } catch (_) {}

    await initializeContext();

    refreshBtn.style.opacity = "";
    refreshBtn.disabled = false;
  });

  // Quick action buttons
  document.querySelectorAll(".quick-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      handleQuickAction(action);
    });
  });
}

// ============================================================
// Quick Actions
// ============================================================

function handleQuickAction(action) {
  if (isLoading) return;

  const prompt = QUICK_ACTION_PROMPTS[action];
  if (!prompt) return;

  if (action === "selection") {
    if (!selectedText) {
      addErrorBubble(
        "✂️ No text selected. Please highlight some text on the page first, then try again.",
      );
      return;
    }
    sendMessage(prompt, "selection");
    return;
  }

  sendMessage(prompt, action);
}

// ============================================================
// Core Message Send / Receive
// ============================================================

/**
 * Send a user message to the backend AI and display the response.
 *
 * @param {string} userText   - The user's prompt text
 * @param {string} actionType - One of the QUICK_ACTION_PROMPTS keys or 'chat'
 */
async function sendMessage(userText, actionType) {
  if (isLoading) return;

  // Hide welcome message on first send
  hideWelcome();

  // Render the user bubble
  addMessageBubble(userText, "user");

  // Show loading animation
  loadingBubbleEl = addLoadingBubble();
  isLoading = true;
  sendBtn.disabled = true;
  scrollToBottom();

  // Determine context text
  let contextText = "";
  if (actionType === "selection" && selectedText) {
    contextText = selectedText;
  } else if (pageContext && pageContext.text) {
    contextText = pageContext.text;
  }

  const payload = {
    message: userText,
    context: contextText,
    conversationId: conversationId,
    mode: actionType,
    pageUrl: pageContext ? pageContext.url : "",
    pageTitle: pageContext ? pageContext.title : "",
  };

  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errMsg = `Server error: ${response.status} ${response.statusText}`;
      try {
        const errData = await response.json();
        if (errData.error) errMsg = errData.error;
      } catch (_) {}
      throw new Error(errMsg);
    }

    const data = await response.json();

    // Persist conversation ID for multi-turn memory
    if (data.conversationId) {
      conversationId = data.conversationId;
    }

    const replyText =
      data.reply || data.message || data.response || "No response received.";
    removeLoadingBubble();
    addMessageBubble(replyText, "assistant", {
      model: data.model,
      reason: data.reason,
      confidence: data.confidence,
    });
  } catch (err) {
    removeLoadingBubble();
    const errText = err.message.includes("Failed to fetch")
      ? "⚠️ Cannot reach the backend. Make sure the server is running at " +
        BACKEND_URL
      : `⚠️ ${err.message}`;
    addErrorBubble(errText);
  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    scrollToBottom();
  }
}

// ============================================================
// Bubble Rendering
// ============================================================

/**
 * Create and append a chat bubble to the chat container.
 * @param {string} text
 * @param {'user'|'assistant'} role
 * @param {{ model?: string, reason?: string, confidence?: string }} [meta]
 */
function addMessageBubble(text, role, meta = {}) {
  const row = document.createElement("div");
  row.classList.add("bubble-row", role);

  if (role === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = "🧠";
    row.appendChild(avatar);
  }

  const bubbleWrap = document.createElement("div");
  bubbleWrap.className = "bubble-wrap";

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.classList.add(role === "user" ? "user-bubble" : "assistant-bubble");

  if (role === "user") {
    bubble.textContent = text;
  } else {
    bubble.innerHTML = renderMarkdown(text);
  }

  bubbleWrap.appendChild(bubble);

  // Model badge — only for assistant messages when model info is available
  if (role === "assistant" && meta.model) {
    const badge = createModelBadge(meta.model, meta.reason, meta.confidence);
    bubbleWrap.appendChild(badge);
  }

  row.appendChild(bubbleWrap);
  chatContainer.appendChild(row);
  scrollToBottom();
  return row;
}

/**
 * MODEL CONFIG — display names, icons, and accent colors for each model.
 */
const MODEL_CONFIG = {
  openai: { label: "GPT-4o-mini", icon: "⚡", colorClass: "badge-openai" },
  gemini: { label: "Gemini 1.5", icon: "✦", colorClass: "badge-gemini" },
  deepseek: { label: "DeepSeek", icon: "🔍", colorClass: "badge-deepseek" },
  grok: { label: "Grok", icon: "𝕏", colorClass: "badge-grok" },
};

/**
 * Creates a model badge element shown below an assistant bubble.
 * @param {string} model
 * @param {string} [reason]
 * @param {string} [confidence]
 * @returns {HTMLElement}
 */
function createModelBadge(model, reason, confidence) {
  const config = MODEL_CONFIG[model] || {
    label: model,
    icon: "🤖",
    colorClass: "badge-openai",
  };

  const badge = document.createElement("div");
  badge.className = `model-badge ${config.colorClass}`;
  badge.title = reason || `Answered by ${config.label}`;

  // Confidence dot
  const dot = document.createElement("span");
  dot.className = `confidence-dot confidence-${confidence || "high"}`;
  dot.setAttribute("aria-hidden", "true");

  const icon = document.createElement("span");
  icon.className = "badge-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = config.icon;

  const label = document.createElement("span");
  label.className = "badge-label";
  label.textContent = config.label;

  badge.appendChild(dot);
  badge.appendChild(icon);
  badge.appendChild(label);

  if (reason) {
    const reasonEl = document.createElement("span");
    reasonEl.className = "badge-reason";
    reasonEl.textContent = ` · ${reason}`;
    badge.appendChild(reasonEl);
  }

  return badge;
}

/**
 * Append a styled error bubble.
 * @param {string} message
 */
function addErrorBubble(message) {
  const row = document.createElement("div");
  row.classList.add("bubble-row", "error");

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = "⚠️";

  const bubble = document.createElement("div");
  bubble.classList.add("bubble", "error-bubble");
  bubble.textContent = message;

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatContainer.appendChild(row);
  scrollToBottom();
  return row;
}

/**
 * Append the 3-dot loading indicator and return a reference to it.
 * @returns {HTMLElement}
 */
function addLoadingBubble() {
  const row = document.createElement("div");
  row.classList.add("bubble-row", "assistant");
  row.id = "loadingBubbleRow";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = "🧠";

  const bubble = document.createElement("div");
  bubble.classList.add("loading-bubble");
  bubble.setAttribute("aria-label", "PagePal is thinking…");
  bubble.setAttribute("role", "status");

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("div");
    dot.className = "loading-dot";
    bubble.appendChild(dot);
  }

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatContainer.appendChild(row);
  return row;
}

/**
 * Remove the loading bubble if it's still in the DOM.
 */
function removeLoadingBubble() {
  if (loadingBubbleEl && loadingBubbleEl.parentNode) {
    loadingBubbleEl.parentNode.removeChild(loadingBubbleEl);
  }
  const fallback = document.getElementById("loadingBubbleRow");
  if (fallback) fallback.remove();
  loadingBubbleEl = null;
}

// ============================================================
// Markdown Rendering (lightweight, no dependencies)
// ============================================================

/**
 * Convert a small subset of Markdown to safe HTML.
 * Supports: **bold**, `code`, bullet lists (- / •), newlines.
 *
 * @param {string} text
 * @returns {string} HTML string
 */
function renderMarkdown(text) {
  if (!text) return "";

  // Escape HTML entities to prevent XSS
  let html = escapeHtml(text);

  // Bold: **text** → <strong>text</strong>
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Inline code: `code` → <code>code</code>
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Process line by line for bullet lists
  const lines = html.split("\n");
  let inList = false;
  const processedLines = [];

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Detect bullet list items: lines starting with - , * , or •
    if (/^[-*•]\s+/.test(trimmed)) {
      if (!inList) {
        processedLines.push("<ul>");
        inList = true;
      }
      const content = trimmed.replace(/^[-*•]\s+/, "");
      processedLines.push(`<li>${content}</li>`);
    } else {
      if (inList) {
        processedLines.push("</ul>");
        inList = false;
      }
      // Numbered list: lines starting with "1. " etc
      if (/^\d+\.\s+/.test(trimmed)) {
        processedLines.push(`<li>${trimmed.replace(/^\d+\.\s+/, "")}</li>`);
      } else if (trimmed === "") {
        processedLines.push("<br>");
      } else {
        processedLines.push(line);
      }
    }
  });

  if (inList) processedLines.push("</ul>");

  // Join and convert remaining newlines to <br>
  html = processedLines.join("\n").replace(/\n(?!<)/g, "<br>");

  return html;
}

/**
 * Escape < > & " ' in a string to their HTML entity equivalents.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ============================================================
// UI Helpers
// ============================================================

function hideWelcome() {
  if (welcomeMessage) {
    welcomeMessage.style.display = "none";
  }
}

function scrollToBottom() {
  if (!chatContainer) return;
  requestAnimationFrame(() => {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  });
}

function autoResizeTextarea() {
  if (!userInput) return;
  userInput.style.height = "auto";
  userInput.style.height = `${Math.min(userInput.scrollHeight, 120)}px`;
}

function resetTextareaHeight() {
  if (!userInput) return;
  userInput.style.height = "auto";
}

// ============================================================
// Chrome Messaging Helper
// ============================================================

/**
 * Send a message to background.js and return a promise that resolves with
 * the response. Handles chrome.runtime.lastError gracefully.
 *
 * @param {object} message
 * @returns {Promise<any>}
 */
function sendToBackground(message) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

// ============================================================
// Utility
// ============================================================

/**
 * Truncate text to `max` characters, appending '…' if cut.
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
function truncateText(str, max) {
  if (!str) return "";
  return str.length <= max ? str : str.slice(0, max - 1) + "…";
}
