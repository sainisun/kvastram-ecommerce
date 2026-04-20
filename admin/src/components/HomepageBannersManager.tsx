'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import {
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

interface HomepageBanner {
  id: string;
  image_url: string;
  headline: string | null;
  button_label: string | null;
  button_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface BannerFormState {
  headline: string;
  buttonLabel: string;
  buttonUrl: string;
  sortOrder: string;
  isActive: boolean;
  imageFile: File | null;
  imagePreview: string;
}

const emptyForm = (): BannerFormState => ({
  headline: '',
  buttonLabel: '',
  buttonUrl: '',
  sortOrder: '0',
  isActive: true,
  imageFile: null,
  imagePreview: '',
});

export default function HomepageBannersManager() {
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HomepageBanner | null>(
    null
  );
  const [form, setForm] = useState<BannerFormState>(emptyForm);

  useEffect(() => {
    void loadBanners();
  }, []);

  const activeCount = banners.filter((banner) => banner.is_active).length;

  async function loadBanners() {
    try {
      setLoading(true);
      const response = await api.getHomepageBanners();
      setBanners(response.banners || []);
    } catch (error) {
      console.error('Failed to load homepage banners:', error);
      alert('Failed to load category page banners');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingBanner(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  }

  function openEditModal(banner: HomepageBanner) {
    setEditingBanner(banner);
    setForm({
      headline: banner.headline || '',
      buttonLabel: banner.button_label || '',
      buttonUrl: banner.button_url || '',
      sortOrder: String(banner.sort_order),
      isActive: banner.is_active,
      imageFile: null,
      imagePreview: banner.image_url,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingBanner(null);
    setForm(emptyForm());
  }

  function handleFileChange(file: File | null) {
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
    formData.append('headline', form.headline);
    formData.append('button_label', form.buttonLabel);
    formData.append('button_url', form.buttonUrl);
    formData.append('sort_order', form.sortOrder || '0');
    formData.append('is_active', String(form.isActive));

    if (form.imageFile) {
      formData.append('image', form.imageFile);
    }

    return formData;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!editingBanner && !form.imageFile) {
      alert('Please choose a banner image');
      return;
    }

    try {
      setSaving(true);

      if (editingBanner) {
        await api.updateHomepageBanner(editingBanner.id, buildFormData());
      } else {
        await api.createHomepageBanner(buildFormData());
      }

      closeModal();
      void loadBanners().catch((refreshError) => {
        console.warn('Saved homepage banner, but refresh failed:', refreshError);
        alert('Saved homepage banner, but the list could not refresh. Reload the page to see the update.');
      });
    } catch (error) {
      console.error('Failed to save homepage banner:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to save homepage banner'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      setTogglingId(id);
      await api.toggleHomepageBanner(id);
      await loadBanners();
    } catch (error) {
      console.error('Failed to toggle homepage banner:', error);
      alert('Failed to toggle homepage banner');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category page banner?')) {
      return;
    }

    try {
      setDeletingId(id);
      await api.deleteHomepageBanner(id);
      await loadBanners();
    } catch (error) {
      console.error('Failed to delete homepage banner:', error);
      alert('Failed to delete homepage banner');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Page Banners</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage the mobile hero slider shown at the top of category listing pages.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add New Banner
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Banners</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{banners.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {banners.length - activeCount}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
          Loading category page banners...
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <ImageIcon size={24} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No category banners yet
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Add your first slide to power the category page hero on mobile.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add New Banner
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-[280px_1fr_auto]"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src={banner.image_url}
                  alt={banner.headline || 'Category page banner'}
                  fill
                  sizes="(max-width: 1024px) 100vw, 280px"
                  className="object-cover"
                />
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    Sort #{banner.sort_order}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      banner.is_active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {banner.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {banner.headline || 'Untitled banner'}
                  </h2>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium text-gray-900">CTA label:</span>{' '}
                    {banner.button_label || 'No CTA label'}
                  </p>
                  <p className="break-all">
                    <span className="font-medium text-gray-900">CTA link:</span>{' '}
                    {banner.button_url || 'No CTA link'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:w-40">
                <button
                  type="button"
                  onClick={() => handleToggle(banner.id)}
                  disabled={togglingId === banner.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {banner.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  {togglingId === banner.id
                    ? 'Updating...'
                    : banner.is_active
                      ? 'Deactivate'
                      : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(banner)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(banner.id)}
                  disabled={deletingId === banner.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  {deletingId === banner.id ? 'Deleting...' : 'Delete'}
                </button>
                {banner.button_url ? (
                  <a
                    href={banner.button_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                  >
                    <ExternalLink size={16} />
                    Open Link
                  </a>
                ) : null}
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
                  {editingBanner ? 'Edit Category Banner' : 'Add Category Banner'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Upload a banner image and optional CTA details for the mobile category page slider.
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
              <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Banner Image {editingBanner ? '' : '*'}
                    </label>
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                      {form.imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.imagePreview}
                          alt="Banner preview"
                          className="mb-4 aspect-[4/5] w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                          <ImageIcon size={24} />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        Click to choose banner image
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        JPG, PNG or WEBP up to 5MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                          handleFileChange(event.target.files?.[0] || null)
                        }
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
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

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Headline
                    </label>
                    <input
                      value={form.headline}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          headline: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Wedding Edit"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      CTA Label
                    </label>
                    <input
                      value={form.buttonLabel}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          buttonLabel: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Shop now"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      CTA Link
                    </label>
                    <input
                      value={form.buttonUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          buttonUrl: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="/products?category_id=..."
                    />
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
                    ? editingBanner
                      ? 'Saving...'
                      : 'Creating...'
                    : editingBanner
                      ? 'Save Changes'
                      : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
