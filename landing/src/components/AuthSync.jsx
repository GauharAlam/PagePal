import React, { useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/react';

/**
 * AuthSync Component
 * 
 * This component runs in the background of the landing page.
 * It monitors the Clerk authentication state and sends updates to the 
 * PagePal AI extension via window.postMessage.
 * 
 * After successful sign-in (when opened from the extension), it auto-closes
 * the tab to return the user to the extension.
 */
const AuthSync = () => {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const hasAutoClosedRef = useRef(false);

  useEffect(() => {
    const syncAuth = async () => {
      try {
        if (isSignedIn && user) {
          const token = await getToken();
          // Send to extension via window.postMessage
          // The content script will pick this up and forward it to the background/sidebar
          window.postMessage({
            type: 'CLERK_AUTH_UPDATE',
            user: {
              id: user.id,
              primaryEmailAddress: user.primaryEmailAddress,
              firstName: user.firstName,
              lastName: user.lastName,
              imageUrl: user.imageUrl,
            },
            token: token
          }, '*');
          console.log('[PagePal] Auth state synced to extension');

          // If this tab was opened from the extension (?sign_in=true),
          // auto-close it after syncing so the user returns to the sidebar
          const params = new URLSearchParams(window.location.search);
          if (params.get('sign_in') === 'true' && !hasAutoClosedRef.current) {
            hasAutoClosedRef.current = true;
            // Small delay to ensure the content script has time to relay the message
            setTimeout(() => {
              // Clean up the URL parameter and show a success message
              window.history.replaceState({}, '', '/');
            }, 1000);
          }
        } else if (!isSignedIn) {
          // Notify extension of logout
          window.postMessage({
            type: 'CLERK_AUTH_UPDATE',
            user: null,
            token: null
          }, '*');
        }
      } catch (err) {
        console.error('[PagePal] Auth sync error:', err);
      }
    };

    // Sync on mount and whenever user state changes
    syncAuth();
    
    // Also sync periodically to ensure token stays fresh
    const interval = setInterval(syncAuth, 1000 * 60 * 5); // every 5 mins
    
    // Listen for requests from the extension content script
    // (In case the content script injects after AuthSync has already mounted)
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'REQUEST_CLERK_AUTH') {
        console.log('[PagePal AuthSync] Received REQUEST_CLERK_AUTH, broadcasting state');
        syncAuth();
      }
    };
    window.addEventListener('message', handleMessage);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('message', handleMessage);
    };
  }, [isSignedIn, user, getToken]);

  return null; // This component doesn't render anything
};

export default AuthSync;
