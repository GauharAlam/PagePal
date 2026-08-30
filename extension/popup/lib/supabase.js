import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const isDemoMode = !supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-project') || supabaseAnonKey.includes('placeholder') || supabaseAnonKey.includes('your_');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: {
      getItem: (key) => {
        return new Promise((resolve) => {
          chrome.storage.local.get(key, (result) => {
            resolve(result[key] || null);
          });
        });
      },
      setItem: (key, value) => {
        return new Promise((resolve) => {
          chrome.storage.local.set({ [key]: value }, resolve);
        });
      },
      removeItem: (key) => {
        return new Promise((resolve) => {
          chrome.storage.local.remove(key, resolve);
        });
      },
    },
  },
});

// Demo mock helpers — used when isDemoMode true
export const demoUser = isDemoMode ? { id: 'demo-user-id', email: 'demo@pagepal.ai', user_metadata: { avatar_url: null } } : null;
export const demoSession = isDemoMode ? { access_token: 'demo-token', user: demoUser } : null;
