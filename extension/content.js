/**
 * PagePal AI — content.js
 *
 * Injected into every webpage at document_idle.
 * Handles DOM text extraction and selection retrieval on behalf of background.js.
 */

'use strict';

// Guard against double-injection (e.g. iframes or re-injection)
if (typeof window.__pagePalInjected === 'undefined') {
  window.__pagePalInjected = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const { type } = message;

    if (type === 'EXTRACT_PAGE_TEXT') {
      try {
        const result = extractPageText();
        sendResponse({ ok: true, data: result });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
      return false; // synchronous response
    }

    if (type === 'GET_SELECTED_TEXT') {
      try {
        const selection = window.getSelection().toString().trim();
        sendResponse({ ok: true, data: selection });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
      return false;
    }
  });

  // Listen for Auth updates from the landing page
  window.addEventListener('message', (event) => {
    // Only accept messages from the same origin (the landing page)
    if (event.origin !== window.location.origin) return;

    if (event.data && event.data.type === 'CLERK_AUTH_UPDATE') {
      console.log('[PagePal Content] Received CLERK_AUTH_UPDATE from landing page:', event.data.user ? 'Logged In' : 'Logged Out');
      try {
        chrome.runtime.sendMessage(event.data, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[PagePal Content] Error sending to background:', chrome.runtime.lastError);
          } else {
            console.log('[PagePal Content] Successfully relayed to background');
          }
        });
      } catch (err) {
        console.error('[PagePal Content] Exception sending to background:', err);
      }
    }
  });

  // Request auth state immediately upon injection
  // This solves the race condition if AuthSync mounted before we injected
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('wappify.io')) {
    console.log('[PagePal Content] Requesting auth state from landing page...');
    window.postMessage({ type: 'REQUEST_CLERK_AUTH' }, '*');
  }
}

// ---------------------------------------------------------------------------
// Text Extraction
// ---------------------------------------------------------------------------

/**
 * Clones the document body, strips noise elements, and returns clean text
 * along with metadata.
 *
 * @returns {{ text: string, url: string, title: string, isYouTube: boolean }}
 */
function extractPageText() {
  const isYouTube = window.location.hostname.includes('youtube.com');
  const url = window.location.href;
  const title = document.title || '';

  // Work on a deep clone so we never mutate the live DOM
  const clone = document.body.cloneNode(true);

  // Remove non-content elements
  const noiseSelectors = [
    'script',
    'style',
    'noscript',
    'nav',
    'footer',
    'header',
    'aside',
    'iframe',
    'svg',
    'canvas',
    'figure > figcaption', // keep figcaption inside article but remove standalone
    '[aria-hidden="true"]',
    '[role="banner"]',
    '[role="navigation"]',
    '[role="complementary"]',
    '[role="contentinfo"]',
    '.advertisement',
    '.ad',
    '.ads',
    '.cookie-banner',
    '.cookie-notice',
    '.popup',
    '.modal',
    '.overlay',
    '.sidebar',
    '.widget',
    '.breadcrumb',
    '.pagination',
  ];

  noiseSelectors.forEach((selector) => {
    try {
      clone.querySelectorAll(selector).forEach((el) => el.remove());
    } catch (_) {
      // Ignore invalid selectors
    }
  });

  // Prefer article / main content areas when they exist
  let contentRoot = clone;
  const preferredContainers = [
    clone.querySelector('article'),
    clone.querySelector('[role="main"]'),
    clone.querySelector('main'),
    clone.querySelector('.content'),
    clone.querySelector('#content'),
    clone.querySelector('.post-body'),
    clone.querySelector('.entry-content'),
    clone.querySelector('.article-body'),
  ].filter(Boolean);

  if (preferredContainers.length > 0) {
    contentRoot = preferredContainers[0];
  }

  let rawText = contentRoot.innerText || contentRoot.textContent || '';

  // Normalise whitespace: collapse runs of spaces/tabs, collapse 3+ newlines to 2
  rawText = rawText
    .replace(/[ \t]+/g, ' ')          // multiple spaces/tabs → single space
    .replace(/\n[ \t]+/g, '\n')       // leading whitespace on each line
    .replace(/[ \t]+\n/g, '\n')       // trailing whitespace on each line
    .replace(/\n{3,}/g, '\n\n')       // 3+ newlines → 2
    .trim();

  // For YouTube, prepend the video title explicitly since body text is sparse
  let text = rawText;
  if (isYouTube && title) {
    text = `Video title: ${title}\n\n${rawText}`;
  }

  // Truncate intelligently at a sentence boundary up to MAX_CHARS
  text = smartTruncate(text, 8000);

  return { text, url, title, isYouTube };
}

/**
 * Truncate `str` to at most `maxChars` characters, preferring to break at
 * a sentence boundary (period, question mark, exclamation mark followed by
 * whitespace or end-of-string).
 *
 * @param {string} str
 * @param {number} maxChars
 * @returns {string}
 */
function smartTruncate(str, maxChars) {
  if (str.length <= maxChars) return str;

  const slice = str.slice(0, maxChars);

  // Try to find the last sentence-ending punctuation within the slice
  const sentenceEnd = slice.search(/[.?!][^.?!]*$/);

  if (sentenceEnd > maxChars * 0.5) {
    // Found a reasonable sentence boundary in the latter half of the slice
    return slice.slice(0, sentenceEnd + 1).trimEnd() + ' …';
  }

  // Fall back to truncating at the last word boundary
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > 0) {
    return slice.slice(0, lastSpace).trimEnd() + ' …';
  }

  return slice + ' …';
}
