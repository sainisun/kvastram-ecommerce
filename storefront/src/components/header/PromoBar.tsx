'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

const MESSAGES = [
  'Handmade in Jaipur, Rajasthan',
  'Free shipping above ₹2,000',
  'WhatsApp for custom orders',
];
const SESSION_KEY = 'kv_promobar_dismissed';

interface PromoBarProps {
  isSticky: boolean;
}

export function PromoBar({ isSticky }: PromoBarProps) {
  const [dismissed, setDismissed] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') setDismissed(true);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), 3500);
    return () => clearInterval(t);
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem(SESSION_KEY, '1');
  }, []);

  if (dismissed || isSticky) return null;

  return (
    <div className="h-8 bg-[#1a1714] flex items-center justify-center px-6 relative">
      <p className="text-[#b5b0a8] text-[11px] uppercase tracking-[0.12em] font-light select-none">
        {MESSAGES.map((msg, i) => (
          <span
            key={msg}
            className={`transition-opacity duration-500 ${i === msgIdx ? 'opacity-100' : 'opacity-0 absolute'}`}
          >
            {i > 0 && i === msgIdx && (
              <span className="mx-4 text-[#3d3a36]">·</span>
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
