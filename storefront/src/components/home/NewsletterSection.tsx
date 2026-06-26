'use client';

import { useState, type FormEvent } from 'react';
import Input from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { HomepageNewsletter } from '@/types/homepage';

export function NewsletterSection({
  settings,
}: {
  settings: HomepageNewsletter | null;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!settings) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to subscribe');
      setStatus('success');
      setMessage(data.message || 'Welcome to the Odhvica Circle.');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <section className="py-[clamp(80px,8vw,100px)] bg-[var(--ds-accent-primary)] text-[var(--ds-text-inverse)]" data-home-section="10-newsletter">
      <div className="homepage-container max-w-[720px] text-center">
        <p className="homepage-eyebrow text-[var(--ds-text-inverse)]">Newsletter</p>
        <h2 className="m-0 font-display text-display-lg font-[var(--ds-type-heading-weight)] leading-token-tight text-[var(--ds-text-inverse)]">{settings.title}</h2>
        <p className="mt-[var(--ds-space-sm)] mx-auto text-[rgba(var(--ds-white-rgb),0.82)]">{settings.subtitle}</p>
        <form onSubmit={submit} className="grid gap-[var(--ds-space-sm)] mt-[var(--ds-space-lg)] md:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            aria-label="Email address"
            required
            disabled={status === 'loading'}
          />
          <Button type="submit" variant="secondary" size="md" disabled={status === 'loading'}>
            {status === 'loading' ? 'Joining…' : 'Join the circle'}
          </Button>
        </form>
        {message ? (
          <p role={status === 'error' ? 'alert' : 'status'} className="mt-[var(--ds-space-sm)] text-[var(--ds-text-inverse)] text-body-sm">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
