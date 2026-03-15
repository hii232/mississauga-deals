'use client';

import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie_consent');
      if (!consent) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try { localStorage.setItem('cookie_consent', 'all'); } catch {}
    setVisible(false);
  };

  const handleDecline = () => {
    try { localStorage.setItem('cookie_consent', 'essential'); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-title"
      className="fixed bottom-0 left-0 right-0 z-[200] bg-white border-t border-gray-200 shadow-2xl animate-slideDown"
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-5 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <p id="cookie-title" className="text-sm font-semibold text-navy mb-1">Cookie Preferences</p>
          <p className="text-xs text-muted leading-relaxed">
            We use essential cookies for site functionality and analytics cookies to understand visitor
            behaviour (PIPEDA compliant). Non-essential cookies require your consent.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleDecline} className="btn-secondary !text-xs !px-4 !py-2">
            Essential Only
          </button>
          <button onClick={handleAccept} className="btn-primary !text-xs !px-4 !py-2">
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
