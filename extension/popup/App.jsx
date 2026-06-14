import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ContextBar from './components/ContextBar';
import TabBar from './components/TabBar';
import SummaryTab from './components/SummaryTab';
import ChatTab from './components/ChatTab';
import TimelineTab from './components/TimelineTab';
import ToolsTab from './components/ToolsTab';
import LoginModal from './components/LoginModal';
import Footer from './components/Footer';
import { supabase } from './lib/supabase';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [loginOpen, setLoginOpen] = useState(false);
  const [pageContext, setPageContext] = useState({
    pageType: 'general',
    title: '',
    url: ''
  });
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [lastSummarizedUrl, setLastSummarizedUrl] = useState('');

  // Initialize auth & page context
  useEffect(() => {
    // Get current user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Get page context from background service worker
    if (typeof chrome !== 'undefined' && chrome.storage?.session) {
      chrome.storage.session.get(['pageType', 'tabUrl', 'tabTitle'], (result) => {
        setPageContext({
          pageType: result.pageType || 'general',
          url: result.tabUrl || '',
          title: result.tabTitle || 'Current Page'
        });
      });
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Auto-summarize with debounce
  useEffect(() => {
    if (user && pageContext.url && pageContext.url !== lastSummarizedUrl) {
      autoSummarize();
    }
  }, [user, pageContext.url]);

  const autoSummarize = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Inject content script to get page content
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (window.location.href.includes('youtube.com/watch')) {
            const videoId = new URLSearchParams(window.location.search).get('v');
            const title = document.title.replace(' - YouTube', '').trim();
            const desc = document.querySelector('#description-inline-expander, #description');
            return {
              type: 'youtube',
              videoId,
              title,
              content: desc?.innerText?.trim()?.slice(0, 10000) || `YouTube video: ${title}`
            };
          }

          // Article mode: extract readable content
          const selectors = ['article', 'main', '[role="main"]', '.post-content', '.article-content', '.entry-content', '.content', '#content', 'body'];
          let content = '';
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.length > 200) {
              content = el.innerText.slice(0, 15000);
              break;
            }
          }
          if (!content) content = document.body.innerText.slice(0, 15000);

          return {
            type: 'article',
            content,
            title: document.title
          };
        }
      });

      const pageData = results[0].result;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_PROXY_URL}/api/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: pageData.content || `YouTube video ID: ${pageData.videoId}`,
          pageType: pageData.type,
          title: pageData.title
        })
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const data = await res.json();
      setSummaryData(data);
      setLastSummarizedUrl(pageContext.url);
    } catch (err) {
      console.error('Auto-summarize failed:', err);
    } finally {
      setLoading(false);
    }
  }, [pageContext.url, loading, lastSummarizedUrl]);

  function handleQuickAction(action) {
    if (action === 'summarize') {
      setActiveTab('summary');
      if (pageContext.url !== lastSummarizedUrl) autoSummarize();
    } else if (action === 'qa') {
      setActiveTab('chat');
    } else if (action === 'translate' || action === 'export') {
      setActiveTab('tools');
    }
  }

  const themeClasses = theme === 'dark'
    ? 'bg-dark-900 text-white'
    : 'bg-white text-gray-900 light-theme';

  return (
    <div className={`w-[380px] h-[600px] flex flex-col ${themeClasses} overflow-hidden`}>
      <Header
        user={user}
        theme={theme}
        onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        onLoginClick={() => setLoginOpen(true)}
        onLogout={() => supabase.auth.signOut()}
      />

      <ContextBar pageType={pageContext.pageType} title={pageContext.title} />

      <TabBar activeTab={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-hidden">
        {activeTab === 'summary' && (
          <SummaryTab data={summaryData} loading={loading} pageContext={pageContext} />
        )}
        {activeTab === 'chat' && (
          <ChatTab pageContext={pageContext} summaryData={summaryData} user={user} />
        )}
        {activeTab === 'timeline' && (
          <TimelineTab timestamps={summaryData?.timestamps} pageContext={pageContext} />
        )}
        {activeTab === 'tools' && (
          <ToolsTab summaryData={summaryData} pageContext={pageContext} user={user} />
        )}
      </div>

      <Footer onQuickAction={handleQuickAction} />

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={(user) => { setUser(user); setLoginOpen(false); }}
      />
    </div>
  );
}
