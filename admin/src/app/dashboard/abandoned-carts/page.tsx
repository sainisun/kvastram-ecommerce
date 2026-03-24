'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  ShoppingCart,
  Mail,
  Trash2,
  Clock,
  DollarSign,
  TrendingDown,
  Loader2,
  CheckCircle,
} from 'lucide-react';

interface AbandonedCart {
  id: string;
  customer_id: string | null;
  session_id: string | null;
  customer_email: string;
  customer_name: string;
  items: any[];
  cart_value: number;
  item_count: number;
  created_at: string;
  updated_at: string;
  recovery_sent: boolean;
  recovery_sent_at: string | null;
}

interface AbandonedCartStats {
  total_abandoned_value: number;
  total_count: number;
  avg_cart_value: number;
}

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [stats, setStats] = useState<AbandonedCartStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [recovering, setRecovering] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  const fetchCarts = async () => {
    try {
      setLoading(true);
      const data = await api.getAbandonedCarts(period);
      setCarts(data.carts || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching abandoned carts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
  }, [period]);

  const handleRecover = async (id: string) => {
    try {
      setRecovering(id);
      await api.recoverAbandonedCart(id);
      // Update local state
      setCarts((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                recovery_sent: true,
                recovery_sent_at: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (error) {
      console.error('Error recovering cart:', error);
      alert('Failed to send recovery email');
    } finally {
      setRecovering(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      await api.deleteAbandonedCart(id);
      setCarts((prev) => prev.filter((c) => c.id !== id));
      setShowDeleteConfirm(null);
      if (stats) {
        const deletedCart = carts.find((c) => c.id === id);
        if (deletedCart) {
          setStats({
            ...stats,
            total_count: stats.total_count - 1,
            total_abandoned_value:
              stats.total_abandoned_value - deletedCart.cart_value,
          });
        }
      }
    } catch (error) {
      console.error('Error deleting cart:', error);
      alert('Failed to delete abandoned cart');
    } finally {
      setDeleting(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSinceAbandoned = (dateStr: string) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    return `${diffHours}h ago`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Abandoned Carts</h1>
          <p className="text-gray-600 mt-1">
            Track and recover abandoned shopping carts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-50 rounded-lg">
                <TrendingDown className="text-red-500" size={20} />
              </div>
              <span className="text-sm text-gray-500">
                Total Abandoned Value
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.total_abandoned_value)}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 rounded-lg">
                <ShoppingCart className="text-orange-500" size={20} />
              </div>
              <span className="text-sm text-gray-500">Abandoned Carts</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.total_count}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="text-blue-500" size={20} />
              </div>
              <span className="text-sm text-gray-500">Avg Cart Value</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.avg_cart_value)}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-gray-400" size={32} />
            <span className="ml-3 text-gray-500">
              Loading abandoned carts...
            </span>
          </div>
        ) : carts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-900 mb-1">
              No abandoned carts
            </p>
            <p className="text-sm text-gray-500">
              No abandoned carts found for the selected period.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cart Value
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abandoned
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recovery
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {carts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {cart.customer_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {cart.customer_email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {cart.item_count} item{cart.item_count !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(cart.cart_value)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                        <Clock size={14} />
                        <span>{getTimeSinceAbandoned(cart.updated_at)}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(cart.updated_at)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {cart.recovery_sent ? (
                        <div className="flex items-center justify-center gap-1">
                          <CheckCircle size={14} className="text-green-500" />
                          <span className="text-xs text-green-600 font-medium">
                            Sent
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Not sent</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {!cart.recovery_sent &&
                          cart.customer_email !== 'Guest' && (
                            <button
                              onClick={() => handleRecover(cart.id)}
                              disabled={recovering === cart.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-lg hover:bg-blue-100 disabled:opacity-50 font-medium"
                              title="Send recovery email"
                            >
                              {recovering === cart.id ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                <Mail size={14} />
                              )}
                              Recover
                            </button>
                          )}
                        {showDeleteConfirm === cart.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(cart.id)}
                              disabled={deleting === cart.id}
                              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
                            >
                              {deleting === cart.id ? '...' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowDeleteConfirm(cart.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
