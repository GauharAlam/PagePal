import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * AuthSync — now Supabase-based
 * Syncs auth state to extension via window.postMessage (same channel as before
 * but with Supabase payload). Extension content_script can listen for SUPABASE_AUTH_UPDATE.
 */
export default function AuthSync() {
  const hasAutoClosedRef = useRef(false);

  useEffect(() => {
    const sync = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      window.postMessage({
        type: 'SUPABASE_AUTH_UPDATE',
        user: user ? { id: user.id, email: user.email, user_metadata: user.user_metadata } : null,
        token: session?.access_token || null,
      }, '*');

      const params = new URLSearchParams(window.location.search);
      if (params.get('sign_in') === 'true' && user && !hasAutoClosedRef.current) {
        hasAutoClosedRef.current = true;
        setTimeout(() => {
          document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-family:sans-serif;font-size:20px;">Successfully logged in! You can close this tab.</div>';
          window.close();
          window.history.replaceState({}, '', '/');
        }, 800);
      }
      if (!user) {
        window.postMessage({ type: 'SUPABASE_AUTH_UPDATE', user: null, token: null }, '*');
      }
    };

    sync();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => sync());
    const interval = setInterval(sync, 1000 * 60 * 5);
    const handleMessage = (e) => {
      if (e.data?.type === 'REQUEST_SUPABASE_AUTH') sync();
    };
    window.addEventListener('message', handleMessage);
    return () => {
      subscription?.unsubscribe();
      clearInterval(interval);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return null;
}
