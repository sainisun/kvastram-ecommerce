'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';

const COOKIE_KEY = 'kv_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Delay so it doesn't flash on first render
    const timer = setTimeout(() => {
      try {
        const consent = localStorage.getItem(COOKIE_KEY);
        if (!consent) setVisible(true);
      } catch {
        /* SSR safe */
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-fade-in-up"
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <div className="bg-white border border-stone-200 shadow-2xl rounded-2xl p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Cookie size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-stone-900 text-sm">
                We use cookies 🍪
              </p>
              <p className="text-xs text-stone-500 font-light mt-0.5 leading-relaxed">
                We use cookies to enhance your browsing experience, serve
                personalized ads, and analyse our traffic.{' '}
                <Link
                  href="/pages/cookie-policy"
                  className="text-stone-900 underline underline-offset-2 hover:text-amber-600 transition-colors"
                >
                  Learn more
                </Link>
              </p>
            </div>
          </div>
          <button
            onClick={decline}
            aria-label="Dismiss"
            className="text-stone-400 hover:text-stone-700 transition-colors p-1 -mt-1 -mr-1 shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={accept}
            className="flex-1 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest py-2.5 rounded-xl hover:bg-stone-700 transition-colors"
          >
            Accept All
          </button>
          <button
            onClick={decline}
            className="flex-1 border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-widest py-2.5 rounded-xl hover:bg-stone-50 hover:border-stone-400 transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
