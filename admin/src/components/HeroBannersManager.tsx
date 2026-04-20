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

interface HeroBanner {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  button_text: string | null;
  button_link: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface BannerFormState {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  sortOrder: string;
  isActive: boolean;
  imageFile: File | null;
  imagePreview: string;
}

const emptyForm = (): BannerFormState => ({
  title: '',
  subtitle: '',
  buttonText: '',
  buttonLink: '',
  sortOrder: '0',
  isActive: true,
  imageFile: null,
  imagePreview: '',
});

export default function HeroBannersManager() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [form, setForm] = useState<BannerFormState>(emptyForm);

  useEffect(() => {
    void loadBanners();
  }, []);

  const activeCount = banners.filter((banner) => banner.is_active).length;

  async function loadBanners() {
    try {
      setLoading(true);
      const response = await api.getHeroBanners();
      setBanners(response.banners || []);
    } catch (error) {
      console.error('Failed to load hero banners:', error);
      alert('Failed to load hero banners');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingBanner(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  }

  function openEditModal(banner: HeroBanner) {
    setEditingBanner(banner);
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      buttonText: banner.button_text || '',
      buttonLink: banner.button_link || '',
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
    formData.append('title', form.title);
    formData.append('subtitle', form.subtitle);
    formData.append('button_text', form.buttonText);
    formData.append('button_link', form.buttonLink);
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
        await api.updateHeroBanner(editingBanner.id, buildFormData());
      } else {
        await api.createHeroBanner(buildFormData());
      }

      closeModal();
      void loadBanners().catch((refreshError) => {
        console.warn('Saved hero banner, but refresh failed:', refreshError);
        alert('Saved hero banner, but the list could not refresh. Reload the page to see the update.');
      });
    } catch (error) {
      console.error('Failed to save hero banner:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to save hero banner'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      setTogglingId(id);
      await api.toggleHeroBanner(id);
      await loadBanners();
    } catch (error) {
      console.error('Failed to toggle hero banner:', error);
      alert('Failed to toggle hero banner');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this hero banner?')) {
      return;
    }

    try {
      setDeletingId(id);
      await api.deleteHeroBanner(id);
      await loadBanners();
    } catch (error) {
      console.error('Failed to delete hero banner:', error);
      alert('Failed to delete hero banner');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero Banners</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage the storefront homepage slider from one place.
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
          Loading hero banners...
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <ImageIcon size={24} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No hero banners yet
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Add your first banner to power the storefront hero slider.
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
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src={banner.image_url}
                  alt={banner.title || 'Hero banner'}
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
                    {banner.title || 'Untitled banner'}
                  </h2>
                  {banner.subtitle ? (
                    <p className="mt-1 text-sm text-gray-600">{banner.subtitle}</p>
                  ) : null}
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium text-gray-900">CTA:</span>{' '}
                    {banner.button_text || 'No button text'}
                  </p>
                  <p className="break-all">
                    <span className="font-medium text-gray-900">Link:</span>{' '}
                    {banner.button_link || 'No button link'}
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
                {banner.button_link ? (
                  <a
                    href={banner.button_link}
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
                  {editingBanner ? 'Edit Hero Banner' : 'Add Hero Banner'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Upload a banner image and optional CTA details for the homepage.
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
                        // Local object URLs are only used for temporary client-side preview.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.imagePreview}
                          alt="Banner preview"
                          className="mb-4 aspect-[16/9] w-full rounded-xl object-cover"
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
                        JPG, PNG, WEBP or GIF up to 5MB
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
                      Title
                    </label>
                    <input
                      value={form.title}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Summer artisan collection"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Subtitle
                    </label>
                    <textarea
                      value={form.subtitle}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          subtitle: event.target.value,
                        }))
                      }
                      rows={4}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Optional supporting copy for the banner overlay"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Button Text
                      </label>
                      <input
                        value={form.buttonText}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            buttonText: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Shop now"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Button Link
                      </label>
                      <input
                        value={form.buttonLink}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            buttonLink: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="/collections/new-arrivals"
                      />
                    </div>
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
