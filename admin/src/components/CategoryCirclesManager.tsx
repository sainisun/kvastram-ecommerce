'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import {
  ExternalLink,
  Eye,
  EyeOff,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

interface CategoryCircle {
  id: string;
  category_id?: string | null;
  image_url: string;
  label: string;
  link_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface CollectionSummary {
  id: string;
  title: string;
  handle: string;
}

interface CircleFormState {
  categoryId: string;
  label: string;
  linkUrl: string;
  sortOrder: string;
  isActive: boolean;
  imageFile: File | null;
  imagePreview: string;
}

const emptyForm = (): CircleFormState => ({
  categoryId: '',
  label: '',
  linkUrl: '',
  sortOrder: '0',
  isActive: true,
  imageFile: null,
  imagePreview: '',
});

export default function CategoryCirclesManager() {
  const [circles, setCircles] = useState<CategoryCircle[]>([]);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCircle, setEditingCircle] = useState<CategoryCircle | null>(
    null
  );
  const [form, setForm] = useState<CircleFormState>(emptyForm);
  const previewUrlRef = useRef<string>('');

  useEffect(() => {
    void loadCircles();
    void loadCollections();
    void loadCatalogCategories();

    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  async function loadCircles() {
    try {
      setLoading(true);
      const response = await api.getCategoryCircles();
      setCircles(response.circles || []);
    } catch (error) {
      console.error('Failed to load category circles:', error);
      alert('Failed to load category circles');
    } finally {
      setLoading(false);
    }
  }

  async function loadCollections() {
    try {
      const response = await api.getCollections();
      setCollections(response.collections || []);
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  }

  async function loadCatalogCategories() {
    try {
      const response = await api.getCategories();
      setCatalogCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to load catalog categories:', error);
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
    setEditingCircle(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  }

  function openEditModal(circle: CategoryCircle) {
    resetPreviewUrl();
    setEditingCircle(circle);
    setForm({
      label: circle.label,
      categoryId: circle.category_id || '',
      linkUrl: circle.link_url,
      sortOrder: String(circle.sort_order),
      isActive: circle.is_active,
      imageFile: null,
      imagePreview: circle.image_url,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    resetPreviewUrl();
    setIsModalOpen(false);
    setEditingCircle(null);
    setForm(emptyForm());
  }

  function handleImageChange(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be 5MB or smaller');
      return;
    }

    resetPreviewUrl();
    const nextPreview = URL.createObjectURL(file);
    previewUrlRef.current = nextPreview;

    setForm((current) => ({
      ...current,
      imageFile: file,
      imagePreview: nextPreview,
    }));
  }

  function buildFormData() {
    const formData = new FormData();
    formData.append('label', form.label);
    formData.append('category_id', form.categoryId);
    formData.append('link_url', form.linkUrl);
    formData.append('sort_order', form.sortOrder || '0');
    formData.append('is_active', String(form.isActive));

    if (form.imageFile) {
      formData.append('image', form.imageFile);
    }

    return formData;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!editingCircle && !form.imageFile) {
      alert('Please choose an image');
      return;
    }

    try {
      setSaving(true);

      if (editingCircle) {
        await api.updateCategoryCircle(editingCircle.id, buildFormData());
      } else {
        await api.createCategoryCircle(buildFormData());
      }

      closeModal();
      void loadCircles().catch((refreshError) => {
        console.warn('Saved category circle, but refresh failed:', refreshError);
        alert('Saved category circle, but the list could not refresh. Reload the page to see the update.');
      });
    } catch (error) {
      console.error('Failed to save category circle:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to save category circle'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      setTogglingId(id);
      await api.toggleCategoryCircle(id);
      await loadCircles();
    } catch (error) {
      console.error('Failed to toggle category circle:', error);
      alert('Failed to toggle category circle');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category circle?')) {
      return;
    }

    try {
      setDeletingId(id);
      await api.deleteCategoryCircle(id);
      await loadCircles();
    } catch (error) {
      console.error('Failed to delete category circle:', error);
      alert('Failed to delete category circle');
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = circles.filter((circle) => circle.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--kv-text)]">Category Circles</h1>
          <p className="mt-1 text-sm text-[var(--kv-text)]">
            Manage the circular category row shown below the category page banner on mobile.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--kv-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--kv-card)] transition hover:bg-[var(--kv-accent-deep)]"
        >
          <Plus size={18} />
          Add New Circle
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--kv-muted)]">Total Circles</p>
          <p className="mt-2 text-3xl font-bold text-[var(--kv-text)]">{circles.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--kv-muted)]">Active</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--kv-muted)]">Inactive</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {circles.length - activeCount}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-10 text-center text-[var(--kv-muted)] shadow-sm">
          Loading category circles...
        </div>
      ) : circles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--kv-border)] bg-[var(--kv-card)] p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--kv-accent)]/10 text-[var(--kv-accent-deep)]">
            <FolderOpen size={24} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[var(--kv-text)]">
            No category circles yet
          </h2>
          <p className="mt-2 text-sm text-[var(--kv-muted)]">
            Add your first circle to populate the mobile category scroller.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--kv-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--kv-card)] transition hover:bg-[var(--kv-accent-deep)]"
          >
            <Plus size={18} />
            Add New Circle
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {circles.map((circle) => (
            <div
              key={circle.id}
              className="grid gap-4 rounded-2xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-4 shadow-sm lg:grid-cols-[220px_1fr_auto]"
            >
              <div className="relative h-[220px] w-[220px] overflow-hidden rounded-full bg-[var(--kv-soft)]">
                <Image
                  src={circle.image_url}
                  alt={circle.label}
                  fill
                  sizes="220px"
                  className="object-cover"
                />
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--kv-soft)] px-3 py-1 text-xs font-medium text-[var(--kv-text)]">
                    Sort #{circle.sort_order}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      circle.is_active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {circle.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-semibold tracking-[0.08em] text-[var(--kv-text)] uppercase">
                    {circle.label}
                  </h2>
                  <p className="mt-2 break-all text-sm text-[var(--kv-text)]">
                    <span className="font-medium text-[var(--kv-text)]">Link:</span>{' '}
                    {circle.link_url}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:w-44">
                <button
                  type="button"
                  onClick={() => handleToggle(circle.id)}
                  disabled={togglingId === circle.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--kv-border)] px-4 py-2 text-sm font-medium text-[var(--kv-text)] transition hover:bg-[var(--kv-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {circle.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  {togglingId === circle.id
                    ? 'Updating...'
                    : circle.is_active
                      ? 'Deactivate'
                      : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(circle)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--kv-border)] px-4 py-2 text-sm font-medium text-[var(--kv-text)] transition hover:bg-[var(--kv-soft)]"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(circle.id)}
                  disabled={deletingId === circle.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--kv-danger)]/30 px-4 py-2 text-sm font-medium text-[var(--kv-danger)] transition hover:bg-[var(--kv-danger)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  {deletingId === circle.id ? 'Deleting...' : 'Delete'}
                </button>
                <a
                  href={circle.link_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--kv-accent)]/30 px-4 py-2 text-sm font-medium text-[var(--kv-accent-deep)] transition hover:bg-[var(--kv-accent)]/10"
                >
                  <ExternalLink size={16} />
                  Open Link
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[var(--kv-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--kv-border)] px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--kv-text)]">
                  {editingCircle ? 'Edit Category Circle' : 'Add Category Circle'}
                </h2>
                <p className="mt-1 text-sm text-[var(--kv-muted)]">
                  Upload a square image, label, and destination for the mobile circle row.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close category circle form"
                className="rounded-full p-2 text-[var(--kv-muted)] transition hover:bg-[var(--kv-soft)] hover:text-[var(--kv-text)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--kv-text)]">
                    Circle Image {editingCircle ? '' : '*'}
                  </label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--kv-border)] bg-[var(--kv-soft)] px-4 py-8 text-center transition hover:border-[var(--kv-accent)]/60 hover:bg-[var(--kv-accent)]/10/40">
                    {form.imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.imagePreview}
                        alt="Circle preview"
                        className="mb-4 h-[220px] w-[220px] rounded-full object-cover"
                      />
                    ) : (
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--kv-card)] text-[var(--kv-accent-deep)] shadow-sm">
                        <Upload size={22} />
                      </div>
                    )}
                    <span className="text-sm font-medium text-[var(--kv-text)]">
                      Click to choose circle image
                    </span>
                    <span className="mt-1 text-xs text-[var(--kv-muted)]">
                      JPG, PNG, or WEBP up to 5MB
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
                    <label className="mb-2 block text-sm font-medium text-[var(--kv-text)]">
                      Label
                    </label>
                    <input
                      value={form.label}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          label: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-[var(--kv-border)] px-3 py-2.5 text-sm text-[var(--kv-text)] outline-none transition focus:border-[var(--kv-accent)] focus:ring-2 focus:ring-blue-100"
                      placeholder="Wedding Sarees"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--kv-text)]">
                      Catalog Category
                    </label>
                    <select
                      value={form.categoryId}
                      onChange={(event) => {
                        const categoryId = event.target.value;
                        const selected = catalogCategories.find((cat) => cat.id === categoryId);
                        setForm((current) => ({
                          ...current,
                          categoryId,
                          label: selected && !current.label ? selected.name : current.label,
                          linkUrl: selected ? `/collections/${selected.slug}` : current.linkUrl,
                        }));
                      }}
                      className="w-full rounded-xl border border-[var(--kv-border)] px-3 py-2.5 text-sm text-[var(--kv-text)] outline-none transition focus:border-[var(--kv-accent)] focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">-- Select a Category --</option>
                      {catalogCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--kv-text)]">
                      Linked Collection (Optional)
                    </label>
                    <select
                      value={form.linkUrl}
                      onChange={(event) => {
                        const val = event.target.value;
                        setForm((current) => {
                          const update: CircleFormState = { ...current, linkUrl: val };
                          // Auto prepopulate label if it's empty
                          const selectedCol = collections.find((c) => `/collections/${c.handle}` === val);
                          if (selectedCol && !current.label) {
                            update.label = selectedCol.title;
                          }
                          return update;
                        });
                      }}
                      className="w-full rounded-xl border border-[var(--kv-border)] px-3 py-2.5 text-sm text-[var(--kv-text)] outline-none transition focus:border-[var(--kv-accent)] focus:ring-2 focus:ring-blue-100"
                      required
                    >
                      <option value="">-- Select a Collection --</option>
                      {collections.map((col) => (
                        <option key={col.id} value={`/collections/${col.handle}`}>
                          {col.title}
                        </option>
                      ))}
                    </select>
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
                          setForm((current) => ({
                            ...current,
                            sortOrder: event.target.value,
                          }))
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
                    ? editingCircle
                      ? 'Saving...'
                      : 'Creating...'
                    : editingCircle
                      ? 'Save Changes'
                      : 'Create Circle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
