'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Edit2, Loader2, Plus, Tag, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';

interface DiscountCode {
  id: string;
  code: string;
  type?: DiscountType | string | null;
  value: string | number;
  is_active: boolean;
  usage_count?: number | null;
  usage_limit?: string | number | null;
  starts_at?: string | null;
  ends_at?: string | null;
}

interface DiscountsResponse {
  discounts?: DiscountCode[];
}

interface DiscountFormState {
  code: string;
  type: DiscountType;
  value: string;
  usage_limit: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

const emptyForm: DiscountFormState = {
  code: '',
  type: 'percentage',
  value: '',
  usage_limit: '',
  starts_at: '',
  ends_at: '',
  is_active: true,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const toDateInputValue = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const toApiDate = (value: string) => {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00.000Z`).toISOString();
};

const formatDiscountValue = (discount: DiscountCode) => {
  if (discount.type === 'percentage') return `${discount.value}%`;
  if (discount.type === 'free_shipping') return 'Free shipping';
  return String(discount.value);
};

const buildDiscountPayload = (form: DiscountFormState) => ({
  code: form.code.trim().toUpperCase(),
  type: form.type,
  value:
    form.type === 'free_shipping'
      ? 0
      : Number.parseInt(form.value || '0', 10),
  is_active: form.is_active,
  usage_limit: form.usage_limit
    ? Number.parseInt(form.usage_limit, 10)
    : undefined,
  starts_at: toApiDate(form.starts_at),
  ends_at: toApiDate(form.ends_at),
});

export default function MarketingPage() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [form, setForm] = useState<DiscountFormState>(emptyForm);

  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = (await api.getDiscounts()) as DiscountsResponse;
      setDiscounts((data.discounts ?? []).filter(Boolean));
    } catch (error) {
      console.error('Error fetching discounts:', error);
      alert(getErrorMessage(error, 'Failed to load discount codes'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDiscounts();
  }, [fetchDiscounts]);

  const stats = useMemo(() => {
    const active = discounts.filter((discount) => discount.is_active).length;
    const totalUses = discounts.reduce(
      (sum, discount) => sum + Number(discount.usage_count || 0),
      0
    );
    return { active, totalUses };
  }, [discounts]);

  const openCreateForm = () => {
    setEditingDiscount(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    setForm({
      code: discount.code || '',
      type: (discount.type as DiscountType) || 'percentage',
      value: String(discount.value ?? ''),
      usage_limit: discount.usage_limit ? String(discount.usage_limit) : '',
      starts_at: toDateInputValue(discount.starts_at),
      ends_at: toDateInputValue(discount.ends_at),
      is_active: discount.is_active !== false,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingDiscount(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.code.trim()) {
      alert('Discount code is required');
      return;
    }
    if (form.type !== 'free_shipping' && Number.parseInt(form.value || '0', 10) <= 0) {
      alert('Discount value must be greater than 0');
      return;
    }

    try {
      setSaving(true);
      const payload = buildDiscountPayload(form);
      if (editingDiscount) {
        await api.updateDiscount(editingDiscount.id, payload);
      } else {
        await api.createDiscount(payload);
      }
      closeForm();
      void fetchDiscounts();
    } catch (error) {
      console.error('Error saving discount:', error);
      alert(getErrorMessage(error, 'Failed to save discount code'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (discount: DiscountCode) => {
    if (!confirm(`Delete discount code "${discount.code}"?`)) return;

    try {
      await api.deleteDiscount(discount.id);
      void fetchDiscounts();
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert(getErrorMessage(error, 'Failed to delete discount code'));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--kv-text)]">Coupons</h1>
          <p className="mt-1 text-sm text-[var(--kv-text)]">
            Create and manage discount codes for the storefront.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--kv-text)] px-4 py-2 text-sm font-semibold text-[var(--kv-card)] hover:bg-[var(--kv-text)]"
        >
          <Plus size={16} />
          New Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--kv-border)] bg-[var(--kv-card)] p-5">
          <p className="text-sm text-[var(--kv-muted)]">Total Coupons</p>
          <p className="mt-2 text-3xl font-bold text-[var(--kv-text)]">{discounts.length}</p>
        </div>
        <div className="rounded-lg border border-[var(--kv-border)] bg-[var(--kv-card)] p-5">
          <p className="text-sm text-[var(--kv-muted)]">Active</p>
          <p className="mt-2 text-3xl font-bold text-[var(--kv-success)]">{stats.active}</p>
        </div>
        <div className="rounded-lg border border-[var(--kv-border)] bg-[var(--kv-card)] p-5">
          <p className="text-sm text-[var(--kv-muted)]">Total Uses</p>
          <p className="mt-2 text-3xl font-bold text-[var(--kv-accent-deep)]">{stats.totalUses}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-[var(--kv-border)] bg-[var(--kv-card)] p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--kv-text)]">
              {editingDiscount ? 'Edit Coupon' : 'Create Coupon'}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-sm font-medium text-[var(--kv-muted)] hover:text-[var(--kv-text)]"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[var(--kv-text)]">Code</span>
              <input
                type="text"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                }
                className="w-full rounded-lg border border-[var(--kv-border)] px-3 py-2 text-sm outline-none focus:border-[var(--kv-text)]"
                placeholder="WELCOME10"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[var(--kv-text)]">Type</span>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as DiscountType,
                    value: event.target.value === 'free_shipping' ? '0' : current.value,
                  }))
                }
                className="w-full rounded-lg border border-[var(--kv-border)] px-3 py-2 text-sm outline-none focus:border-[var(--kv-text)]"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[var(--kv-text)]">Value</span>
              <input
                type="number"
                min="0"
                value={form.type === 'free_shipping' ? '0' : form.value}
                disabled={form.type === 'free_shipping'}
                onChange={(event) =>
                  setForm((current) => ({ ...current, value: event.target.value }))
                }
                className="w-full rounded-lg border border-[var(--kv-border)] px-3 py-2 text-sm outline-none focus:border-[var(--kv-text)] disabled:bg-[var(--kv-soft)]"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[var(--kv-text)]">Usage Limit</span>
              <input
                type="number"
                min="1"
                value={form.usage_limit}
                onChange={(event) =>
                  setForm((current) => ({ ...current, usage_limit: event.target.value }))
                }
                className="w-full rounded-lg border border-[var(--kv-border)] px-3 py-2 text-sm outline-none focus:border-[var(--kv-text)]"
                placeholder="No limit"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[var(--kv-text)]">Starts At</span>
              <input
                type="date"
                value={form.starts_at}
                onChange={(event) =>
                  setForm((current) => ({ ...current, starts_at: event.target.value }))
                }
                className="w-full rounded-lg border border-[var(--kv-border)] px-3 py-2 text-sm outline-none focus:border-[var(--kv-text)]"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[var(--kv-text)]">Ends At</span>
              <input
                type="date"
                value={form.ends_at}
                onChange={(event) =>
                  setForm((current) => ({ ...current, ends_at: event.target.value }))
                }
                className="w-full rounded-lg border border-[var(--kv-border)] px-3 py-2 text-sm outline-none focus:border-[var(--kv-text)]"
              />
            </label>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm font-medium text-[var(--kv-text)]">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_active: event.target.checked }))
              }
              className="h-4 w-4 rounded border-[var(--kv-border)]"
            />
            Active
          </label>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--kv-text)] px-4 py-2 text-sm font-semibold text-[var(--kv-card)] hover:bg-[var(--kv-text)] disabled:opacity-60"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editingDiscount ? 'Update Coupon' : 'Create Coupon'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-[var(--kv-border)] bg-[var(--kv-card)]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-[var(--kv-muted)]">
            <Loader2 size={18} className="animate-spin" />
            Loading coupons...
          </div>
        ) : discounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Tag size={36} className="mb-3 text-[var(--kv-muted)]" />
            <h2 className="text-lg font-semibold text-[var(--kv-text)]">No coupons yet</h2>
            <p className="mt-1 text-sm text-[var(--kv-muted)]">Create your first discount code.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--kv-border)]">
              <thead className="bg-[var(--kv-soft)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--kv-muted)]">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--kv-muted)]">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--kv-muted)]">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--kv-muted)]">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--kv-muted)]">
                    Ends
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--kv-muted)]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--kv-muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-[var(--kv-card)]">
                {discounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-[var(--kv-soft)]">
                    <td className="px-6 py-4">
                      <span className="rounded bg-[var(--kv-soft)] px-2 py-1 font-mono text-sm font-semibold text-[var(--kv-text)]">
                        {discount.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize text-[var(--kv-text)]">
                      {(discount.type || 'unknown').replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--kv-text)]">
                      {formatDiscountValue(discount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--kv-text)]">
                      {discount.usage_count || 0} / {discount.usage_limit || 'No limit'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--kv-text)]">
                      {discount.ends_at
                        ? new Date(discount.ends_at).toLocaleDateString()
                        : 'No end date'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          discount.is_active
                            ? 'bg-[var(--kv-success)]/10 text-[var(--kv-success)]'
                            : 'bg-[var(--kv-soft)] text-[var(--kv-text)]'
                        }`}
                      >
                        {discount.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(discount)}
                          aria-label={`Edit coupon ${discount.code}`}
                          className="rounded p-2 text-[var(--kv-accent-deep)] hover:bg-[var(--kv-accent)]/10"
                          title="Edit coupon"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(discount)}
                          aria-label={`Delete coupon ${discount.code}`}
                          className="rounded p-2 text-[var(--kv-danger)] hover:bg-[var(--kv-danger)]/10"
                          title="Delete coupon"
                        >
                          <Trash2 size={16} />
                        </button>
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
