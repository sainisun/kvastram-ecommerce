'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  Mail,
  Phone,
  Search,
  Trash2,
  UserPen,
  Users,
} from 'lucide-react';
import { exportToCSV, formatCustomersForExport } from '@/lib/csv-export';
import { api } from '@/lib/api';
import {
  ActionButton,
  MetricCard,
  PageHeader,
  SegmentedTabs,
  StatusBadge,
  Surface,
} from '@/components/ui/admin-ui';

type CustomerFilter = 'all' | 'registered' | 'guest';

interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  has_account: boolean;
  created_at: string;
  order_count: number;
  total_spent: number;
}

interface CustomerStats {
  total_customers: number;
  customers_with_accounts: number;
  guest_customers: number;
  new_this_month: number;
  customers_with_orders: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers(page, search, filter);
      setCustomers(data.customers || data || []);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (error) {
      console.error('Failed to load customers:', error);
      setCustomers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    void fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.getCustomerStats();
      setStats(data || null);
    } catch (error) {
      console.error('Failed to load customer stats:', error);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount / 100);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const getCustomerName = (customer: Customer) =>
    customer.first_name && customer.last_name
      ? `${customer.first_name} ${customer.last_name}`
      : 'Unnamed customer';

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditFormData({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
    });
  };

  const handleEditSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingCustomer) {
      return;
    }

    try {
      setSavingEdit(true);
      await api.updateCustomer(editingCustomer.id, editFormData);
      setEditingCustomer(null);
      await Promise.all([fetchCustomers(), fetchStats()]);
    } catch (error) {
      console.error('Failed to update customer:', error);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCustomer) {
      return;
    }

    try {
      setDeleting(true);
      await api.deleteCustomer(deletingCustomer.id);
      setDeletingCustomer(null);
      await Promise.all([fetchCustomers(), fetchStats()]);
    } catch (error) {
      console.error('Failed to delete customer:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 px-4 pb-8 md:space-y-8 md:px-8">
      <PageHeader
        eyebrow="Relationships"
        title="Customers"
        description="Browse every buyer, jump into lifetime order history, and keep profile details tidy without losing the existing management tools."
        actions={
          <ActionButton
            onClick={() =>
              exportToCSV(formatCustomersForExport(customers), 'customers')
            }
            icon={Download}
            variant="secondary"
          >
            Export CSV
          </ActionButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total customers"
          value={stats?.total_customers || 0}
          icon={Users}
          hint="All-time profiles"
        />
        <MetricCard
          label="Registered"
          value={stats?.customers_with_accounts || 0}
          icon={Users}
          hint="Customers with accounts"
          tone="success"
        />
        <MetricCard
          label="Guest"
          value={stats?.guest_customers || 0}
          icon={Users}
          hint="Checkout-only buyers"
          tone="accent"
        />
        <MetricCard
          label="New this month"
          value={stats?.new_this_month || 0}
          icon={Users}
          hint={`${stats?.customers_with_orders || 0} have placed orders`}
        />
      </div>

      <Surface className="p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <SegmentedTabs
            value={filter}
            options={[
              { label: 'All', value: 'all', count: stats?.total_customers || 0 },
              {
                label: 'Registered',
                value: 'registered',
                count: stats?.customers_with_accounts || 0,
              },
              {
                label: 'Guest',
                value: 'guest',
                count: stats?.guest_customers || 0,
              },
            ]}
            onChange={(value) => {
              setFilter(value);
              setPage(1);
            }}
          />

          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--kv-muted)]"
            />
            <input
              type="search"
              placeholder="Search by name or email"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full border px-11 py-3 text-sm"
            />
          </div>
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[var(--kv-border)] text-left text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">Spent</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-14 text-center text-sm text-[var(--kv-muted)]"
                  >
                    Loading customers…
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-14 text-center text-sm text-[var(--kv-muted)]"
                  >
                    No customers match the current filters.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-[var(--kv-border)]/70 text-sm text-[var(--kv-text)]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--kv-soft)] text-sm font-semibold text-[var(--kv-accent-deep)]">
                          {customer.first_name?.[0] ||
                            customer.email?.[0]?.toUpperCase() ||
                            '?'}
                        </div>
                        <div>
                          <Link
                            href={`/dashboard/customers/${customer.id}`}
                            className="font-semibold hover:text-[var(--kv-accent-deep)]"
                          >
                            {getCustomerName(customer)}
                          </Link>
                          <p className="mt-1 text-xs text-[var(--kv-muted)]">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs text-[var(--kv-muted)]">
                        <p className="inline-flex items-center gap-2">
                          <Mail size={13} />
                          {customer.email}
                        </p>
                        <p className="inline-flex items-center gap-2">
                          <Phone size={13} />
                          {customer.phone || 'No phone'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={customer.has_account ? 'active' : 'inactive'}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium">{customer.order_count}</td>
                    <td className="px-6 py-4 font-medium">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-6 py-4 text-[var(--kv-muted)]">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/customers/${customer.id}`}
                          className="rounded-full border border-[var(--kv-border)] px-3 py-2 text-xs font-semibold text-[var(--kv-text)]"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEdit(customer)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--kv-border)] bg-white text-[var(--kv-text)]"
                        >
                          <UserPen size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCustomer(customer)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--kv-danger)]/20 bg-[var(--kv-danger)]/6 text-[var(--kv-danger)]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {loading ? (
            <p className="rounded-2xl bg-[var(--kv-soft)] px-4 py-6 text-center text-sm text-[var(--kv-muted)]">
              Loading customers…
            </p>
          ) : customers.length === 0 ? (
            <p className="rounded-2xl bg-[var(--kv-soft)] px-4 py-6 text-center text-sm text-[var(--kv-muted)]">
              No customers match the current filters.
            </p>
          ) : (
            customers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-[1.25rem] border border-[var(--kv-border)] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="text-sm font-semibold text-[var(--kv-text)]"
                    >
                      {getCustomerName(customer)}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--kv-muted)]">
                      {customer.email}
                    </p>
                  </div>
                  <StatusBadge
                    status={customer.has_account ? 'active' : 'inactive'}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-[var(--kv-soft)] px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--kv-muted)]">
                      Orders
                    </p>
                    <p className="mt-2 font-semibold text-[var(--kv-text)]">
                      {customer.order_count}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[var(--kv-soft)] px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--kv-muted)]">
                      Spent
                    </p>
                    <p className="mt-2 font-semibold text-[var(--kv-text)]">
                      {formatCurrency(customer.total_spent)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/dashboard/customers/${customer.id}`}
                    className="flex-1 rounded-2xl border border-[var(--kv-border)] px-4 py-3 text-center text-sm font-semibold text-[var(--kv-text)]"
                  >
                    View detail
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEdit(customer)}
                    className="rounded-2xl border border-[var(--kv-border)] px-4 py-3 text-sm font-semibold text-[var(--kv-text)]"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-[var(--kv-border)] px-4 py-4 text-sm md:px-6">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-full border border-[var(--kv-border)] px-4 py-2 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-[var(--kv-muted)]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page === totalPages}
              className="rounded-full border border-[var(--kv-border)] px-4 py-2 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}
      </Surface>

      {editingCustomer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Surface className="w-full max-w-lg p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-accent-deep)]">
                Edit customer
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--kv-text)]">
                {getCustomerName(editingCustomer)}
              </h2>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  value={editFormData.first_name}
                  onChange={(event) =>
                    setEditFormData((current) => ({
                      ...current,
                      first_name: event.target.value,
                    }))
                  }
                  placeholder="First name"
                  className="w-full border px-4 py-3 text-sm"
                />
                <input
                  value={editFormData.last_name}
                  onChange={(event) =>
                    setEditFormData((current) => ({
                      ...current,
                      last_name: event.target.value,
                    }))
                  }
                  placeholder="Last name"
                  className="w-full border px-4 py-3 text-sm"
                />
              </div>
              <input
                type="email"
                value={editFormData.email}
                onChange={(event) =>
                  setEditFormData((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="Email"
                className="w-full border px-4 py-3 text-sm"
              />
              <input
                value={editFormData.phone}
                onChange={(event) =>
                  setEditFormData((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                placeholder="Phone"
                className="w-full border px-4 py-3 text-sm"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="rounded-2xl border border-[var(--kv-border)] px-4 py-3 text-sm font-semibold text-[var(--kv-text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-2xl bg-[var(--kv-text)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {savingEdit ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </Surface>
        </div>
      ) : null}

      {deletingCustomer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Surface className="w-full max-w-lg p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-danger)]">
                Delete customer
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--kv-text)]">
                {getCustomerName(deletingCustomer)}
              </h2>
              <p className="mt-2 text-sm text-[var(--kv-muted)]">
                This permanently removes the customer record.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                className="rounded-2xl border border-[var(--kv-border)] px-4 py-3 text-sm font-semibold text-[var(--kv-text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="rounded-2xl bg-[var(--kv-danger)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete customer'}
              </button>
            </div>
          </Surface>
        </div>
      ) : null}
    </div>
  );
}
