'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';
import { ConsentManager } from '@/lib/consent-manager';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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
      className="fixed bottom-16 left-2 right-2 z-50 animate-fade-in-up md:bottom-6 md:left-auto md:right-6 md:max-w-md"
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <Card className="flex flex-col gap-2 p-3 shadow-xl md:gap-4 md:p-5 md:shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Cookie
              size={20}
              className="mt-0.5 shrink-0 text-[var(--ds-accent-gold)]"
            />
            <div>
              <p className="text-body-sm text-[var(--ds-text-primary)] type-semibold">
                We value your privacy
              </p>
              <p className="mt-0.5 hidden text-body-xs leading-token-relaxed text-[var(--ds-text-muted)] type-light sm:block">
                Choose which categories of cookies & tracking you allow.{' '}
                <Link
                  href="/pages/privacy-policy"
                  className="text-[var(--ds-text-primary)] underline underline-offset-2 transition-colors hover:text-[var(--ds-accent-primary)]"
                >
                  Learn more
                </Link>
              </p>
            </div>
          </div>
          <IconButton
            onClick={handleRejectAll}
            aria-label="Dismiss"
            size="sm"
            variant="ghost"
            className="-mr-1 -mt-1 shrink-0 text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)]"
          >
            <X size={16} />
          </IconButton>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAcceptAll}
            variant="secondary"
            size="sm"
            className="flex-1"
          >
            Accept All
          </Button>
          <Button
            onClick={handleRejectAll}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Reject All
          </Button>
          <Link
            href="/cookie-settings"
            className="flex-1 py-2.5 text-center text-body-xs  tracking-token-wider text-[var(--ds-text-primary)] underline transition-colors type-bold hover:text-[var(--ds-accent-primary)]"
          >
            Customize
          </Link>
        </div>
      </Card>
    </div>
  );
}

