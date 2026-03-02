'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  Trash2,
  CheckCircle,
  Clock,
  RefreshCw,
  Package,
} from 'lucide-react';

interface Subscription {
  id: string;
  email: string;
  product_id: string;
  product_title: string | null;
  product_handle: string | null;
  product_thumbnail: string | null;
  notified: boolean;
  notified_at: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  pending: number;
  notified: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function BackInStockPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    notified: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'notified'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      let notifiedParam = '';
      if (filter === 'pending') notifiedParam = 'false';
      else if (filter === 'notified') notifiedParam = 'true';
      const url = notifiedParam
        ? `/api/admin/back-in-stock?notified=${notifiedParam}`
        : '/api/admin/back-in-stock';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setStats(data.stats || { total: 0, pending: 0, notified: 0 });
    } catch (err) {
      console.error('Failed to load back-in-stock data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this subscription?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/back-in-stock/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setSubscriptions((prev) => prev.filter((s) => s.id !== id));
        setStats((prev) => ({ ...prev, total: prev.total - 1 }));
      }
    } catch {
      alert('Failed to delete subscription');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-amber-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Back-in-Stock Alerts
            </h1>
            <p className="text-sm text-gray-500">
              Customers waiting to be notified when products restock
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500 mt-1">Total Subscribers</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-700">
            {stats.pending}
          </div>
          <div className="text-sm text-amber-600 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending Notification
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-700">
            {stats.notified}
          </div>
          <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Already Notified
          </div>
        </div>
      </div>

      {/* How it works info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <strong>🤖 Auto-Notify:</strong> When you update a product's inventory
        above 0 in the Products section, all pending subscribers are{' '}
        <strong>automatically emailed</strong> and marked as notified.
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'notified'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading && (
          <div className="flex justify-center items-center h-48 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        )}
        {!loading && subscriptions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Bell className="w-8 h-8 mb-2 opacity-30" />
            <p>No subscriptions found</p>
          </div>
        )}
        {!loading && subscriptions.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Subscribed
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {sub.product_thumbnail ? (
                        <img
                          src={sub.product_thumbnail}
                          alt={sub.product_title || ''}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900">
                        {sub.product_title || 'Unknown Product'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{sub.email}</td>
                  <td className="px-4 py-3">
                    {sub.notified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        <CheckCircle className="w-3 h-3" /> Notified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(sub.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(sub.id)}
                      disabled={deleting === sub.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove subscription"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
