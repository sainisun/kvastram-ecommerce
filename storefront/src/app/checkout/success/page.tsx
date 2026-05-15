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
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-white">
        <div className="relative mb-8">
          <Loader2 size={48} className="animate-spin text-stone-400" />
        </div>
        <h1 className="text-display-md font-serif text-stone-900 mb-2">
          Confirming Your Order...
        </h1>
        <p className="text-stone-500 type-light">
          Please wait while we confirm your payment.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-white">
        <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-8">
          <span className="text-display-xl">✕</span>
        </div>
        <h1 className="text-display-xl font-serif mb-4 text-stone-900">
          Payment Failed
        </h1>
        <p className="text-stone-500 mb-8 max-w-md type-light">
          {error || 'Something went wrong with your payment. Please try again.'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/checkout"
            className="bg-stone-900 text-white px-8 py-3 uppercase tracking-token-wider text-body-xs type-bold hover:bg-stone-800 transition-colors"
          >
            Try Again
          </Link>
          <Link
            href={storefrontTrust.policyRoutes.paymentHelp}
            className="border border-stone-300 px-8 py-3 uppercase tracking-token-wider text-body-xs type-bold text-stone-900 hover:bg-stone-50 transition-colors"
          >
            Payment Help
          </Link>
          <Link
            href={`${storefrontTrust.policyRoutes.contact}?order=${orderId || ''}`}
            className="border border-stone-300 px-8 py-3 uppercase tracking-token-wider text-body-xs type-bold text-stone-900 hover:bg-stone-50 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero success area */}
      <div className="border-b border-stone-100 bg-stone-50 px-6 py-12 text-center md:px-12 md:py-16 lg:px-20 lg:py-24">
        {/* Animated success ring */}
        <div className="relative inline-flex mb-8">
          <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle
              size={56}
              strokeWidth={1.5}
              className="text-green-600"
            />
          </div>
          {/* Ping ring */}
          <span className="absolute inset-0 rounded-full animate-ping bg-green-100 opacity-30" />
        </div>

        <span className="text-body-xs text-stone-500 type-bold uppercase tracking-token-wider block mb-3">
          Order Confirmed
        </span>
        <h1 className="text-display-xl md:text-display-xl font-serif text-stone-900 mb-4">
          Thank You!
        </h1>
        {orderId && (
          <p className="text-stone-500 type-light text-body-xl mb-2">
            Order reference:{' '}
            <span className="type-semibold text-stone-900">#{orderId}</span>
          </p>
        )}
        <p className="text-stone-400 text-body-sm max-w-md mx-auto">
          We&apos;re preparing your order with care. You&apos;ll receive an
          email confirmation shortly.
        </p>
      </div>

      {/* Steps / What&apos;s next */}
      <div className="mx-auto max-w-3xl px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <h2 className="text-display-sm font-serif text-stone-900 mb-8 text-center">
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
                  className="text-stone-600"
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
                  className="text-stone-600"
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
                  className="text-stone-600"
                />
              ),
              title: 'Shipped to You',
              desc: "You'll get a tracking number once your order is on its way.",
            },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-100 mb-4">
                {icon}
              </div>
              <p className="text-body-xs type-bold text-stone-400 uppercase tracking-token-wider mb-1">
                {step}
              </p>
              <h3 className="font-serif text-stone-900 mb-2">{title}</h3>
              <p className="text-body-sm text-stone-500 type-light">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link
            href="/"
            className="bg-stone-900 text-white px-10 py-4 uppercase tracking-token-wider text-body-xs type-bold hover:bg-stone-800 transition-colors text-center"
          >
            Continue Shopping
          </Link>
          <Link
            href="/track"
            className="border border-stone-300 text-stone-900 px-10 py-4 uppercase tracking-token-wider text-body-xs type-bold hover:bg-stone-50 transition-colors text-center"
          >
            Track My Order
          </Link>
        </div>

        {/* Support */}
        <div className="text-center border-t border-stone-100 pt-10">
          <p className="text-body-xs text-stone-500 mb-3 type-medium uppercase tracking-token-wider">
            Need help?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-body-sm">
            <a
              href={buildWhatsAppHref('Hi, I need help with my Kvastram order')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 type-bold text-green-700 hover:text-green-800 transition-colors"
            >
              <span className="text-body-md">💬</span> WhatsApp Support
            </a>
            <span className="hidden sm:block text-stone-300">|</span>
            <a
              href={`mailto:${storefrontTrust.supportEmail}`}
              className="inline-flex items-center gap-2 type-bold text-stone-700 hover:text-stone-900 transition-colors"
            >
              <span>✉️</span> Email Us
            </a>
            <span className="hidden sm:block text-stone-300">|</span>
            <Link
              href={storefrontTrust.policyRoutes.returns}
              className="inline-flex items-center gap-2 type-bold text-stone-700 hover:text-stone-900 transition-colors"
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
          <Loader2 size={32} className="animate-spin text-stone-400" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
