'use client';

import { useState } from 'react';
import { Mail, Bell, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface BackInStockProps {
  readonly productId: string;
  readonly variantId?: string;
  readonly productTitle: string;
}

export function BackInStock({
  productId,
  variantId,
  productTitle,
}: BackInStockProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.subscribeBackInStock({
        product_id: productId,
        email,
        variant_id: variantId,
      });

      setSubscribed(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to subscribe. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="bg-green-50 border border-green-200 p-4 rounded-sm">
        <div className="flex items-center gap-3 text-green-800">
          <CheckCircle size={20} />
          <div>
            <p className="back-in-stock-title">You&apos;re on the list!</p>
            <p className="back-in-stock-success-copy mt-1">
              We&apos;ll notify you when {productTitle} is back in stock.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-stone-600">
        <Bell size={18} />
        <span className="back-in-stock-title">Notify me when available</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="input-field w-full border border-stone-200 py-3 pl-10 pr-4 focus:border-stone-900 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary-typography w-full bg-stone-900 px-4 py-3 transition-colors hover:bg-stone-800 disabled:opacity-50 sm:w-auto"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin mx-auto" />
            ) : (
              'Notify Me'
            )}
          </button>
        </div>
        {error && <p className="input-error-message">{error}</p>}
        <p className="input-helper-text">
          We&apos;ll email you when this item is back in stock.
        </p>
      </form>
    </div>
  );
}
