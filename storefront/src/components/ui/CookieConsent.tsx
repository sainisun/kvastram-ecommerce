'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';
import { ConsentManager } from '@/lib/consent-manager';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // only show banner when there is no stored consent
    const existing = ConsentManager.getConsent();
    if (!existing) {
      // delay a bit so it doesn't flash on first render
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    ConsentManager.acceptAll();
    setShowBanner(false);
    // reload page so any scripts depending on consent can initialize
    window.location.reload();
  };

  const handleRejectAll = () => {
    ConsentManager.rejectAll();
    setShowBanner(false);
  };

  if (!showBanner) return null;

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
                We value your privacy
              </p>
              <p className="text-xs text-stone-500 font-light mt-0.5 leading-relaxed">
                Choose which categories of cookies & tracking you allow.{' '}
                <Link
                  href="/privacy-policy"
                  className="text-stone-900 underline underline-offset-2 hover:text-amber-600 transition-colors"
                >
                  Learn more
                </Link>
              </p>
            </div>
          </div>
          <button
            onClick={handleRejectAll}
            aria-label="Dismiss"
            className="text-stone-400 hover:text-stone-700 transition-colors p-1 -mt-1 -mr-1 shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAcceptAll}
            className="flex-1 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest py-2.5 rounded-xl hover:bg-stone-700 transition-colors"
          >
            Accept All
          </button>
          <button
            onClick={handleRejectAll}
            className="flex-1 border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-widest py-2.5 rounded-xl hover:bg-stone-50 hover:border-stone-400 transition-colors"
          >
            Reject All
          </button>
          <Link
            href="/cookie-settings"
            className="flex-1 text-center text-stone-900 underline text-xs font-bold uppercase tracking-widest py-2.5 rounded-xl hover:text-amber-600 transition-colors"
          >
            Customize
          </Link>
        </div>
      </div>
    </div>
  );
}
