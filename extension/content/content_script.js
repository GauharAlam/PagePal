// content/content_script.js
// Extracts page content and responds to messages from the popup

(function () {
  'use strict';

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageContent') {
      const content = extractPageContent();
      sendResponse(content);
    }

    if (request.action === 'getYouTubeInfo') {
      const videoId = new URLSearchParams(window.location.search).get('v');
      const title = document.title.replace(' - YouTube', '').trim();
      const description = document.querySelector('#description-inline-expander, #description, meta[name="description"]');
      sendResponse({
        videoId,
        title,
        description: description?.textContent?.trim()?.slice(0, 5000) || ''
      });
    }

    if (request.action === 'jumpToTime') {
      const video = document.querySelector('video');
      if (video) {
        video.currentTime = request.seconds;
        video.play();
      }
      sendResponse({ success: !!video });
    }

    // Required for async sendResponse
    return true;
  });

  function extractPageContent() {
    const url = window.location.href;
    const title = document.title;

    // YouTube: extract video metadata
    if (url.includes('youtube.com/watch')) {
      const videoId = new URLSearchParams(window.location.search).get('v');
      return {
        type: 'youtube',
        videoId,
        title: title.replace(' - YouTube', '').trim(),
        content: getYouTubePageText()
      };
    }

    // PDF: limited extraction
    if (url.endsWith('.pdf') || url.includes('/pdf/')) {
      return {
        type: 'pdf',
        title,
        content: document.body.innerText?.slice(0, 15000) || 'PDF content could not be extracted.'
      };
    }

    // Article/General: use Readability-like extraction
    return {
      type: 'article',
      title,
      content: extractArticleContent()
    };
  }

  function extractArticleContent() {
    // Try semantic elements first
    const selectors = [
      'article',
      'main',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      '#content',
      '#main-content',
      '.story-body'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText.length > 200) {
        return cleanText(el.innerText).slice(0, 15000);
      }
    }

    // Fallback: body text with cleanup
    return cleanText(document.body.innerText).slice(0, 15000);
  }

  function getYouTubePageText() {
    // Extract whatever text context is available on the page
    const descEl = document.querySelector('#description-inline-expander, #description');
    const commentsEls = document.querySelectorAll('#content-text');
    
    let text = '';
    if (descEl) text += 'Description: ' + descEl.innerText.trim() + '\n\n';
    
    // Get first few comments for context
    const comments = Array.from(commentsEls).slice(0, 5);
    if (comments.length) {
      text += 'Top comments:\n';
      comments.forEach(c => {
        text += '- ' + c.innerText.trim().slice(0, 200) + '\n';
      });
    }

    return text.slice(0, 5000);
  }

  function cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  // Inject Left-Side Floating Trigger
  function injectFloatingTrigger() {
    if (window !== window.top) return; // Only inject in main frame
    if (document.getElementById('pagepal-sidebar-trigger-host')) return; // Avoid duplicates

    const host = document.createElement('div');
    host.id = 'pagepal-sidebar-trigger-host';
    host.style.position = 'fixed';
    host.style.left = '0';
    host.style.top = '48%';
    host.style.zIndex = '2147483647';
    host.style.pointerEvents = 'none';

    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        .pagepal-trigger {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 7px;
          background: #fde047;
          color: #09090b;
          border: 1.5px solid #18181b;
          border-left: none;
          border-radius: 0 12px 12px 0;
          padding: 8px 12px 8px 8px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          transform: translateX(-4px);
          user-select: none;
        }
        .pagepal-trigger:hover {
          transform: translateX(0);
          background: #facc15;
          box-shadow: 0 6px 20px rgba(0,0,0,0.25);
          padding-right: 14px;
        }
        .pagepal-trigger:active {
          transform: scale(0.96) translateX(0);
        }
        .pagepal-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          background: #18181b;
          color: #fde047;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 800;
          line-height: 1;
        }
        .pagepal-label {
          letter-spacing: -0.01em;
          white-space: nowrap;
        }
      </style>
      <button class="pagepal-trigger" id="open-btn" title="Open PagePal AI Side Panel">
        <span class="pagepal-icon">◈</span>
        <span class="pagepal-label">PagePal</span>
      </button>
    `;

    shadow.getElementById('open-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        chrome.runtime.sendMessage({ action: 'openSidePanel' });
      } catch (err) {
        console.error('PagePal trigger click error:', err);
      }
    });

    document.documentElement.appendChild(host);
  }

  // Inject when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFloatingTrigger);
  } else {
    injectFloatingTrigger();
  }
})();
