// background/service_worker.js
// Detects page type when tabs update and stores context in session storage

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    let pageType = 'general';

    if (tab.url.includes('youtube.com/watch')) {
      pageType = 'youtube';
    } else if (tab.url.endsWith('.pdf') || tab.url.includes('/pdf/')) {
      pageType = 'pdf';
    } else {
      pageType = 'article';
    }

    chrome.storage.session.set({
      pageType,
      tabUrl: tab.url,
      tabTitle: tab.title
    });
  }
});

// Context menu for "Explain Selection"
chrome.contextMenus.create({
  id: 'pagepal-explain',
  title: 'PagePal AI: Explain Selection',
  contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'pagepal-explain' && info.selectionText) {
    chrome.storage.session.set({
      selectedText: info.selectionText,
      pageType: 'selection',
      tabUrl: tab.url,
      tabTitle: tab.title
    });
  }
});

// Handle extension icon click — ensure page context is fresh
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url) {
    let pageType = 'general';
    if (tab.url.includes('youtube.com/watch')) pageType = 'youtube';
    else if (tab.url.endsWith('.pdf') || tab.url.includes('/pdf/')) pageType = 'pdf';
    else pageType = 'article';

    await chrome.storage.session.set({
      pageType,
      tabUrl: tab.url,
      tabTitle: tab.title
    });
  }
});
