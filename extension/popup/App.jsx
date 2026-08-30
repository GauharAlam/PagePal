import { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import TabBar from './components/TabBar';
import SummaryTab from './components/SummaryTab';
import ChatTab from './components/ChatTab';
import TimelineTab from './components/TimelineTab';
import ToolsTab from './components/ToolsTab';
import ApiKeysTab from './components/ApiKeysTab';
import LoginModal from './components/LoginModal';
import { supabase, isDemoMode, demoUser, demoSession } from './lib/supabase';
import { OPENROUTER_FREE_MODELS, DEFAULT_MODEL_ID } from './components/ModelSelector';
import { apiRequest } from './lib/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [loginOpen, setLoginOpen] = useState(false);
  const [pageContext, setPageContext] = useState({ pageType: 'general', title: '', url: '' });
  const [pageContent, setPageContent] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentModel, setCurrentModel] = useState(() => {
    try {
      const saved = localStorage.getItem('pagepal-model');
      if (saved && OPENROUTER_FREE_MODELS.some((m) => m.id === saved)) {
        return saved;
      }
      return DEFAULT_MODEL_ID;
    } catch {
      return DEFAULT_MODEL_ID;
    }
  });
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('pagepal-theme') || 'dark'; } catch { return 'dark'; }
  });
  const lastSummarizedUrlRef = useRef('');
  const autoSummarizeRef = useRef(null);

  // Persist theme and model to storage
  useEffect(() => {
    try { localStorage.setItem('pagepal-theme', theme); } catch {}
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem('pagepal-model', currentModel); } catch {}
  }, [currentModel]);

  // Extract page content safely
  const extractPageContent = useCallback(async () => {
    if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
      return { type: 'article', title: document.title || 'PagePal AI Workspace', content: 'Sample page content for analysis and Q&A' };
    }
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return { type: 'article', title: 'Current Page', content: '' };

      const url = tab.url || '';
      if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('edge://') || url.startsWith('about:') || url.startsWith('view-source:')) {
        return {
          type: 'general',
          title: tab.title || 'Browser Internal Page',
          content: `This is a protected browser internal page (${url}). Chrome security restricts extensions from reading browser settings and extension management pages. Please navigate to any standard webpage, article, or YouTube video to analyze with PagePal AI.`,
        };
      }

      try {
        const resp = await chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' });
        if (resp?.content) return resp;
      } catch {}

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const url = window.location.href;
          const title = document.title;
          if (url.includes('youtube.com/watch')) {
            const videoId = new URLSearchParams(window.location.search).get('v');
            const desc = document.querySelector('#description-inline-expander, #description, meta[name="description"]');
            return {
              type: 'youtube',
              videoId,
              title: title.replace(' - YouTube', '').trim(),
              content: desc?.innerText?.trim()?.slice(0, 12000) || `YouTube video: ${title}`,
            };
          }
          const selectors = ['article', 'main', '[role="main"]', '#js-pjax-container', '.post-content', '.article-content', '.entry-content', '.content', '#content', 'body'];
          let content = '';
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText && el.innerText.length > 100) {
              content = el.innerText.slice(0, 15000);
              break;
            }
          }
          if (!content) content = (document.body?.innerText || '').slice(0, 15000);
          return { type: 'article', title, content };
        },
      });
      return results?.[0]?.result || { type: 'article', title: tab.title || 'Current Page', content: '' };
    } catch (err) {
      console.warn('Script execution caught:', err.message);
      return { type: 'article', title: 'Current Page', content: '' };
    }
  }, []);

  // Init auth & load context
  useEffect(() => {
    let sub;
    if (isDemoMode) {
      setUser(demoUser);
      setUserPlan({ plan: 'free', daily_summaries: 0, daily_chats: 0 });
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchPlan(session.access_token);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.access_token) fetchPlan(session.access_token);
        else setUserPlan(null);
      });
      sub = subscription;
    }

    const loadContext = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.url) {
            const pType = detectType(tab.url);
            setPageContext({ pageType: pType, url: tab.url, title: tab.title || 'Current Page' });

            extractPageContent().then((data) => {
              if (data?.content) {
                setPageContent(data.content);
                if (data.type) {
                  setPageContext((prev) => ({ ...prev, pageType: data.type, title: data.title || prev.title }));
                }
              }
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Context load error:', err);
      }
    };
    loadContext();
    return () => sub?.unsubscribe();
  }, [extractPageContent]);

  function detectType(url) {
    if (!url) return 'general';
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, '');
      const path = u.pathname + u.search;
      if ((host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') && (path.includes('/watch') || host === 'youtu.be' || path.includes('/embed'))) return 'youtube';
      if (u.pathname.toLowerCase().endsWith('.pdf') || u.search.toLowerCase().includes('.pdf')) return 'pdf';
      if (u.pathname.includes('/pdf/')) return 'pdf';
    } catch {}
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) return 'youtube';
    if (url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf')) return 'pdf';
    return 'article';
  }

  async function fetchPlan(token) {
    try {
      const planData = await apiRequest('/api/billing/status', { method: 'GET' }, token);
      if (planData) setUserPlan(planData);
    } catch (err) {
      console.warn('Plan fetch skipped:', err.message);
    }
  }

  const summarizePage = useCallback(async (force = false) => {
    const url = pageContext.url;
    if (!url) return;
    if (!force && url === lastSummarizedUrlRef.current && summaryData) return;
    if (!user) return;
    if (autoSummarizeRef.current) return;
    autoSummarizeRef.current = true;
    setLoading(true);
    setError(null);

    // Check local storage cache first (unless force refresh)
    if (!force && typeof chrome !== 'undefined' && chrome.storage?.local) {
      try {
        const cacheKey = `summary_${url}_${currentModel}`;
        const cached = await new Promise((res) => chrome.storage.local.get(cacheKey, (d) => res(d[cacheKey])));
        if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
          setSummaryData({ ...cached.data, cached: true });
          lastSummarizedUrlRef.current = url;
          setLoading(false);
          autoSummarizeRef.current = null;
          return;
        }
      } catch {}
    }

    try {
      const pageData = await extractPageContent();
      if (!pageData?.content) throw new Error('Could not extract page content. Please refresh the browser tab and try again.');
      setPageContent(pageData.content);
      setPageContext((prev) => ({ ...prev, pageType: pageData.type || prev.pageType, title: pageData.title || prev.title }));

      let token = demoSession?.access_token;
      if (!isDemoMode) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      }

      const data = await apiRequest(
        '/api/summarize',
        {
          method: 'POST',
          body: JSON.stringify({
            content: pageData.content || `YouTube video ID: ${pageData.videoId}`,
            pageType: pageData.type,
            title: pageData.title,
            url,
            model: currentModel,
            forceRefresh: force,
          }),
        },
        token
      );

      setSummaryData(data);
      lastSummarizedUrlRef.current = url;

      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        try {
          chrome.storage.local.set({ [`summary_${url}_${currentModel}`]: { data, timestamp: Date.now() } });
        } catch {}
      }

      fetchPlan(token);
    } catch (err) {
      console.error('Summarize failed:', err);
      if (err.upgrade) {
        setError({ upgrade: true, error: err.message, message: err.data?.message });
      } else {
        setError({ error: err.message || 'Failed to summarize' });
      }
    } finally {
      setLoading(false);
      autoSummarizeRef.current = null;
    }
  }, [pageContext.url, user, summaryData, extractPageContent, currentModel]);

  // Tab change listener
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;

    const handleActivated = async (activeInfo) => {
      try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab?.url && tab.url !== pageContext.url) {
          const newType = detectType(tab.url);
          setPageContext({ pageType: newType, url: tab.url, title: tab.title || 'Current Page' });
          setSummaryData(null);
          setPageContent('');
          setError(null);
          extractPageContent().then((data) => {
            if (data?.content) setPageContent(data.content);
          }).catch(() => {});
        }
      } catch {}
    };

    const handleUpdated = (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab?.url && tab.url !== pageContext.url) {
        const newType = detectType(tab.url);
        setPageContext({ pageType: newType, url: tab.url, title: tab.title || 'Current Page' });
        setSummaryData(null);
        setPageContent('');
        setError(null);
        extractPageContent().then((data) => {
          if (data?.content) setPageContent(data.content);
        }).catch(() => {});
      }
    };

    chrome.tabs.onActivated?.addListener(handleActivated);
    chrome.tabs.onUpdated?.addListener(handleUpdated);

    return () => {
      chrome.tabs.onActivated?.removeListener(handleActivated);
      chrome.tabs.onUpdated?.removeListener(handleUpdated);
    };
  }, [pageContext.url, extractPageContent]);

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} flex h-screen w-full flex-col overflow-hidden bg-background`}>
      <div className="flex h-full w-full flex-col bg-background text-foreground overflow-hidden">
        {/* Compact Combined Header (Logo + Page Context Badge + Model Selector + Theme + User) */}
        <Header
          user={user}
          userPlan={userPlan}
          theme={theme}
          onThemeToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onLoginClick={() => setLoginOpen(true)}
          pageContext={pageContext}
          currentModel={currentModel}
          onSelectModel={setCurrentModel}
          onLogout={async () => {
            if (!isDemoMode) await supabase.auth.signOut();
            setUser(isDemoMode ? demoUser : null);
            setUserPlan(isDemoMode ? { plan: 'free', daily_summaries: 0, daily_chats: 0 } : null);
            setSummaryData(null);
            setError(null);
            lastSummarizedUrlRef.current = '';
          }}
        />

        {/* Sleek Segmented Tab Bar */}
        <TabBar activeTab={activeTab} onChange={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden bg-background">
          <div className={activeTab === 'summary' ? 'h-full' : 'hidden h-full'} id="panel-summary" role="tabpanel" aria-labelledby="tab-summary">
            <SummaryTab
              data={summaryData}
              loading={loading}
              error={error}
              pageContext={pageContext}
              currentModel={currentModel}
              onRetry={() => summarizePage(true)}
            />
          </div>
          <div className={activeTab === 'chat' ? 'h-full' : 'hidden h-full'} id="panel-chat" role="tabpanel" aria-labelledby="tab-chat">
            <ChatTab
              pageContext={{ ...pageContext, content: pageContent }}
              summaryData={summaryData}
              user={user}
              onExtractContent={extractPageContent}
              currentModel={currentModel}
            />
          </div>
          <div className={activeTab === 'timeline' ? 'h-full' : 'hidden h-full'} id="panel-timeline" role="tabpanel" aria-labelledby="tab-timeline">
            <TimelineTab timestamps={summaryData?.timestamps} pageContext={pageContext} />
          </div>
          <div className={activeTab === 'tools' ? 'h-full' : 'hidden h-full'} id="panel-tools" role="tabpanel" aria-labelledby="tab-tools">
            <ToolsTab
              summaryData={summaryData}
              pageContext={pageContext}
              user={user}
              userPlan={userPlan}
              rawContent={pageContent}
              currentModel={currentModel}
            />
          </div>
          <div className={activeTab === 'keys' ? 'h-full' : 'hidden h-full'} id="panel-keys" role="tabpanel" aria-labelledby="tab-keys">
            <ApiKeysTab />
          </div>
        </main>

        <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={(u) => { setUser(u); setLoginOpen(false); }} />
      </div>
    </div>
  );
}
