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

  const title = settings.newsletter_title || 'Get craft stories and launch alerts';
  const subtitle =
    settings.newsletter_subtitle ||
    'A footer/newsletter section is useful, but popup frequency should be controlled.';

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
    <section className="kv-section" style={{ background: 'var(--sienna)', color: 'white' }}>
      <div className="kv-container">
        <div className="newsletter-form" style={{ maxWidth: 640, margin: 'auto', textAlign: 'center' }}>
          <div className="kv-tag" style={{ color: 'rgba(255,255,255,.72)' }}>Newsletter</div>
          <h2 className="kv-title">{title}</h2>
          <p style={{ color: 'rgba(255,255,255,.78)' }}>{subtitle}</p>

          {status === 'success' ? (
            <p className="mt-4 text-sm text-white/90" role="status">
              {message}
            </p>
          ) : (
            <div className="newsletter-form">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="Email address"
                  className="form-input flex-1"
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-md)',
                    background: 'white',
                    color: 'var(--ink)',
                    padding: '12px 13px',
                  }}
                  disabled={status === 'loading'}
                />
                <button
                  type="submit"
                  className="kv-btn kv-btn-white"
                  disabled={status === 'loading'}
                >
                  Subscribe
                </button>
              </form>
            </div>
          )}

          {status === 'error' ? (
            <p className="mt-3 text-sm text-white/80" role="alert">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
