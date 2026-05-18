'use client';

import { useState, type FormEvent } from 'react';
import Input from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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

  const title = settings.newsletter_title || 'Get craft stories and launch alerts';
  const subtitle =
    settings.newsletter_subtitle ||
    'Get early access to new handmade edits, limited drops, and styling notes from Kvastram.';

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
    <section className="kv-section bg-[var(--ds-accent-primary)] text-[var(--ds-text-inverse)]">
      <div className="kv-container">
        <div className="newsletter-form mx-auto max-w-[640px] text-center">
          <div className="kv-tag text-[var(--ds-text-inverse)]/70">Newsletter</div>
          <h2 className="kv-title">{title}</h2>
          <p className="text-[var(--ds-text-inverse)]/80">{subtitle}</p>

          {status === 'success' ? (
            <p className="mt-4 text-body-sm text-[var(--ds-text-inverse)]/90" role="status">
              {message}
            </p>
          ) : (
            <div className="newsletter-form">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="Email address"
                  containerClassName="flex-1"
                  disabled={status === 'loading'}
                  aria-label="Email address"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="md"
                  disabled={status === 'loading'}
                >
                  Subscribe
                </Button>
              </form>
            </div>
          )}

          {status === 'error' ? (
            <p className="mt-3 text-body-sm text-[var(--ds-text-inverse)]/80" role="alert">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

