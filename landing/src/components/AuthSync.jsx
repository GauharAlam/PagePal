import React, { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/react';

/**
 * AuthSync Component
 * 
 * This component runs in the background of the landing page.
 * It monitors the Clerk authentication state and sends updates to the 
 * PagePal AI extension via window.postMessage.
 */
const AuthSync = () => {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

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
    
    return () => clearInterval(interval);
  }, [isSignedIn, user, getToken]);

  return null; // This component doesn't render anything
};

export default AuthSync;
