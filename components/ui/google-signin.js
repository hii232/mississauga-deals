'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Google Sign-In button using Google Identity Services (GSI).
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID env var.
 *
 * On success: decodes the JWT credential, posts lead to /api/lead,
 * sets localStorage, and calls onSuccess with user info.
 */
export function GoogleSignIn({ onSuccess, onError }) {
  const btnRef = useRef(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = useCallback(
    async (response) => {
      try {
        // Decode the JWT payload (base64url → JSON)
        const payload = JSON.parse(
          atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
        );

        const userData = {
          name: payload.name || '',
          email: payload.email || '',
          picture: payload.picture || '',
        };

        // Capture the lead
        await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: userData.name,
            email: userData.email,
            source: 'google-signin',
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});

        // Mark as registered
        localStorage.setItem('user_registered', 'true');
        localStorage.setItem('user_name', userData.name);
        localStorage.setItem('user_email', userData.email);

        onSuccess?.(userData);
      } catch {
        onError?.('Failed to process Google sign-in.');
      }
    },
    [onSuccess, onError]
  );

  useEffect(() => {
    if (!clientId) return;

    // Load GSI script if not already loaded
    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogle();
      document.head.appendChild(script);
    } else if (window.google?.accounts) {
      initGoogle();
    }

    function initGoogle() {
      if (!window.google?.accounts || !btnRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(btnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: btnRef.current.offsetWidth || 320,
      });
    }
  }, [clientId, handleCredentialResponse]);

  // If no client ID configured, show a disabled placeholder
  if (!clientId) {
    return (
      <button
        disabled
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#ccc" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ccc" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#ccc" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ccc" />
        </svg>
        Google Sign-In not configured
      </button>
    );
  }

  return <div ref={btnRef} className="w-full" />;
}
