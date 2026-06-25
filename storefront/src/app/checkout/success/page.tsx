'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Loader2,
  ShoppingBag,
  ArrowRight,
  HeartHandshake,
} from 'lucide-react';
import { api } from '@/lib/api';
import { buildWhatsAppHref } from '@/components/WhatsAppCTA';
import { storefrontTrust } from '@/config/storefront-trust';
import { EmptyState } from '@/components/ui/EmptyState';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setTimeout(() => {
        setStatus('error');
        setError('No order ID provided');
      }, 0);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await api.checkPaymentStatus(orderId);
        if (res.payment_status === 'captured') {
          setStatus('success');
        } else if (res.payment_status === 'failed') {
          setStatus('error');
          setError('Payment failed. Please try again.');
        }
      } catch {
        console.error('Error checking status');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (status === 'loading') {
        setStatus('success');
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [orderId, status]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ds-surface-paper)] p-4">
        <EmptyState
          icon={<Loader2 size={48} className="animate-spin" />}
          title="Confirming Your Order..."
          description="Please wait while we confirm your payment."
          className="border-0"
        />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ds-surface-paper)] p-4">
        <EmptyState
          title="Payment Failed"
          description={
            error || 'Something went wrong with your payment. Please try again.'
          }
          className="max-w-2xl border-0"
          actions={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/checkout"
                className="bg-[var(--ds-text-primary)] px-8 py-3 text-body-xs  tracking-token-wider text-[var(--ds-text-inverse)] type-bold transition-colors hover:bg-[var(--ds-text-secondary)]"
              >
                Try Again
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.paymentHelp}
                className="border border-[var(--ds-border-strong)] px-8 py-3 text-body-xs  tracking-token-wider text-[var(--ds-text-primary)] type-bold transition-colors hover:bg-[var(--ds-surface-parchment)]"
              >
                Payment Help
              </Link>
              <Link
                href={`${storefrontTrust.policyRoutes.contact}?order=${orderId || ''}`}
                className="border border-[var(--ds-border-strong)] px-8 py-3 text-body-xs  tracking-token-wider text-[var(--ds-text-primary)] type-bold transition-colors hover:bg-[var(--ds-surface-parchment)]"
              >
                Contact Support
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ds-surface-paper)]">
      {/* Hero success area */}
      <div className="kv-page-gutter border-b border-[var(--ds-border-subtle)] bg-[var(--ds-surface-parchment)] px-6 py-12 text-center md:px-12 md:py-16 lg:px-20 lg:py-24">
        {/* Animated success ring */}
        <div className="relative inline-flex mb-8">
          <div className="w-28 h-28 rounded-full bg-[var(--ds-success-bg)] flex items-center justify-center">
            <CheckCircle
              size={56}
              strokeWidth={1.5}
              className="text-[var(--ds-success)]"
            />
          </div>
          {/* Ping ring */}
          <span className="absolute inset-0 rounded-full animate-ping bg-[var(--ds-success-bg)] opacity-30" />
        </div>

        <span className="text-body-xs text-[var(--ds-text-muted)] type-bold  tracking-token-wider block mb-3">
          Order Confirmed
        </span>
        <h1 className="text-display-xl md:text-display-xl font-display text-[var(--ds-text-primary)] mb-4">
          Thank You!
        </h1>
        {orderId && (
          <p className="text-[var(--ds-text-muted)] type-light text-body-xl mb-2">
            Order reference:{' '}
            <span className="type-semibold text-[var(--ds-text-primary)]">#{orderId}</span>
          </p>
        )}
        <p className="text-[var(--ds-text-muted)] text-body-sm max-w-md mx-auto">
          We&apos;re preparing your order with care. You&apos;ll receive an
          email confirmation shortly.
        </p>
      </div>

      {/* Steps / What&apos;s next */}
      <div className="mx-auto max-w-3xl px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <h2 className="text-display-sm font-display text-[var(--ds-text-primary)] mb-8 text-center">
          What Happens Next?
        </h2>
        <div className="mb-12 grid gap-8 md:mb-16 md:grid-cols-3 md:gap-12">
          {[
            {
              step: '01',
              icon: (
                <HeartHandshake
                  size={28}
                  strokeWidth={1.5}
                  className="text-[var(--ds-text-secondary)]"
                />
              ),
              title: 'Order Processing',
              desc: 'Our artisans will begin preparing your order within 24 hours.',
            },
            {
              step: '02',
              icon: (
                <ShoppingBag
                  size={28}
                  strokeWidth={1.5}
                  className="text-[var(--ds-text-secondary)]"
                />
              ),
              title: 'Carefully Packed',
              desc: 'Each piece is individually wrapped and packed in our signature box.',
            },
            {
              step: '03',
              icon: (
                <ArrowRight
                  size={28}
                  strokeWidth={1.5}
                  className="text-[var(--ds-text-secondary)]"
                />
              ),
              title: 'Shipped to You',
              desc: "You'll get a tracking number once your order is on its way.",
            },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--ds-surface-soft)] mb-4">
                {icon}
              </div>
              <p className="text-body-xs type-bold text-[var(--ds-text-muted)]  tracking-token-wider mb-1">
                {step}
              </p>
              <h3 className="font-display text-[var(--ds-text-primary)] mb-2">{title}</h3>
              <p className="text-body-sm text-[var(--ds-text-muted)] type-light">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link
            href="/"
            className="bg-[var(--ds-text-primary)] text-[var(--ds-text-inverse)] px-10 py-4  tracking-token-wider text-body-xs type-bold hover:bg-[var(--ds-text-secondary)] transition-colors text-center"
          >
            Continue Shopping
          </Link>
          <Link
            href="/track"
            className="border border-[var(--ds-border-strong)] text-[var(--ds-text-primary)] px-10 py-4  tracking-token-wider text-body-xs type-bold hover:bg-[var(--ds-surface-parchment)] transition-colors text-center"
          >
            Track My Order
          </Link>
        </div>

        {/* Support */}
        <div className="text-center border-t border-[var(--ds-border-subtle)] pt-10">
          <p className="text-body-xs text-[var(--ds-text-muted)] mb-3 type-medium  tracking-token-wider">
            Need help?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-body-sm">
            <a
              href={buildWhatsAppHref('Hi, I need help with my Odhvica order')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 type-bold text-[var(--ds-success-text)] hover:text-[var(--ds-success-text)] transition-colors"
            >
              <span className="text-body-md">💬</span> WhatsApp Support
            </a>
            <span className="hidden sm:block text-[var(--ds-text-disabled)]">|</span>
            <a
              href={`mailto:${storefrontTrust.supportEmail}`}
              className="inline-flex items-center gap-2 type-bold text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors"
            >
              <span>✉️</span> Email Us
            </a>
            <span className="hidden sm:block text-[var(--ds-text-disabled)]">|</span>
            <Link
              href={storefrontTrust.policyRoutes.returns}
              className="inline-flex items-center gap-2 type-bold text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors"
            >
              Returns Help
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[var(--ds-text-muted)]" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
