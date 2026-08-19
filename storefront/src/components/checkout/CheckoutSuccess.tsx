'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Heading } from '@/design-system';
import { buildWhatsAppHref } from '@/components/WhatsAppCTA';

interface CheckoutSuccessProps {
  orderId: string;
}

export default function CheckoutSuccess({ orderId }: CheckoutSuccessProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-surface-paper">
      <div className="relative w-24 h-24 mb-8">
        <div className="w-24 h-24 rounded-full bg-success-bg flex items-center justify-center animate-scale-in">
          <CheckCircle size={48} strokeWidth={1.5} className="text-success" />
        </div>
      </div>
      <span className="mb-3 block text-body-xs font-bold tracking-token-wider text-muted">
        Order Placed Successfully
      </span>
      <Heading role="page" className="mb-3 font-display text-display-xl text-primary">
        Thank You!
      </Heading>
      <p className="mb-2 max-w-md text-body-xl font-light text-muted">
        Your order <span className="font-semibold text-primary">#{orderId}</span> has been confirmed.
      </p>
      <p className="mb-10 max-w-md text-body-sm font-light text-muted">
        We&apos;re preparing your order for shipment. You&apos;ll receive an email confirmation shortly.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <Link
          href="/"
          className="bg-primary px-8 py-3 text-body-xs font-bold tracking-token-wider text-inverse transition-colors hover:bg-primary"
        >
          Continue Shopping
        </Link>
        <Link
          href="/account"
          className="border border-border-subtle px-8 py-3 text-body-xs font-bold tracking-token-wider text-primary transition-colors hover:bg-surface"
        >
          Track My Order
        </Link>
      </div>
      <div className="mt-4 w-full max-w-md border-t border-border-subtle pt-6">
        <p className="mb-3 text-body-xs text-muted">Need help with your order?</p>
        <a
          href={buildWhatsAppHref('Hi, I need help with checkout on Odhvica')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-body-xs text-success font-bold hover:text-success transition-colors"
        >
          <span className="text-body-md">💬</span> Chat with us on WhatsApp
        </a>
      </div>
    </div>
  );
}
