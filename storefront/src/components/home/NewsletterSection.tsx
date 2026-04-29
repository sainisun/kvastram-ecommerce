'use client';

import { useState, type FormEvent } from 'react';

interface HomepageSettings {
  newsletter_title?: string | null;
  newsletter_subtitle?: string | null;
}

interface NewsletterSectionProps {
  settings: HomepageSettings;
}

export function NewsletterSection({ settings }: NewsletterSectionProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const hasCustomTitle = Boolean(settings.newsletter_title);
  const title = settings.newsletter_title || 'New pieces, every month.';
  const subtitle =
    settings.newsletter_subtitle ||
    'Each collection is small-batch and sells out fast. Get first access — plus 10% off your first order.';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Subscribed successfully');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to subscribe');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  return (
    <section className="bg-black py-12 text-white md:py-16 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 text-center md:px-12 lg:px-20">
        <div className="text-[11px] uppercase tracking-[0.25em] text-white/50">
          Newsletter
        </div>
        <h2 className="mt-4 font-heading text-[clamp(40px,4vw,72px)] font-medium leading-[0.96] tracking-[-0.03em] text-white">
          {hasCustomTitle ? (
            title
          ) : (
            <>
              New pieces, <em className="italic">every month.</em>
            </>
          )}
        </h2>
        <p className="mx-auto mt-4 max-w-[420px] text-[15px] leading-7 text-white/70">
          {subtitle}
        </p>

        {status === 'success' ? (
          <p className="mt-8 text-sm text-emerald-300" role="status">
            {message}
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-[480px] flex-col gap-4 sm:flex-row"
          >
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="Your email address"
              className="flex-1 border border-white/30 bg-transparent px-5 py-4 text-[14px] text-white outline-none placeholder:text-white/50 sm:border-r-0"
              disabled={status === 'loading'}
            />
            <button
              type="submit"
              className="border border-white bg-white px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-black transition-colors hover:bg-stone-200 disabled:opacity-60"
              disabled={status === 'loading'}
            >
              Subscribe
            </button>
          </form>
        )}

        {status === 'error' ? (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
