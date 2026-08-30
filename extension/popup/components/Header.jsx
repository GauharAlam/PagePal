import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import ModelSelector from './ModelSelector';
import { apiRequest } from '../lib/api';

export default function Header({ user, userPlan, theme, onThemeToggle, onLoginClick, onLogout, pageContext, currentModel, onSelectModel }) {
  const [showMenu, setShowMenu] = useState(false);
  const plan = userPlan?.plan || 'free';
  const isPro = plan === 'pro';

  async function handleUpgrade() {
    setShowMenu(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const data = await apiRequest('/api/billing/create-checkout', { method: 'POST' }, session?.access_token);
      if (data?.url) window.open(data.url, '_blank');
    } catch (err) {
      console.warn('Upgrade checkout error:', err.message);
    }
  }

  const pageBadge = (pageContext?.pageType || 'page').toUpperCase();

  return (
    <header className="flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-2.5">
      {/* Left branding + Page Badge */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-primary text-xs font-black text-black shadow-hard-sm" aria-hidden>
          ◈
        </span>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-heading text-xs font-black leading-none tracking-tight">PagePal</span>
            <span className="rounded bg-black px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wider">
              {pageBadge}
            </span>
          </div>
          <span className="truncate text-[10px] text-muted-foreground font-medium" title={pageContext?.title}>
            {pageContext?.title || 'Active Tab'}
          </span>
        </div>
      </div>

      {/* Right Controls: Model Selector + Theme + User Profile */}
      <div className="flex items-center gap-1.5 shrink-0">
        <ModelSelector currentModel={currentModel} onSelectModel={onSelectModel} />

        <button
          onClick={onThemeToggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-xs transition-colors hover:bg-accent"
        >
          <span aria-hidden>{theme === 'dark' ? '☀' : '◐'}</span>
        </button>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="flex h-7 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-xs font-semibold shadow-xs hover:bg-accent"
              aria-expanded={showMenu}
            >
              <span className="max-w-[65px] truncate text-[11px]">
                {user.email?.split('@')[0] || 'User'}
              </span>
              <span className={`h-2 w-2 shrink-0 rounded-full ${isPro ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-9 z-50 w-60 animate-fade-in rounded-xl border-2 border-border bg-card p-1.5 shadow-hard">
                  <div className="flex flex-col gap-1 rounded-lg bg-muted/40 p-2.5">
                    <span className="truncate text-xs font-bold">{user.email}</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${isPro ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isPro ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                      {isPro ? 'Pro • Unlimited Access' : 'Free • 5 Daily Limits'}
                    </span>
                    {userPlan && (
                      <span className="text-[10px] text-muted-foreground">
                        {userPlan.daily_summaries}/5 summaries • {userPlan.daily_chats}/10 chats
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 pt-1.5">
                    {!isPro ? (
                      <Button size="sm" onClick={handleUpgrade} className="w-full justify-center rounded-full text-xs font-bold shadow-hard-sm">
                        Upgrade — $9/mo
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start rounded-lg text-xs font-bold"
                        onClick={async () => {
                          setShowMenu(false);
                          const { data: { session } } = await supabase.auth.getSession();
                          const d = await apiRequest('/api/billing/create-portal', { method: 'POST' }, session?.access_token);
                          if (d?.url) window.open(d.url, '_blank');
                        }}
                      >
                        Manage Billing
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowMenu(false);
                        onLogout();
                      }}
                      className="w-full justify-start rounded-lg text-xs text-destructive hover:bg-destructive/10 font-bold"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <Button size="sm" onClick={onLoginClick} className="h-7 rounded-full px-3 text-xs font-bold shadow-hard-sm">
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}
