'use client';

import { useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';

import { api } from '@/lib/api';

export default function MerchantFeedsPage() {
  const [feeds, setFeeds] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await api.request('/merchant/feeds/health');
      setFeeds(response.data?.feeds || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merchant Feeds</h1>
          <p className="text-sm text-gray-500">Google, Pinterest, Meta, and TikTok feed health.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold">
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {['google', 'pinterest', 'meta', 'tiktok'].map((channel) => {
          const feed = feeds.find((item) => item.channel === channel || item.channel === `${channel}_xml`);
          return (
            <div key={channel} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{channel}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{String(feed?.product_count ?? 0)}</p>
              <p className="text-sm text-gray-500">products</p>
              <p className="mt-3 text-sm font-medium text-gray-700">Status: {String(feed?.status ?? 'unknown')}</p>
              <p className="mt-1 text-xs text-gray-400">{String(feed?.last_generated_at ?? 'Not generated yet')}</p>
              {Number(feed?.error_count || 0) > 0 ? (
                <p className="mt-2 text-xs text-red-600">{String(feed?.error_count)} errors</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading...</p> : null}
    </div>
  );
}
