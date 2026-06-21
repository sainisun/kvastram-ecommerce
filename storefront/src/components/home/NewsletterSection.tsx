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
      setMessage(data.message || 'Welcome to the Kvastram Circle.');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <section className="homepage-newsletter" data-home-section="9-newsletter">
      <div className="homepage-container homepage-newsletter-inner">
        <p className="homepage-eyebrow">Newsletter</p>
        <h2>{settings.title}</h2>
        <p>{settings.subtitle}</p>
        <form onSubmit={submit}>
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
          <p role={status === 'error' ? 'alert' : 'status'} className="homepage-newsletter-status">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
