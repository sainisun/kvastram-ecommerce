'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

export default function GscDashboardPage() {
  const [opportunities, setOpportunities] = useState<Array<Record<string, unknown>>>([]);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.request('/seo/gsc/performance')
      .then((response) => {
        setOpportunities(response.data?.opportunities || []);
        setRows(response.data?.rows || []);
      })
      .catch(() => {
        setOpportunities([]);
        setRows([]);
      });
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">GSC Performance</h1>
        <p className="text-sm text-gray-500">CTR opportunities and recent Search Console rows.</p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">CTR Optimization Targets</h2>
        <div className="mt-4 divide-y divide-gray-100">
          {opportunities.slice(0, 20).map((row, index) => (
            <div key={`${row.page}-${index}`} className="py-3">
              <p className="text-sm font-medium text-gray-900">{String(row.page)}</p>
              <p className="text-xs text-gray-500">
                {String(row.impressions || 0)} impressions - CTR {Number(row.avg_ctr || 0).toFixed(3)} - position {Number(row.avg_position || 0).toFixed(1)}
              </p>
            </div>
          ))}
          {opportunities.length === 0 ? <p className="text-sm text-gray-500">No GSC opportunity data yet.</p> : null}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Recent Rows</h2>
        <p className="mt-2 text-sm text-gray-500">{rows.length} rows loaded from the latest sync.</p>
      </section>
    </div>
  );
}
