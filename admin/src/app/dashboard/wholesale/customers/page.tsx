'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import {
  Users,
  Mail,
  Phone,
  Building2,
  Crown,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface WholesaleCustomer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company_name: string | null;
  discount_tier: string | null;
  wholesale_inquiry_id: string | null;
  created_at: string;
  email_verified: boolean;
}

export default function WholesaleCustomersPage() {
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    starter: 0,
    growth: 0,
    enterprise: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const searchRef = useRef(search);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const [customersData, statsData] = await Promise.all([
        api.getWholesaleCustomers(searchRef.current, tierFilter, page),
        api.getWholesaleCustomerStats(),
      ]);
      setCustomers(customersData.customers || []);
      setPagination(
        customersData.pagination || { page: 1, limit: 20, total: 0, pages: 1 }
      );
      setStats(statsData || { total: 0, starter: 0, growth: 0, enterprise: 0 });
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, [page, tierFilter]);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void fetchCustomers();
  };

  const handleTierChange = async (customerId: string, newTier: string) => {
    try {
      await api.updateWholesaleCustomerTier(customerId, newTier);
      setCustomers(
        customers.map((c) =>
          c.id === customerId ? { ...c, discount_tier: newTier } : c
        )
      );
      setEditingTier(null);
      void fetchCustomers();
    } catch (error) {
      console.error('Error updating tier:', error);
    }
  };

  const getTierBadge = (tier: string | null) => {
    const tiers: Record<string, { bg: string; text: string; label: string }> = {
      starter: {
        bg: 'bg-[var(--kv-accent)]/10',
        text: 'text-[var(--kv-accent-deep)]',
        label: 'Starter (20%)',
      },
      growth: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        label: 'Growth (30%)',
      },
      enterprise: {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        label: 'Enterprise (40%)',
      },
    };

    if (!tier || !tiers[tier]) {
      return <span className="text-[var(--kv-muted)] text-sm">Not assigned</span>;
    }

    const t = tiers[tier];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.bg} ${t.text}`}
      >
        {t.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--kv-text)]">
          Wholesale Customers
        </h1>
        <p className="text-[var(--kv-text)]">Manage approved wholesale customers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--kv-card)] rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-[var(--kv-accent)]/10 rounded-lg">
              <Users className="w-6 h-6 text-[var(--kv-accent-deep)]" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-[var(--kv-muted)]">Total Customers</p>
              <p className="text-2xl font-bold text-[var(--kv-text)]">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--kv-card)] rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-[var(--kv-accent)]/10 rounded-lg">
              <Crown className="w-6 h-6 text-[var(--kv-accent-deep)]" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-[var(--kv-muted)]">Starter</p>
              <p className="text-2xl font-bold text-[var(--kv-text)]">
                {stats.starter}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--kv-card)] rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-[var(--kv-muted)]">Growth</p>
              <p className="text-2xl font-bold text-[var(--kv-text)]">{stats.growth}</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--kv-card)] rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-[var(--kv-muted)]">Enterprise</p>
              <p className="text-2xl font-bold text-[var(--kv-text)]">
                {stats.enterprise}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--kv-card)] rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--kv-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email..."
                className="w-full pl-10 pr-4 py-2 border border-[var(--kv-border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-[var(--kv-accent)]"
              />
            </div>
          </form>
          <select
            value={tierFilter}
            onChange={(e) => {
              setTierFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-[var(--kv-border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-[var(--kv-accent)]"
          >
            <option value="all">All Tiers</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-[var(--kv-card)] rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-[var(--kv-border)]">
          <thead className="bg-[var(--kv-soft)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--kv-muted)] uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--kv-muted)] uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--kv-muted)] uppercase tracking-wider">
                Tier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--kv-muted)] uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--kv-muted)] uppercase tracking-wider">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="bg-[var(--kv-card)] divide-y divide-[var(--kv-border)]">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-[var(--kv-muted)]">
                  Loading...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-[var(--kv-muted)]">
                  No wholesale customers found
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-[var(--kv-soft)]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-[var(--kv-border)] rounded-full flex items-center justify-center">
                        <span className="text-[var(--kv-muted)] font-medium">
                          {customer.first_name?.[0] ||
                            customer.email?.[0]?.toUpperCase() ||
                            '?'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-[var(--kv-text)]">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-sm text-[var(--kv-muted)] flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="text-sm text-[var(--kv-muted)] flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.company_name ? (
                      <div className="flex items-center text-sm text-[var(--kv-text)]">
                        <Building2 className="w-4 h-4 mr-1 text-[var(--kv-muted)]" />
                        {customer.company_name}
                      </div>
                    ) : (
                      <span className="text-sm text-[var(--kv-muted)]">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingTier === customer.id ? (
                      <select
                        value={customer.discount_tier || ''}
                        onChange={(e) =>
                          handleTierChange(customer.id, e.target.value)
                        }
                        onBlur={() => setEditingTier(null)}
                        className="text-sm border border-[var(--kv-border)] rounded px-2 py-1"
                        autoFocus
                      >
                        <option value="">Select tier</option>
                        <option value="starter">Starter (20%)</option>
                        <option value="growth">Growth (30%)</option>
                        <option value="enterprise">Enterprise (40%)</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingTier(customer.id)}
                        className="hover:opacity-75"
                      >
                        {getTierBadge(customer.discount_tier)}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.email_verified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--kv-success)]/10 text-[var(--kv-success)]">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--kv-accent)]/10 text-[var(--kv-accent-deep)]">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--kv-muted)]">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--kv-text)]">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page === 1}
              className="p-2 border border-[var(--kv-border)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--kv-soft)]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={pagination.page === pagination.pages}
              className="p-2 border border-[var(--kv-border)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--kv-soft)]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
