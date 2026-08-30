import { useState, useEffect } from 'react';
import { supabase, isDemoMode } from '../lib/supabase';
import { Button } from './ui/button';

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  function validate() {
    const next = {};
    if (!email) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Password is required';
    else if (password.length < 6) next.password = 'At least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleGoogle() {
    setFormError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: typeof chrome !== 'undefined' && chrome.identity ? chrome.identity.getRedirectURL() : window.location.origin },
      });
      if (error) setFormError(error.message);
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function handleEmailAuth() {
    if (!validate()) return;
    setLoading(true);
    setFormError('');
    try {
      const result = mode === 'signin' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
      if (result.error) throw result.error;
      onSuccess(result.data.user);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // trap Esc to close & reset form on close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) { setErrors({}); setFormError(''); }
  }, [isOpen]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="w-[320px] rounded-2xl border border-border bg-card p-5 shadow-hard">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="login-title" className="font-heading text-sm font-bold">{mode === 'signin' ? 'Sign in' : 'Create account'}</h2>
            <p className="mt-1 text-xs leading-4 text-muted-foreground">Use the same account on landing and extension.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog" className="h-7 w-7 rounded-full">✕</Button>
        </div>

        {isDemoMode && <div className="mt-3 rounded-xl border border-border bg-muted px-3 py-2 text-xs leading-4 text-muted-foreground">Demo mode: sign-in is bypassed. You are already signed in as demo@pagepal.ai</div>}

        <div className="mt-4 flex flex-col gap-4">
          <Button variant="outline" onClick={handleGoogle} disabled={loading || isDemoMode} className="w-full">
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="login-email" className="text-xs font-medium">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={validate}
                placeholder="you@example.com"
                className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
              />
              {errors.email && <span id="login-email-error" className="text-xs font-medium text-destructive">{errors.email}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="login-password" className="text-xs font-medium">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={validate}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                placeholder="••••••••"
                className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
              />
              {errors.password && <span id="login-password-error" className="text-xs font-medium text-destructive">{errors.password}</span>}
            </div>
          </div>

          {formError && <div className="rounded-xl border border-destructive bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive" role="alert">{formError}</div>}

          <Button onClick={handleEmailAuth} disabled={loading} className="w-full rounded-full shadow-hard-sm">
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode((m) => (m === 'signin' ? 'signup' : 'signin')); setFormError(''); setErrors({}); }} className="font-medium text-foreground underline underline-offset-4">
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
