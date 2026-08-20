'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';

interface TrendingReel {
  id: string;
  thumbnail_url: string;
  product_name: string;
  is_active: boolean;
  sort_order: number;
}

interface ReelCollection {
  id: string;
  title: string;
  handle: string;
  subtitle: string | null;
  description: string | null;
  hero_image_url: string | null;
  hero_video_url: string | null;
  cta_label: string;
  cta_url: string | null;
  is_active: boolean;
  sort_order: number;
  reel_ids: string[];
  reels?: TrendingReel[];
}

interface CollectionFormState {
  title: string;
  handle: string;
  subtitle: string;
  description: string;
  heroImageUrl: string;
  heroVideoUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  sortOrder: string;
  isActive: boolean;
  reelIds: string[];
  heroImageFile: File | null;
  heroImagePreview: string;
}

const emptyForm = (): CollectionFormState => ({
  title: '',
  handle: '',
  subtitle: '',
  description: '',
  heroImageUrl: '',
  heroVideoUrl: '',
  ctaLabel: 'Shop Collection',
  ctaUrl: '',
  sortOrder: '0',
  isActive: true,
  reelIds: [],
  heroImageFile: null,
  heroImagePreview: '',
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export default function ReelCollectionsManager() {
  const [collections, setCollections] = useState<ReelCollection[]>([]);
  const [reels, setReels] = useState<TrendingReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<ReelCollection | null>(null);
  const [form, setForm] = useState<CollectionFormState>(emptyForm);
  const previewUrlRef = useRef('');

  useEffect(() => {
    void loadData();

    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [collectionsResponse, reelsResponse] = await Promise.all([
        api.getReelCollections(),
        api.getTrendingReels(),
      ]);
      setCollections(collectionsResponse.collections || []);
      setReels(reelsResponse.reels || []);
    } catch (error) {
      console.error('Failed to load reel collections:', error);
      alert('Failed to load reel collections');
    } finally {
      setLoading(false);
    }
  }

  function resetPreviewUrl() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }
  }

  function openCreateModal() {
    resetPreviewUrl();
    setEditingCollection(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  }

  function openEditModal(collection: ReelCollection) {
    resetPreviewUrl();
    setEditingCollection(collection);
    setForm({
      title: collection.title,
      handle: collection.handle,
      subtitle: collection.subtitle || '',
      description: collection.description || '',
      heroImageUrl: collection.hero_image_url || '',
      heroVideoUrl: collection.hero_video_url || '',
      ctaLabel: collection.cta_label || 'Shop Collection',
      ctaUrl: collection.cta_url || '',
      sortOrder: String(collection.sort_order),
      isActive: collection.is_active,
      reelIds: collection.reel_ids || [],
      heroImageFile: null,
      heroImagePreview: collection.hero_image_url || '',
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    resetPreviewUrl();
    setEditingCollection(null);
    setForm(emptyForm());
    setIsModalOpen(false);
  }

  function handleHeroImageChange(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Hero image must be 5MB or smaller');
      return;
    }

    resetPreviewUrl();
    const nextPreview = URL.createObjectURL(file);
    previewUrlRef.current = nextPreview;

    setForm((current) => ({
      ...current,
      heroImageFile: file,
      heroImagePreview: nextPreview,
    }));
  }

  function toggleReelSelection(reelId: string) {
    setForm((current) => {
      const selected = current.reelIds.includes(reelId);
      return {
        ...current,
        reelIds: selected
          ? current.reelIds.filter((id) => id !== reelId)
          : [...current.reelIds, reelId],
      };
    });
  }

  function buildFormData() {
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('handle', form.handle || slugify(form.title));
    formData.append('subtitle', form.subtitle);
    formData.append('description', form.description);
    formData.append('hero_image_url', form.heroImageUrl);
    formData.append('hero_video_url', form.heroVideoUrl);
    formData.append('cta_label', form.ctaLabel || 'Shop Collection');
    formData.append('cta_url', form.ctaUrl);
    formData.append('sort_order', form.sortOrder || '0');
    formData.append('is_active', String(form.isActive));
    formData.append('reel_ids', JSON.stringify(form.reelIds));

    if (form.heroImageFile) {
      formData.append('hero_image', form.heroImageFile);
    }

    return formData;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      if (editingCollection) {
        await api.updateReelCollection(editingCollection.id, buildFormData());
      } else {
        await api.createReelCollection(buildFormData());
      }

      closeModal();
      await loadData();
    } catch (error) {
      console.error('Failed to save reel collection:', error);
      alert(error instanceof Error ? error.message : 'Failed to save reel collection');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      setTogglingId(id);
      await api.toggleReelCollection(id);
      await loadData();
    } catch (error) {
      console.error('Failed to toggle reel collection:', error);
      alert('Failed to toggle reel collection');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this reel collection?')) return;

    try {
      setDeletingId(id);
      await api.deleteReelCollection(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete reel collection:', error);
      alert('Failed to delete reel collection');
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = collections.filter((collection) => collection.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--kv-text)]">Reel Collections</h1>
          <p className="mt-1 text-sm text-[var(--kv-text)]">
            Manage the hero carousel and collection filters on the storefront reels page.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--kv-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--kv-card)] transition hover:bg-[var(--kv-accent-deep)]"
        >
          <Plus size={18} />
          Create Collection
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--kv-muted)]">Total Collections</p>
          <p className="mt-2 text-3xl font-bold text-[var(--kv-text)]">{collections.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--kv-muted)]">Active</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--kv-muted)]">Available Reels</p>
          <p className="mt-2 text-3xl font-bold text-[var(--kv-accent-deep)]">{reels.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-10 text-center text-[var(--kv-muted)] shadow-sm">
          Loading reel collections...
        </div>
      ) : collections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--kv-border)] bg-[var(--kv-card)] p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--kv-accent)]/10 text-[var(--kv-accent-deep)]">
            <Layers size={24} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[var(--kv-text)]">No reel collections yet</h2>
          <p className="mt-2 text-sm text-[var(--kv-muted)]">
            Create collection slides to make the reels page feel curated.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--kv-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--kv-card)] transition hover:bg-[var(--kv-accent-deep)]"
          >
            <Plus size={18} />
            Create Collection
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="grid gap-4 rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-4 shadow-sm lg:grid-cols-[220px_1fr_auto]"
            >
              <div className="relative h-[150px] overflow-hidden rounded-xl bg-[var(--kv-soft)]">
                {collection.hero_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={collection.hero_image_url}
                    alt={collection.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--kv-muted)]">
                    <ImageIcon size={28} />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--kv-soft)] px-3 py-1 text-xs font-medium text-[var(--kv-text)]">
                    Sort #{collection.sort_order}
                  </span>
                  <span className="rounded-full bg-[var(--kv-accent)]/10 px-3 py-1 text-xs font-medium text-[var(--kv-accent-deep)]">
                    {(collection.reel_ids || []).length} reels
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      collection.is_active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {collection.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-[var(--kv-text)]">{collection.title}</h2>
                  <p className="mt-1 text-sm text-[var(--kv-text)]">/{collection.handle}</p>
                  {collection.subtitle ? (
                    <p className="mt-2 text-sm text-[var(--kv-text)]">{collection.subtitle}</p>
                  ) : null}
                </div>

                <p className="text-sm text-[var(--kv-text)]">
                  CTA: <span className="font-medium text-[var(--kv-text)]">{collection.cta_label}</span>
                  {collection.cta_url ? ` -> ${collection.cta_url}` : ' -> filters this page'}
                </p>
              </div>

              <div className="flex flex-col gap-2 lg:w-40">
                <button
                  type="button"
                  onClick={() => handleToggle(collection.id)}
                  disabled={togglingId === collection.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--kv-border)] px-4 py-2 text-sm font-medium text-[var(--kv-text)] transition hover:bg-[var(--kv-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {collection.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  {togglingId === collection.id
                    ? 'Updating...'
                    : collection.is_active
                      ? 'Deactivate'
                      : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(collection)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--kv-border)] px-4 py-2 text-sm font-medium text-[var(--kv-text)] transition hover:bg-[var(--kv-soft)]"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(collection.id)}
                  disabled={deletingId === collection.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--kv-danger)]/30 px-4 py-2 text-sm font-medium text-[var(--kv-danger)] transition hover:bg-[var(--kv-danger)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  {deletingId === collection.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-[var(--kv-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--kv-border)] px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--kv-text)]">
                  {editingCollection ? 'Edit Reel Collection' : 'Create Reel Collection'}
                </h2>
                <p className="mt-1 text-sm text-[var(--kv-muted)]">
                  This powers the reels page hero carousel and collection chips.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close reel collection form"
                className="rounded-full p-2 text-[var(--kv-muted)] transition hover:bg-[var(--kv-soft)] hover:text-[var(--kv-text)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--kv-text)]">
                      Hero Image
                    </label>
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--kv-border)] bg-[var(--kv-soft)] px-4 py-8 text-center transition hover:border-[var(--kv-accent)]/60 hover:bg-[var(--kv-accent)]/10/40">
                      {form.heroImagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.heroImagePreview}
                          alt="Hero preview"
                          className="mb-4 h-[180px] w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--kv-card)] text-[var(--kv-accent-deep)] shadow-sm">
                          <Upload size={22} />
                        </div>
                      )}
                      <span className="text-sm font-medium text-[var(--kv-text)]">
                        Upload hero image
                      </span>
                      <span className="mt-1 text-xs text-[var(--kv-muted)]">
                        Optional if assigned reels have thumbnails.
                      </span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) =>
                          handleHeroImageChange(event.target.files?.[0] || null)
                        }
                      />
                    </label>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--kv-text)]">
                      Existing Hero Image URL
                    </label>
                    <input
                      value={form.heroImageUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          heroImageUrl: event.target.value,
                          heroImagePreview: event.target.value || current.heroImagePreview,
                        }))
                      }
                      className="w-full rounded-xl border border-[var(--kv-border)] px-3 py-2.5 text-sm text-[var(--kv-text)] outline-none transition focus:border-[var(--kv-accent)] focus:ring-2 focus:ring-blue-100"
                      placeholder="https://res.cloudinary.com/..."
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--kv-text)]">
                      Hero Video URL
                    </label>
                    <input
                      value={form.heroVideoUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          heroVideoUrl: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-[var(--kv-border)] px-3 py-2.5 text-sm text-[var(--kv-text)] outline-none transition focus:border-[var(--kv-accent)] focus:ring-2 focus:ring-blue-100"
                      placeholder="Optional Cloudinary video URL"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--kv-text)]">
                        Title
                      </label>
                      <input
                        value={form.title}
                        onChange={(event) => {
                          const title = event.target.value;
                          setForm((current) => ({
                            ...current,
                            title,
                            handle: current.handle || slugify(title),
                          }));
                        }}
                        className="w-full rounded-xl border border-[var(--kv-border)] px-3 py-2.5 text-sm text-[var(--kv-text)] outline-none transition focus:border-[var(--kv-accent)] focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--kv-text)]">
                        Handle
                      </label>
                      <input
                        value={form.handle}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            handle: slugify(event.target.value),
                          }))
                        }
                        className="w-full rounded-xl border border-[var(--kv-border)] px-3 py-2.5 text-sm text-[var(--kv-text)] outline-none transition focus:border-[var(--kv-accent)] focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--kv-text)]">
                      Subtitle
                    </label>
                    <input
                      value={form.subtitle}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, subtitle: event.target.value }))
                      }
                      className="w-full rounded-xl border border-[var(--kv-border)] px-3 py-2.5 text-sm text-[var(--kv-text)] outline-none transition focus:border-[var(--kv-accent)] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--kv-text)]">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, description: event.target.value }))
                      }
                      className="min-h-24 w-full rounded-xl border border-[var(--kv-border)] px-3 py-2.5 text-sm text-[var(--kv-text)] outline-none transition focus:border-[var(--kv-accent)] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--kv-text)]">
                        CTA Label
                      </label>
                      <input
                        value={form.ctaLabel}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, ctaLabel: event.target.value }))
                        }
                        className="w-full rounded-xl border border-[var(--kv-border)] px-3 py-2.5 text-sm text-[var(--kv-text)] outline-none transition focus:border-[var(--kv-accent)] focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--kv-text)]">
                        CTA URL
                      </label>
                      <input
                        value={form.ctaUrl}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, ctaUrl: event.target.value }))
                        }
                        className="w-full rounded-xl border border-[var(--kv-border)] px-3 py-2.5 text-sm text-[var(--kv-text)] outline-none transition focus:border-[var(--kv-accent)] focus:ring-2 focus:ring-blue-100"
                        placeholder="/collections/festive"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--kv-text)]">
                        Sort Order
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.sortOrder}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, sortOrder: event.target.value }))
                        }
                        className="w-full rounded-xl border border-[var(--kv-border)] px-3 py-2.5 text-sm text-[var(--kv-text)] outline-none transition focus:border-[var(--kv-accent)] focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="inline-flex items-center gap-3 rounded-xl border border-[var(--kv-border)] px-4 py-3 text-sm font-medium text-[var(--kv-text)]">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              isActive: event.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-[var(--kv-border)] text-[var(--kv-accent-deep)] focus:ring-blue-500"
                        />
                        Active on storefront
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-soft)] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--kv-text)]">Assign Reels</h3>
                    <p className="mt-1 text-xs text-[var(--kv-muted)]">
                      Selected order follows the order you choose them in.
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--kv-card)] px-3 py-1 text-xs font-medium text-[var(--kv-text)]">
                    {form.reelIds.length} selected
                  </span>
                </div>

                <div className="grid max-h-72 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                  {reels.map((reel) => (
                    <label
                      key={reel.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-3 transition hover:border-[var(--kv-accent)]/40"
                    >
                      <input
                        type="checkbox"
                        checked={form.reelIds.includes(reel.id)}
                        onChange={() => toggleReelSelection(reel.id)}
                        className="h-4 w-4 rounded border-[var(--kv-border)] text-[var(--kv-accent-deep)] focus:ring-blue-500"
                      />
                      <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--kv-soft)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={reel.thumbnail_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--kv-text)]">
                          {reel.product_name}
                        </p>
                        <p className="text-xs text-[var(--kv-muted)]">
                          Sort #{reel.sort_order} {reel.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[var(--kv-border)] pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-[var(--kv-border)] px-4 py-2.5 text-sm font-medium text-[var(--kv-text)] transition hover:bg-[var(--kv-soft)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[var(--kv-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--kv-card)] transition hover:bg-[var(--kv-accent-deep)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Saving...'
                    : editingCollection
                      ? 'Save Collection'
                      : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
