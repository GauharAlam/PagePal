// background/service_worker.js
// Detects page type when tabs update and stores context in session+local storage
// Note: chrome.action.onClicked does NOT fire when default_popup is set — removed.

function detectPageType(url = '') {
  if (url.includes('youtube.com/watch')) return 'youtube';
  if (url.endsWith('.pdf') || url.includes('/pdf/')) return 'pdf';
  return 'article';
}

async function persistContext(pageType, tab) {
  const payload = { pageType, tabUrl: tab.url || '', tabTitle: tab.title || '' };
  try {
    await chrome.storage.session.set(payload);
  } catch {}
  // Mirror to local for persistence across restarts
  try {
    await chrome.storage.local.set(payload);
  } catch {}
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const pageType = detectPageType(tab.url);
    persistContext(pageType, tab);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url) await persistContext(detectPageType(tab.url), tab);
  } catch {}
});

// Configure Chrome side panel to open on action click
if (chrome.sidePanel?.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error('Error setting sidePanel behavior:', err));
}

// Handle messages from content scripts (e.g. floating button click)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openSidePanel') {
    if (sender.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id })
        .then(() => sendResponse({ success: true }))
        .catch((err) => {
          if (sender.tab?.windowId) {
            chrome.sidePanel.open({ windowId: sender.tab.windowId })
              .then(() => sendResponse({ success: true }))
              .catch((wErr) => sendResponse({ success: false, error: wErr.message }));
          } else {
            sendResponse({ success: false, error: err.message });
          }
        });
      return true;
    }
  }
});

// Context menu for "Explain Selection" — idempotent
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'pagepal-explain',
      title: 'PagePal AI: Explain Selection',
      contexts: ['selection'],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'pagepal-explain' && info.selectionText) {
    chrome.storage.session.set({
      selectedText: info.selectionText,
      pageType: 'selection',
      tabUrl: tab.url,
      tabTitle: tab.title,
    });
    if (tab?.id) {
      chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
    }
  }
});
