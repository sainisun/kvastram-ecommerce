'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import {
  Eye,
  EyeOff,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

interface ProductCandidate {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  skus: string[];
}

interface ProductSummary {
  id: string;
  title: string;
  handle?: string;
  thumbnail?: string | null;
  variants?: Array<{
    sku?: string | null;
    prices?: Array<{
      amount: number;
      currency_code: string;
    }>;
  }>;
}

interface FeaturedProductItem {
  id: string;
  product_id: string;
  custom_image_url: string | null;
  badge_text: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  product: ProductSummary | null;
}

interface FormState {
  productId: string;
  badgeText: string;
  sortOrder: string;
  isActive: boolean;
  imageFile: File | null;
  imagePreview: string;
}

const emptyForm = (): FormState => ({
  productId: '',
  badgeText: '',
  sortOrder: '0',
  isActive: true,
  imageFile: null,
  imagePreview: '',
});

function formatPrice(product: ProductSummary | null) {
  const price = product?.variants?.[0]?.prices?.[0];
  if (!price) {
    return 'Price unavailable';
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: price.currency_code?.toUpperCase() || 'USD',
  }).format(price.amount / 100);
}

export default function FeaturedProductsManager() {
  const [items, setItems] = useState<FeaturedProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeaturedProductItem | null>(
    null
  );
  const [form, setForm] = useState<FormState>(emptyForm);
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<ProductCandidate[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  useEffect(() => {
    void loadFeaturedProducts();
  }, []);

  useEffect(() => {
    const trimmedQuery = productQuery.trim();
    if (trimmedQuery.length < 2) {
      setProductResults([]);
      setSearchingProducts(false);
      return;
    }

    setSearchingProducts(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await api.searchFeaturedProductCandidates(trimmedQuery);
        setProductResults(response.products || []);
      } catch (error) {
        console.error('Failed to search products:', error);
        setProductResults([]);
      } finally {
        setSearchingProducts(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [productQuery]);

  async function loadFeaturedProducts() {
    try {
      setLoading(true);
      const response = await api.getFeaturedProductsAdmin();
      setItems(response.featuredProducts || []);
    } catch (error) {
      console.error('Failed to load featured products:', error);
      alert('Failed to load featured products');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingItem(null);
    setForm(emptyForm());
    setProductQuery('');
    setProductResults([]);
    setIsModalOpen(true);
  }

  function openEditModal(item: FeaturedProductItem) {
    setEditingItem(item);
    setForm({
      productId: item.product_id,
      badgeText: item.badge_text || '',
      sortOrder: String(item.sort_order),
      isActive: item.is_active,
      imageFile: null,
      imagePreview: item.custom_image_url || '',
    });
    setProductQuery(item.product?.title || '');
    setProductResults([]);
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingItem(null);
    setForm(emptyForm());
    setProductQuery('');
    setProductResults([]);
    setIsModalOpen(false);
  }

  const selectedProduct = useMemo(() => {
    const resultMatch = productResults.find((product) => product.id === form.productId);
    if (resultMatch) {
      return resultMatch;
    }

    if (editingItem?.product && editingItem.product.id === form.productId) {
      return {
        id: editingItem.product.id,
        title: editingItem.product.title,
        handle: editingItem.product.handle || '',
        thumbnail: editingItem.product.thumbnail || null,
        skus: editingItem.product.variants
          ?.map((variant) => variant.sku)
          .filter((sku): sku is string => Boolean(sku)) || [],
      };
    }

    return null;
  }, [editingItem, form.productId, productResults]);

  function handleImageChange(file: File | null) {
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be 5MB or smaller');
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    setForm((current) => ({
      ...current,
      imageFile: file,
      imagePreview: nextPreview,
    }));
  }

  function buildFormData() {
    const formData = new FormData();
    formData.append('product_id', form.productId);
    formData.append('badge_text', form.badgeText);
    formData.append('sort_order', form.sortOrder || '0');
    formData.append('is_active', String(form.isActive));

    if (form.imageFile) {
      formData.append('custom_image', form.imageFile);
    }

    return formData;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.productId) {
      alert('Please choose a product');
      return;
    }

    try {
      setSaving(true);
      if (editingItem) {
        await api.updateFeaturedProduct(editingItem.id, buildFormData());
      } else {
        await api.createFeaturedProduct(buildFormData());
      }

      closeModal();
      void loadFeaturedProducts().catch((refreshError) => {
        console.warn('Saved featured product, but refresh failed:', refreshError);
        alert('Saved spotlight product, but the list could not refresh. Reload the page to see the update.');
      });
    } catch (error) {
      console.error('Failed to save featured product:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to save featured product'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      setTogglingId(id);
      await api.toggleFeaturedProduct(id);
      await loadFeaturedProducts();
    } catch (error) {
      console.error('Failed to toggle featured product:', error);
      alert('Failed to toggle featured product');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this spotlight product?')) {
      return;
    }

    try {
      setDeletingId(id);
      await api.deleteFeaturedProduct(id);
      await loadFeaturedProducts();
    } catch (error) {
      console.error('Failed to delete featured product:', error);
      alert('Failed to delete featured product');
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = items.filter((item) => item.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spotlight Products</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage the full-width product spotlight cards injected into the mobile category grid.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Spotlight
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Spotlights</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {items.length - activeCount}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
          Loading spotlight products...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <FolderOpen size={24} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No spotlight products yet
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Choose featured products to insert between every four products on mobile.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Spotlight
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-[220px_1fr_auto]"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
                {item.custom_image_url || item.product?.thumbnail ? (
                  <Image
                    src={item.custom_image_url || item.product?.thumbnail || ''}
                    alt={item.product?.title || 'Spotlight product'}
                    fill
                    sizes="220px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No image
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    Sort #{item.sort_order}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      item.is_active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {item.badge_text ? (
                    <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-white">
                      {item.badge_text}
                    </span>
                  ) : null}
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {item.product?.title || 'Missing product'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatPrice(item.product)}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gray-500">
                    SKU {item.product?.variants?.[0]?.sku || 'Not available'}
                  </p>
                </div>

                <p className="text-sm text-gray-600">
                  Custom image: {item.custom_image_url ? 'Yes' : 'Uses product image'}
                </p>
              </div>

              <div className="flex flex-col gap-2 lg:w-44">
                <button
                  type="button"
                  onClick={() => handleToggle(item.id)}
                  disabled={togglingId === item.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {item.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  {togglingId === item.id
                    ? 'Updating...'
                    : item.is_active
                      ? 'Deactivate'
                      : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  {deletingId === item.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingItem ? 'Edit Spotlight Product' : 'Add Spotlight Product'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Search by product name or SKU, then optionally override the image and badge.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Search Product
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    value={productQuery}
                    onChange={(event) => setProductQuery(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Search by name or SKU"
                  />
                </div>
                {searchingProducts ? (
                  <p className="text-sm text-gray-500">Searching products...</p>
                ) : null}
                {productResults.length > 0 ? (
                  <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-gray-200 p-3">
                    {productResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          setForm((current) => ({
                            ...current,
                            productId: product.id,
                          }));
                          setProductQuery(product.title);
                          setProductResults([]);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                          form.productId === product.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-gray-100">
                          {product.thumbnail ? (
                            <Image
                              src={product.thumbnail}
                              alt={product.title}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {product.title}
                          </p>
                          <p className="truncate text-xs uppercase tracking-[0.14em] text-gray-500">
                            {product.skus.join(', ') || 'No SKU'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
                {selectedProduct ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    Selected: <span className="font-semibold">{selectedProduct.title}</span>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Custom Image
                  </label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                    {form.imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.imagePreview}
                        alt="Spotlight preview"
                        className="mb-4 aspect-[3/4] w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                        <Upload size={22} />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      Click to choose custom image
                    </span>
                    <span className="mt-1 text-xs text-gray-500">
                      Optional. Leave empty to use the product image.
                    </span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) =>
                        handleImageChange(event.target.files?.[0] || null)
                      }
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Badge Text
                    </label>
                    <input
                      value={form.badgeText}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          badgeText: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="New Arrival"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.sortOrder}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          sortOrder: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            isActive: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Active on storefront
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? editingItem
                      ? 'Saving...'
                      : 'Creating...'
                    : editingItem
                      ? 'Save Changes'
                      : 'Create Spotlight'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
