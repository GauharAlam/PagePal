import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';

export default function Header({ user, userPlan, theme, onThemeToggle, onLoginClick, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);
  const plan = userPlan?.plan || 'free';
  const isPro = plan === 'pro';

  async function handleUpgrade() {
    setShowMenu(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_PROXY_URL}/api/billing/create-checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
    } catch {}
  }

  return (
    <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-3 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-primary text-xs font-bold shadow-hard-sm" aria-hidden>◈</span>
        <div className="flex flex-col">
          <span className="font-heading text-sm font-bold leading-none tracking-tight">PagePal</span>
          <span className="text-[11px] font-medium text-muted-foreground">AI Co-pilot</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onThemeToggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className="h-8 w-8 rounded-full">
          <span className="text-[14px] leading-none" aria-hidden>{theme === 'dark' ? '☀' : '◐'}</span>
        </Button>

        {user ? (
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowMenu((v) => !v)} className="h-8 gap-2 rounded-full px-3" aria-expanded={showMenu} aria-haspopup="menu">
              <span className="max-w-[90px] truncate text-xs font-medium">{user.email?.split('@')[0] || 'Account'}</span>
              <span className={`h-2 w-2 shrink-0 rounded-full ${isPro ? 'bg-success' : 'bg-muted-foreground'}`} aria-hidden />
            </Button>

            {showMenu && (
              <div className="absolute right-0 top-10 z-50 w-64 animate-fade-in rounded-xl border border-border bg-card p-1 shadow-hard">
                <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
                  <span className="truncate text-xs font-semibold">{user.email}</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isPro ? 'text-success' : 'text-muted-foreground'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isPro ? 'bg-success' : 'bg-muted-foreground'}`} />{isPro ? 'Pro • Unlimited' : 'Free • Limited'}
                  </span>
                  {userPlan && <span className="text-[11px] leading-4 text-muted-foreground">{userPlan.daily_summaries}/5 summaries • {userPlan.daily_chats}/10 chats today</span>}
                </div>
                <div className="flex flex-col gap-1 p-1 pt-2">
                  {!isPro ? (
                    <Button size="sm" onClick={handleUpgrade} className="w-full justify-center rounded-full shadow-hard-sm">
                      Upgrade to Pro — $9/mo
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start rounded-lg"
                      onClick={async () => {
                        setShowMenu(false);
                        const { data: { session } } = await supabase.auth.getSession();
                        const r = await fetch(`${import.meta.env.VITE_PROXY_URL}/api/billing/create-portal`, { method: 'POST', headers: { Authorization: `Bearer ${session?.access_token}` } });
                        const d = await r.json();
                        if (d.url) window.open(d.url, '_blank');
                      }}
                    >
                      Manage billing
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => { setShowMenu(false); onLogout(); }} className="w-full justify-start rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive">
                    Sign out
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Button size="sm" onClick={onLoginClick} className="rounded-full px-4 shadow-hard-sm">
            Sign in
          </Button>
        )}
      </div>

      {showMenu && <button className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowMenu(false)} aria-label="Close menu" tabIndex={-1} />}
    </header>
  );
}
