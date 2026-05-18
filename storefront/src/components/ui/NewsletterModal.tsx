'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

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

  return (
    <Modal
      isOpen={open}
      onClose={() => setOpen(false)}
      title="Get 15% off your first order"
      className="max-w-[520px]"
    >
      <div className="space-y-4">
        <div className="text-body-xs type-semibold  tracking-token-wider text-[var(--ds-text-muted)]">
          Welcome gift
        </div>
        <p className="text-body-sm leading-token-relaxed text-[var(--ds-text-secondary)]">
          Subscribe for artisan stories, launches, and a welcome discount code.
        </p>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          aria-label="Your name"
        />
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          aria-label="Email address"
        />
        <Button
          type="button"
          onClick={() => setOpen(false)}
          variant="secondary"
          size="lg"
          fullWidth
        >
          Claim Discount
        </Button>
        <Link
          href="/products"
          onClick={() => setOpen(false)}
          className="block w-full border border-[var(--ds-border-subtle)] px-6 py-4 text-center text-body-xs type-semibold  tracking-token-wider text-[var(--ds-text-primary)] transition-colors hover:border-[var(--ds-text-primary)]"
        >
          No Thanks
        </Link>
      </div>
    </Modal>
  );
}

