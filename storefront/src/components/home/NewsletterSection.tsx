'use client';

import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <section className="kv-section bg-[var(--ds-accent-primary)] text-[var(--ds-text-inverse)] overflow-hidden">
      <div className="kv-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto max-w-[640px] text-center"
        >
          <div className="kv-tag text-[var(--ds-text-inverse)]/70">Newsletter</div>
          <h2 className="kv-title text-[var(--ds-text-inverse)] font-display text-3xl md:text-4xl">{title}</h2>
          <p className="text-[var(--ds-text-inverse)]/80 mt-3 text-sm md:text-base leading-relaxed">{subtitle}</p>

          <div className="mt-8 min-h-[80px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success-message"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full p-4 rounded-md bg-[rgba(var(--ds-white-rgb),0.1)] backdrop-blur-sm border border-[rgba(var(--ds-white-rgb),0.2)] text-center"
                >
                  <p className="text-sm font-semibold text-[var(--ds-text-inverse)]" role="status">
                    {message || 'Thank you for subscribing! ✨'}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="subscribe-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row w-full">
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      placeholder="Email address"
                      containerClassName="flex-1"
                      className="bg-[rgba(var(--ds-white-rgb),0.1)] border-[rgba(var(--ds-white-rgb),0.3)] text-[var(--ds-text-inverse)] placeholder-[rgba(var(--ds-white-rgb),0.6)] focus:bg-[rgba(var(--ds-white-rgb),0.2)] focus:border-[var(--ds-text-inverse)] focus:ring-0"
                      disabled={status === 'loading'}
                      aria-label="Email address"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      size="md"
                      className="border-[var(--ds-text-inverse)] text-[var(--ds-text-inverse)] hover:bg-[var(--ds-text-inverse)] hover:text-[var(--ds-accent-primary)] transition-all shrink-0 min-h-[48px]"
                      disabled={status === 'loading'}
                    >
                      {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
                    </Button>
                  </form>
                  
                  {status === 'error' && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 text-xs text-[rgba(var(--ds-white-rgb),0.9)] font-medium"
                      role="alert"
                    >
                      {message}
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
