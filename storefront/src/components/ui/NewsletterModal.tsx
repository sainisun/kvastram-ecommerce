'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

export function NewsletterModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (window.localStorage.getItem('kvastram-newsletter-modal-seen')) return;

    const onScroll = () => {
      if (window.scrollY <= 650) return;
      window.localStorage.setItem('kvastram-newsletter-modal-seen', 'true');
      window.setTimeout(() => setOpen(true), 350);
      window.removeEventListener('scroll', onScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/45 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Newsletter signup"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-[520px] border border-stone-200 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h3 className="font-heading text-[24px] leading-none text-stone-950">
            Get 15% off your first order
          </h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full bg-stone-100 text-stone-700 transition hover:bg-stone-900 hover:text-white"
            aria-label="Close newsletter modal"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
            Welcome gift
          </div>
          <p className="text-[14px] leading-7 text-stone-600">
            Subscribe for artisan stories, launches, and a welcome discount code.
          </p>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full border border-stone-200 px-4 py-3 outline-none transition focus:border-stone-900"
            placeholder="Your name"
          />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full border border-stone-200 px-4 py-3 outline-none transition focus:border-stone-900"
            placeholder="Email address"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full bg-stone-950 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-stone-800"
          >
            Claim Discount
          </button>
          <Link
            href="/products"
            onClick={() => setOpen(false)}
            className="block w-full border border-stone-200 px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-950 transition hover:border-stone-900"
          >
            No Thanks
          </Link>
        </div>
      </div>
    </div>
  );
}
