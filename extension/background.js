/**
 * PagePal AI — background.js (Service Worker, Manifest V3)
 *
 * Responsibilities:
 *  - Open the Chrome side panel when the extension icon is clicked
 *  - Route messages between the sidebar and content scripts
 *  - Cache the last extracted page content and invalidate it on tab changes
 *
 * FIX NOTE:
 *  Using openPanelOnActionClick: true is the correct approach.
 *  The previous pattern of `await setOptions()` then `open()` inside
 *  onClicked broke Chrome's user-gesture requirement for sidePanel.open(),
 *  because the async await call caused the gesture context to be lost.
 *  With openPanelOnActionClick: true, Chrome natively toggles the side panel
 *  on icon click — no onClicked handler needed for panel control.
 */

"use strict";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** @type {{ text: string, url: string, title: string, isYouTube: boolean } | null} */
let cachedPageContent = null;

/** @type {number | null} Last tab ID we extracted content from */
let cachedTabId = null;

// ---------------------------------------------------------------------------
// Side Panel — tell Chrome to open the panel whenever the icon is clicked
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(() => {
  // openPanelOnActionClick: true  →  Chrome automatically opens/closes
  // the side panel when the user clicks the toolbar icon.
  // This is more reliable than calling sidePanel.open() manually because
  // Chrome owns the gesture handling and there is no async timing issue.
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error("[PagePal] setPanelBehavior error:", err));
});

// Also set the behaviour on startup (covers cases where onInstalled doesn't fire,
// e.g. when the extension is already installed and the browser just restarts).
chrome.runtime.onStartup.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(() => {});
});

// ---------------------------------------------------------------------------
// Cache invalidation
// ---------------------------------------------------------------------------

chrome.tabs.onActivated.addListener(({ tabId }) => {
  if (tabId !== cachedTabId) {
    cachedPageContent = null;
    cachedTabId = null;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading" && tabId === cachedTabId) {
    cachedPageContent = null;
    cachedTabId = null;
  }
});

// ---------------------------------------------------------------------------
// Message routing  (sidebar  ↔  content script)
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { type } = message;

  if (type === "GET_PAGE_CONTENT") {
    handleGetPageContent(sendResponse);
    return true; // keep the message channel open for the async response
  }

  if (type === "GET_SELECTED_TEXT") {
    handleGetSelectedText(sendResponse);
    return true;
  }

  if (type === "CLEAR_CACHE") {
    cachedPageContent = null;
    cachedTabId = null;
    sendResponse({ ok: true });
    return false;
  }

  if (type === "TAKE_SCREENSHOT") {
    handleTakeScreenshot(sendResponse);
    return true;
  }

  // Relay Clerk auth updates from content script → store in chrome.storage
  if (type === "CLERK_AUTH_UPDATE") {
    if (message.user) {
      chrome.storage.local.set({
        clerkUser: message.user,
        clerkToken: message.token,
      }, () => {
        console.log("[PagePal] Auth state saved to storage");
        if (sendResponse) sendResponse({ ok: true });
      });
    } else {
      chrome.storage.local.remove(['clerkUser', 'clerkToken'], () => {
        console.log("[PagePal] Auth state cleared from storage");
        if (sendResponse) sendResponse({ ok: true });
      });
    }
    return true; // Keep the channel open for async response
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function handleGetPageContent(sendResponse) {
  try {
    const activeTab = await getActiveTab();
    if (!activeTab) {
      sendResponse({ error: "No active tab found." });
      return;
    }

    // Return cached result if the same tab is still active
    if (cachedPageContent && cachedTabId === activeTab.id) {
      sendResponse({ ok: true, data: cachedPageContent });
      return;
    }

    let response = await sendMessageToTab(activeTab.id, {
      type: "EXTRACT_PAGE_TEXT",
    });

    // If the content script isn't there (e.g. tab was open before extension installed), inject it dynamically
    if (response && response.error && response.error.includes("Receiving end does not exist")) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ["content.js"],
        });
        // Try asking for content again
        response = await sendMessageToTab(activeTab.id, {
          type: "EXTRACT_PAGE_TEXT",
        });
      } catch (injectErr) {
        console.error("[PagePal] Auto-injection failed:", injectErr);
      }
    }

    if (response && response.ok) {
      cachedPageContent = response.data;
      cachedTabId = activeTab.id;
      sendResponse({ ok: true, data: response.data });
    } else {
      sendResponse({
        error: response?.error || "Content script did not respond.",
      });
    }
  } catch (err) {
    console.error("[PagePal] handleGetPageContent error:", err);
    sendResponse({
      error: err.message || "Unknown error extracting page content.",
    });
  }
}

async function handleGetSelectedText(sendResponse) {
  try {
    const activeTab = await getActiveTab();
    if (!activeTab) {
      sendResponse({ error: "No active tab found." });
      return;
    }

    let response = await sendMessageToTab(activeTab.id, {
      type: "GET_SELECTED_TEXT",
    });

    // Auto-inject if missing
    if (response && response.error && response.error.includes("Receiving end does not exist")) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ["content.js"],
        });
        response = await sendMessageToTab(activeTab.id, {
          type: "GET_SELECTED_TEXT",
        });
      } catch (injectErr) {
        console.error("[PagePal] Auto-injection failed:", injectErr);
      }
    }

    if (response && response.ok) {
      sendResponse({ ok: true, data: response.data });
    } else {
      sendResponse({
        error: response?.error || "Content script did not respond.",
      });
    }
  } catch (err) {
    console.error("[PagePal] handleGetSelectedText error:", err);
    sendResponse({ error: err.message || "Unknown error getting selection." });
  }
}

async function handleTakeScreenshot(sendResponse) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: "png" });
    sendResponse({ ok: true, data: dataUrl });
  } catch (err) {
    console.error("[PagePal] handleTakeScreenshot error:", err);
    sendResponse({ error: err.message || "Failed to capture screenshot." });
  }
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs.length > 0 ? tabs[0] : null;
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ error: chrome.runtime.lastError.message });
        } else {
          resolve(response);
        }
      });
    } catch (err) {
      resolve({ error: err.message });
    }
  });
}
