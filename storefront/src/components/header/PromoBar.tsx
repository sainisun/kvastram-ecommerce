'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Facebook,
  Instagram,
  MessageCircle,
  X,
} from 'lucide-react';
import { buildWhatsAppHref } from '@/components/WhatsAppCTA';

const MESSAGES = [
  'Handmade in Jaipur, Rajasthan',
  'Free shipping above ₹2,000',
  'WhatsApp for custom orders',
];
const SESSION_KEY = 'kv_promobar_dismissed';

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/kvastram',
    icon: Instagram,
  },
  {
    label: 'WhatsApp',
    href: buildWhatsAppHref('Hi, I need help from Kvastram'),
    icon: MessageCircle,
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/kvastram',
    icon: Facebook,
  },
];

interface PromoBarProps {
  isSticky: boolean;
}

export function PromoBar({ isSticky }: PromoBarProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(SESSION_KEY) === '1';
  });
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setMsgIdx((i) => (i + 1) % MESSAGES.length),
      3500
    );
    return () => clearInterval(t);
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem(SESSION_KEY, '1');
  }, []);

  const goToPrevious = useCallback(() => {
    setMsgIdx((i) => (i - 1 + MESSAGES.length) % MESSAGES.length);
  }, []);

  const goToNext = useCallback(() => {
    setMsgIdx((i) => (i + 1) % MESSAGES.length);
  }, []);

  if (dismissed || isSticky) return null;

  return (
    <div className="kv-page-frame relative flex h-8 items-center justify-center bg-[#1a1714] px-6 md:mx-auto md:h-10 md:w-full md:max-w-[1440px] md:rounded-[999px] md:bg-[#f3b6c8] md:px-6 md:shadow-[0_10px_24px_rgba(142,73,96,0.12)]">
      <div className="absolute left-5 hidden items-center gap-2 md:flex">
        {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#5d2636] transition-colors hover:bg-white/35 hover:text-[#1a1714] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7e2f46]"
          >
            <Icon size={15} strokeWidth={1.7} />
          </a>
        ))}
      </div>

      {MESSAGES.length > 1 && (
        <div className="absolute right-4 hidden items-center gap-1 md:flex">
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Previous announcement"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#5d2636] transition-colors hover:bg-white/35 hover:text-[#1a1714] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7e2f46]"
          >
            <ChevronLeft size={16} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={goToNext}
            aria-label="Next announcement"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#5d2636] transition-colors hover:bg-white/35 hover:text-[#1a1714] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7e2f46]"
          >
            <ChevronRight size={16} strokeWidth={1.8} />
          </button>
        </div>
      )}

      <p className="text-[11px] font-light uppercase tracking-[0.12em] text-[#b5b0a8] select-none md:max-w-[60%] md:text-center md:font-medium md:text-[#5d2636]">
        {MESSAGES.map((msg, i) => (
          <span
            key={msg}
            className={`transition-opacity duration-500 ${
              i === msgIdx ? 'opacity-100' : 'absolute opacity-0'
            }`}
          >
            {i > 0 && i === msgIdx && (
              <span className="mx-4 text-[#3d3a36] md:hidden">.</span>
            )}
            {msg}
          </span>
        ))}
      </p>
      <button
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7a7570] hover:text-[#b5b0a8] md:hidden"
        aria-label="Dismiss"
      >
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  );
}
