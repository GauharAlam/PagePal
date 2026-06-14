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
})();
