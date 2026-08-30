import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const isDemoMode = !supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-project') || supabaseAnonKey.includes('placeholder') || supabaseAnonKey.includes('your_');

// Storage adapter: prefer chrome.storage.session (in-memory, clears on browser close)
// fallback to chrome.storage.local or window.localStorage
const customStorage = {
  getItem: (key) => {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage?.session) {
          chrome.storage.session.get(key, (res) => {
            if (res && res[key]) return resolve(res[key]);
            // Fallback check in local if migrating
            if (chrome.storage.local) {
              chrome.storage.local.get(key, (localRes) => {
                resolve(localRes?.[key] || null);
              });
            } else {
              resolve(null);
            }
          });
        } else if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.get(key, (result) => {
            resolve(result?.[key] || null);
          });
        } else if (typeof window !== 'undefined' && window.localStorage) {
          resolve(window.localStorage.getItem(key));
        } else {
          resolve(null);
        }
      } catch (err) {
        console.warn('Storage read failed:', err);
        resolve(null);
      }
    });
  },
  setItem: (key, value) => {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage?.session) {
          chrome.storage.session.set({ [key]: value }, resolve);
        } else if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.set({ [key]: value }, resolve);
        } else if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
          resolve();
        } else {
          resolve();
        }
      } catch (err) {
        console.warn('Storage write failed:', err);
        resolve();
      }
    });
  },
  removeItem: (key) => {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage?.session) {
          chrome.storage.session.remove(key, () => {
            if (chrome.storage.local) {
              chrome.storage.local.remove(key, resolve);
            } else {
              resolve();
            }
          });
        } else if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.remove(key, resolve);
        } else if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
          resolve();
        } else {
          resolve();
        }
      } catch (err) {
        console.warn('Storage remove failed:', err);
        resolve();
      }
    });
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: customStorage,
  },
});

// Demo mock helpers — used when isDemoMode true
export const demoUser = isDemoMode ? { id: 'demo-user-id', email: 'demo@pagepal.ai', user_metadata: { avatar_url: null } } : null;
export const demoSession = isDemoMode ? { access_token: 'demo-token', user: demoUser } : null;
