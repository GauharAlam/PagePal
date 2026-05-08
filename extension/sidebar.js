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

/** @type {string} */
let selectedModelId = "auto";

/** @type {any} Reference to SpeechRecognition instance */
let speechRecognition = null;
let isRecording = false;
let isAgentModeActive = false;
let isPremiumUser = false; // Mapped to logged-in state
let currentAttachments = [];
let clerkToken = null; // Stored JWT for API calls
let clerk = null;

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

  // New action buttons
  const uploadFileBtn = document.getElementById("uploadFileBtn");
  const screenshotBtn = document.getElementById("screenshotBtn");
  const fileInput = document.getElementById("fileInput");
  const modelSelectBtn = document.getElementById("modelSelectBtn");
  const voiceBtn = document.getElementById("voiceBtn");

  // Wire up click events
  if (uploadFileBtn) uploadFileBtn.addEventListener("click", () => fileInput.click());
  if (fileInput) fileInput.addEventListener("change", handleFileSelect);
  if (screenshotBtn) screenshotBtn.addEventListener("click", takeScreenshot);
  
  if (modelSelectBtn) {
    modelSelectBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const dropdown = document.getElementById("modelDropdown");
      if (dropdown) dropdown.classList.toggle("show");
    });
  }

  // Handle outside clicks to close dropdown
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("modelDropdown");
    if (dropdown && dropdown.classList.contains("show") && !e.target.closest('.model-select-wrapper')) {
      dropdown.classList.remove("show");
    }
  });

  // Handle model option selection
  document.querySelectorAll(".model-option").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const modelId = btn.dataset.model;
      selectedModelId = modelId;
      
      // Update UI active state
      document.querySelectorAll(".model-option").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Close dropdown
      const dropdown = document.getElementById("modelDropdown");
      if (dropdown) dropdown.classList.remove("show");
      
      // Update the main button title (for accessibility/tooltip)
      if (modelSelectBtn) {
        modelSelectBtn.title = `Selected Model: ${modelId}`;
      }
    });
  });

  // Setup Voice Input
  setupVoiceRecognition();
  if (voiceBtn) {
    voiceBtn.addEventListener("click", toggleVoiceRecording);
  }

  // Setup Agent Mode
  initAgentMode();

  // Setup Authentication
  initAuth();

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
    if (text || currentAttachments.length > 0) {
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
      if (text || currentAttachments.length > 0) {
        userInput.value = "";
        resetTextareaHeight();
        sendMessage(text, "chat");
      }
    }
  });

  // Textarea auto-resize and send button visibility
  userInput.addEventListener("input", () => {
    autoResizeTextarea();
    // Show send button only if there is text or attachments
    sendBtn.style.display = (userInput.value.trim().length > 0 || currentAttachments.length > 0) ? "flex" : "none";
  });

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

  // Quick action buttons (slim)
  document.querySelectorAll(".slim-action").forEach((btn) => {
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
    mode: actionType === "chat" ? null : actionType,
    modelOverride: selectedModelId === "auto" ? null : selectedModelId,
    pageUrl: pageContext ? pageContext.url : "",
    pageTitle: pageContext ? pageContext.title : "",
    attachments: currentAttachments,
  };

  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add Clerk token if available
        ...(clerkToken && {
          "Authorization": `Bearer ${clerkToken}`
        }),
      },
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
    clearAttachments();
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
  if (sendBtn) sendBtn.style.display = "none";
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
// Voice Recognition Logic
// ============================================================

function setupVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Speech recognition is not supported in this browser.");
    return;
  }
  
  speechRecognition = new SpeechRecognition();
  speechRecognition.continuous = true;
  speechRecognition.interimResults = true;
  speechRecognition.lang = 'en-US';
  
  let finalTranscript = "";

  speechRecognition.onstart = () => {
    isRecording = true;
    finalTranscript = userInput.value;
    if (finalTranscript && !finalTranscript.endsWith(' ')) {
      finalTranscript += ' ';
    }
    const voiceBtn = document.getElementById("voiceBtn");
    if (voiceBtn) voiceBtn.classList.add("recording");
  };

  speechRecognition.onresult = (event) => {
    let interimTranscript = "";
    
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + ' ';
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    // Update input box
    if (userInput) {
      userInput.value = finalTranscript + interimTranscript;
      // Trigger auto-resize and show send button
      userInput.dispatchEvent(new Event("input"));
    }
  };

  speechRecognition.onerror = (event) => {
    console.error("Speech recognition error", event.error);
    stopVoiceRecording();
  };

  speechRecognition.onend = () => {
    // If the browser stopped it automatically (due to a pause), but the user
    // hasn't clicked stop yet, we should restart it automatically to keep listening.
    if (isRecording) {
      try {
        speechRecognition.start();
      } catch (e) {
        console.error("Failed to restart speech recognition:", e);
        stopVoiceRecording();
      }
    } else {
      stopVoiceRecording();
    }
  };
}

function toggleVoiceRecording() {
  if (!speechRecognition) {
    addErrorBubble("🎤 Voice input is not supported in your browser.");
    return;
  }

  if (isRecording) {
    speechRecognition.stop();
  } else {
    try {
      speechRecognition.start();
    } catch (e) {
      console.error(e);
    }
  }
}

function stopVoiceRecording() {
  isRecording = false;
  const voiceBtn = document.getElementById("voiceBtn");
  if (voiceBtn) voiceBtn.classList.remove("recording");
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

// ============================================================
// File & Screenshot Helpers
// ============================================================

async function handleFileSelect(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      alert(`File ${file.name} is too large (max 5MB).`);
      continue;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      addAttachment({
        name: file.name,
        type: file.type,
        data: event.target.result
      });
    };
    reader.readAsDataURL(file);
  }
  // Reset input so the same file can be picked again
  e.target.value = "";
}

async function takeScreenshot() {
  const screenshotBtn = document.getElementById("screenshotBtn");
  screenshotBtn.disabled = true;
  screenshotBtn.style.opacity = "0.5";

  try {
    const response = await sendToBackground({ type: "TAKE_SCREENSHOT" });
    if (response && response.ok) {
      addAttachment({
        name: `Screenshot ${new Date().toLocaleTimeString()}.png`,
        type: "image/png",
        data: response.data
      });
    } else {
      throw new Error(response.error || "Failed to capture screenshot");
    }
  } catch (err) {
    addErrorBubble(`📸 Screenshot failed: ${err.message}`);
  } finally {
    screenshotBtn.disabled = false;
    screenshotBtn.style.opacity = "";
  }
}

function addAttachment(attachment) {
  currentAttachments.push(attachment);
  renderAttachments();
}

function removeAttachment(index) {
  currentAttachments.splice(index, 1);
  renderAttachments();
}

function clearAttachments() {
  currentAttachments = [];
  renderAttachments();
}

function renderAttachments() {
  const container = document.getElementById("attachmentPreview");
  if (!container) return;

  if (currentAttachments.length === 0) {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  container.style.display = "flex";
  container.innerHTML = currentAttachments.map((att, index) => {
    const isImage = att.type.startsWith("image/");
    const content = isImage 
      ? `<img src="${att.data}" alt="${att.name}">`
      : `<div class="file-icon">📄</div>`;
    
    return `
      <div class="attachment-item" title="${att.name}">
        ${content}
        <button class="remove-attachment" data-index="${index}">&times;</button>
      </div>
    `;
  }).join("");

  // Bind remove buttons
  container.querySelectorAll(".remove-attachment").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeAttachment(parseInt(btn.dataset.index));
    });
  });
  
  // Update send button visibility (if attachments exist, show send button)
  const sendBtn = document.getElementById("sendBtn");
  const userInput = document.getElementById("userInput");
  if (sendBtn && userInput) {
    sendBtn.style.display = (userInput.value.trim().length > 0 || currentAttachments.length > 0) ? "flex" : "none";
  }
}

// ============================================================
// Agent Mode Logic
// ============================================================

async function initAgentMode() {
  const agentBtn = document.getElementById('agentBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const unlockBtn = document.getElementById('unlockBtn');
  const deactivateBtn = document.getElementById('deactivateAgent');

  // Agent button click
    agentBtn.addEventListener('click', () => {
      console.log('[PagePal] Agent button clicked, isPremium:', isPremiumUser);
      if (!isPremiumUser) {
        // Fallback: Open landing page if clerk is not available or hasn't openSignIn
        if (clerk && typeof clerk.openSignIn === 'function') {
          console.log('[PagePal] Opening Clerk sign-in modal');
          clerk.openSignIn();
        } else {
          console.log('[PagePal] Fallback: Opening landing page tab');
          chrome.tabs.create({ url: 'http://localhost:5173' });
        }
      } else {
        toggleAgentMode();
      }
    });

  // Modal close
  closeModalBtn.addEventListener('click', closeUpgradeModal);
  modalOverlay.addEventListener('click', closeUpgradeModal);

  // Unlock logic is now handled by Clerk Auth, 
  // but we keep the button for testing/legacy
  unlockBtn.addEventListener('click', async () => {
    alert('Authentication is now handled via the Login button in the header.');
  });

  // Also support Enter key in license input
  const licenseInput = document.getElementById('licenseInput');
  if(licenseInput) {
    licenseInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        unlockBtn.click();
      }
    });
  }

  // Deactivate logic
  deactivateBtn.addEventListener('click', () => {
    if (isAgentModeActive) toggleAgentMode();
  });
}

function updateAgentButtonUI() {
  const btn = document.getElementById('agentBtn');
  const lock = btn.querySelector('.lock-badge');
  
  if (isPremiumUser) {
    btn.classList.add('premium');
    btn.title = "Agent Mode — Active";
    if (lock) lock.style.display = 'none';
  } else {
    btn.classList.remove('premium');
    btn.title = "Agent Mode — Premium Feature";
    if (lock) lock.style.display = 'flex';
  }
}

function openUpgradeModal() {
  document.getElementById('upgradeModal').classList.add('show');
  document.getElementById('modalOverlay').classList.add('show');
}

function closeUpgradeModal() {
  document.getElementById('upgradeModal').classList.remove('show');
  document.getElementById('modalOverlay').classList.remove('show');
}

function toggleAgentMode() {
  isAgentModeActive = !isAgentModeActive;
  const card = document.querySelector('.floating-input-card');
  const pill = document.getElementById('agentModePill');
  const quickActions = document.getElementById('quickActions');
  const voiceBtn = document.getElementById('voiceBtn');
  const userInput = document.getElementById('userInput');

  if (isAgentModeActive) {
    card.classList.add('agent-active');
    pill.style.display = 'flex';
    voiceBtn.classList.add('go-btn');
    userInput.placeholder = "What should I do for you?";
    
    // Update quick chips
    quickActions.innerHTML = `
      <span class="slim-action" data-action="agent-open">Open App</span>
      <span class="slim-action" data-action="agent-browse">Browse Web</span>
      <span class="slim-action" data-action="agent-task">Do Task</span>
    `;
  } else {
    card.classList.remove('agent-active');
    pill.style.display = 'none';
    voiceBtn.classList.remove('go-btn');
    userInput.placeholder = "Ask anything...";
    
    // Restore quick chips
    quickActions.innerHTML = `
      <span class="slim-action" data-action="summarize">Summarize</span>
      <span class="slim-action" data-action="keypoints">Key Points</span>
      <span class="slim-action" data-action="selection">Selection</span>
    `;
  }
  
  // Re-bind quick action events since we replaced innerHTML
  document.querySelectorAll(".slim-action").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action.startsWith('agent-')) {
        handleAgentQuickAction(action);
      } else {
        handleQuickAction(action);
      }
    });
  });
}

function handleAgentQuickAction(action) {
  const userInput = document.getElementById('userInput');
  if (action === 'agent-open') userInput.value = "Open WhatsApp and send a message...";
  if (action === 'agent-browse') userInput.value = "Search for the latest news about AI on Google...";
  if (action === 'agent-task') userInput.value = "Organize my desktop and move screenshots to a folder...";
  
  userInput.dispatchEvent(new Event("input"));
}

// ============================================================
// Authentication Logic (Clerk)
// ============================================================

async function initAuth() {
  // Extension cannot directly use Clerk in its isolated context.
  // Instead, we check for stored auth data and listen for messages from the landing page.
  
  // Load stored user data
  chrome.storage.local.get(['clerkUser', 'clerkToken'], (data) => {
    if (data.clerkUser) {
      clerkToken = data.clerkToken || null;
      handleUserLoggedIn(data.clerkUser);
    } else {
      handleUserLoggedOut();
    }
  });

  // Setup UI handlers
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const avatarContainer = document.getElementById('userAvatarContainer');
  const profilePanel = document.getElementById('profilePanel');
  const profilePanelClose = document.getElementById('profilePanelClose');

  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[PagePal] Login button clicked, opening sign-in tab...');
      // Open landing page with ?sign_in=true so Clerk modal auto-opens
      chrome.tabs.create({ url: 'http://localhost:5173/?sign_in=true' });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.storage.local.remove(['clerkUser', 'clerkToken'], () => {
        clerkToken = null;
        handleUserLoggedOut();
      });
    });
  }

  // Avatar click toggles the profile panel
  if (avatarContainer && profilePanel) {
    avatarContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      profilePanel.classList.toggle('show');
    });
  }

  // Close button dismisses the profile panel
  if (profilePanelClose && profilePanel) {
    profilePanelClose.addEventListener('click', () => {
      profilePanel.classList.remove('show');
    });
  }

  // Click outside closes the profile panel
  document.addEventListener('click', (e) => {
    if (profilePanel && !e.target.closest('#profilePanel') && !e.target.closest('#userAvatarContainer')) {
      profilePanel.classList.remove('show');
    }
  });

  // Proactively force any open landing page tabs to re-sync their auth state
  // This handles the case where the user logged in but the extension missed the initial broadcast
  chrome.tabs.query({ url: "*://localhost/*" }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { type: "FORCE_AUTH_SYNC" }, () => {
        // Ignore errors for tabs where content script isn't loaded
        if (chrome.runtime.lastError) {} 
      });
    });
  });

  // Listen for auth updates from the landing page (bridged via content script)
  // This catches messages if the sidebar happens to be open when the login occurs
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CLERK_AUTH_UPDATE') {
      if (request.user) {
        chrome.storage.local.set({
          clerkUser: request.user,
          clerkToken: request.token,
        }, () => {
          clerkToken = request.token;
          handleUserLoggedIn(request.user);
        });
      } else {
        chrome.storage.local.remove(['clerkUser', 'clerkToken'], () => {
          clerkToken = null;
          handleUserLoggedOut();
        });
      }
      if (sendResponse) sendResponse({ success: true });
    }
  });

  // Listen for storage changes (e.g. background script updated auth while sidebar was closed)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.clerkUser) {
      if (changes.clerkUser.newValue) {
        // User logged in
        handleUserLoggedIn(changes.clerkUser.newValue);
      } else {
        // User logged out
        handleUserLoggedOut();
      }
    }
  });
}

function handleUserLoggedIn(user) {
  isPremiumUser = true;
  
  const loginBtn = document.getElementById("loginBtn");
  const avatarContainer = document.getElementById("userAvatarContainer");
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileAvatar = document.getElementById("profileAvatar");
  const userAvatar = document.getElementById("userAvatar");
  
  if (loginBtn) loginBtn.style.display = "none";
  if (avatarContainer) avatarContainer.style.display = "flex";
  
  const email = user.primaryEmailAddress?.emailAddress || "user";
  const firstName = user.firstName || "";
  const lastName = user.lastName || "";
  const displayName = (firstName + " " + lastName).trim() || email.split('@')[0];
  const initial = displayName.charAt(0).toUpperCase();
  const avatarColor = stringToColor(email);
  
  // Populate profile panel
  if (profileEmail) profileEmail.textContent = email;
  if (profileName) profileName.textContent = displayName;

  // Set header avatar (small, in the header bar)
  if (userAvatar) {
    if (user.imageUrl) {
      userAvatar.innerHTML = `<img src="${user.imageUrl}" alt="${displayName}">`;
    } else {
      userAvatar.style.background = avatarColor;
      userAvatar.style.borderColor = avatarColor;
      userAvatar.innerHTML = '';
      userAvatar.textContent = initial;
    }
  }

  // Set profile panel avatar (larger)
  if (profileAvatar) {
    if (user.imageUrl) {
      profileAvatar.innerHTML = `<img src="${user.imageUrl}" alt="${displayName}">`;
    } else {
      profileAvatar.style.background = avatarColor;
      profileAvatar.style.borderColor = avatarColor;
      profileAvatar.innerHTML = '';
      profileAvatar.textContent = initial;
    }
  }

  // Update dynamic welcome message
  if (welcomeMessage) {
    const title = welcomeMessage.querySelector('h2');
    if (title) {
      title.textContent = `Hello, ${displayName.toUpperCase()}`;
    }
  }

  updateAgentButtonUI();
}

function handleUserLoggedOut() {
  isPremiumUser = false;
  
  const loginBtn = document.getElementById("loginBtn");
  const avatarContainer = document.getElementById("userAvatarContainer");
  const profilePanel = document.getElementById("profilePanel");
  
  if (loginBtn) loginBtn.style.display = "block";
  if (avatarContainer) avatarContainer.style.display = "none";
  if (profilePanel) profilePanel.classList.remove("show");
  
  // Reset welcome message
  if (welcomeMessage) {
    const title = welcomeMessage.querySelector('h2');
    if (title) title.textContent = "Hello there";
  }

  if (isAgentModeActive) {
    toggleAgentMode(); // Deactivate agent mode
  }
  updateAgentButtonUI();
}

/**
 * Convert a string to a consistent color (for avatars).
 */
function stringToColor(str) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Listen for storage changes (in case auth was updated while sidebar was already open)
try {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.clerkUser) {
      if (changes.clerkUser.newValue) {
        clerkToken = changes.clerkToken?.newValue || clerkToken;
        handleUserLoggedIn(changes.clerkUser.newValue);
      } else {
        clerkToken = null;
        handleUserLoggedOut();
      }
    }
  });
} catch (_) {}

