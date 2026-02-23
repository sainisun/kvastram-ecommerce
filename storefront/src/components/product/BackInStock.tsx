'use client';

import { useState } from 'react';
import { Mail, Bell, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface BackInStockProps {
  productId: string;
  variantId?: string;
  productTitle: string;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.subscribeBackInStock(productId, email, variantId);
      setSubscribed(true);
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe. Please try again.');
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
            <p className="font-medium text-sm">You're on the list!</p>
            <p className="text-xs text-green-700 mt-1">
              We'll notify you when {productTitle} is back in stock.
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
        <span className="text-sm font-medium">Notify me when available</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
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
              className="w-full pl-10 pr-4 py-3 border border-stone-200 text-sm focus:outline-none focus:border-stone-900"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-3 bg-stone-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              'Notify Me'
            )}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <p className="text-[10px] text-stone-400">
          We'll email you when this item is back in stock.
        </p>
      </form>
    </div>
  );
}
