// PagePal AI content script - Injects floating button & handles text extraction safely
(function () {
  if (window.__pagepal_injected) return;
  window.__pagepal_injected = true;

  // Listen for extraction requests from popup or background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageContent') {
      try {
        const content = extractCleanPageContent();
        sendResponse(content);
      } catch (err) {
        sendResponse({ type: 'general', title: document.title, content: '' });
      }
    }
    return true;
  });

  function extractCleanPageContent() {
    const url = window.location.href;
    const title = document.title || 'Untitled';

    // YouTube handling
    if (url.includes('youtube.com/watch')) {
      const videoId = new URLSearchParams(window.location.search).get('v');
      const descEl = document.querySelector('#description-inline-expander, #description, meta[name="description"]');
      const channelEl = document.querySelector('#owner #channel-name, #upload-info #channel-name');
      return {
        type: 'youtube',
        videoId,
        title: title.replace(' - YouTube', '').trim(),
        channel: channelEl?.innerText?.trim() || '',
        content: descEl?.innerText?.trim()?.slice(0, 15000) || `YouTube video: ${title}`,
      };
    }

    // PDF viewer handling
    if (url.endsWith('.pdf') || document.querySelector('embed[type="application/pdf"]')) {
      return {
        type: 'pdf',
        title: title || 'PDF Document',
        content: 'PDF document opened in browser.',
      };
    }

    // Article & General pages
    const mainSelectors = [
      'article',
      'main',
      '[role="main"]',
      '#js-pjax-container',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      '#content',
      '.markdown-body',
    ];

    for (const sel of mainSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 150) {
        return {
          type: 'article',
          title,
          content: el.innerText.trim().slice(0, 18000),
        };
      }
    }

    // Fallback: body text
    const bodyText = (document.body?.innerText || '').trim();
    return {
      type: 'article',
      title,
      content: bodyText.slice(0, 18000),
    };
  }

  // Inject floating PagePal trigger button
  function injectFloatingTrigger() {
    if (document.getElementById('pagepal-floating-host')) return;

    const host = document.createElement('div');
    host.id = 'pagepal-floating-host';
    host.style.cssText = 'all: initial; position: fixed; bottom: 20px; right: 20px; z-index: 2147483646;';

    const shadow = host.attachShadow({ mode: 'closed' });
    shadow.innerHTML = `
      <style>
        .pagepal-trigger {
          all: unset;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px 7px 10px;
          border-radius: 9999px;
          background: #FDE047;
          color: #0A0A0A;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 12px;
          font-weight: 800;
          border: 2px solid #0A0A0A;
          box-shadow: 3px 3px 0px #0A0A0A;
          transition: transform 0.12s ease, box-shadow 0.12s ease;
          user-select: none;
        }
        .pagepal-trigger:hover {
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0px #0A0A0A;
        }
        .pagepal-trigger:active {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px #0A0A0A;
        }
        .pagepal-icon {
          font-size: 14px;
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
        if (!chrome?.runtime?.id) {
          return;
        }
        chrome.runtime.sendMessage({ action: 'openSidePanel' }).catch(() => {});
      } catch (err) {
        // Silently catch context invalidation from dev reload
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
