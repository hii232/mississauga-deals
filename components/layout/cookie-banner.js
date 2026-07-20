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
      aria-label="Cookie preferences"
      className="fixed bottom-0 left-0 right-0 z-[200] bg-white border-t border-gray-200 shadow-2xl animate-slideDown"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center gap-3 sm:gap-5 flex-wrap">
        <p className="flex-1 min-w-[200px] text-xs text-muted leading-snug">
          <span className="font-semibold text-navy">Cookies:</span> essential ones keep the site
          working; analytics (PIPEDA-compliant) are optional and need your consent.
        </p>
        <div className="flex gap-2 flex-shrink-0 ml-auto">
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
