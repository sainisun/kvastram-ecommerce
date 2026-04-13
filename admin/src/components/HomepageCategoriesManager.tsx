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

interface HomepageCategory {
  id: string;
  image_url: string;
  name: string;
  link_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface CategoryFormState {
  name: string;
  linkUrl: string;
  sortOrder: string;
  isActive: boolean;
  imageFile: File | null;
  imagePreview: string;
}

const emptyForm = (): CategoryFormState => ({
  name: '',
  linkUrl: '',
  sortOrder: '0',
  isActive: true,
  imageFile: null,
  imagePreview: '',
});

export default function HomepageCategoriesManager() {
  const [categories, setCategories] = useState<HomepageCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HomepageCategory | null>(
    null
  );
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const previewUrlRef = useRef<string>('');

  useEffect(() => {
    void loadCategories();

    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const response = await api.getHomepageCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to load homepage categories:', error);
      alert('Failed to load homepage categories');
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
    setEditingCategory(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  }

  function openEditModal(category: HomepageCategory) {
    resetPreviewUrl();
    setEditingCategory(category);
    setForm({
      name: category.name,
      linkUrl: category.link_url,
      sortOrder: String(category.sort_order),
      isActive: category.is_active,
      imageFile: null,
      imagePreview: category.image_url,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    resetPreviewUrl();
    setIsModalOpen(false);
    setEditingCategory(null);
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
    formData.append('name', form.name);
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

    if (!editingCategory && !form.imageFile) {
      alert('Please choose an image');
      return;
    }

    try {
      setSaving(true);

      if (editingCategory) {
        await api.updateHomepageCategory(editingCategory.id, buildFormData());
      } else {
        await api.createHomepageCategory(buildFormData());
      }

      closeModal();
      await loadCategories();
    } catch (error) {
      console.error('Failed to save homepage category:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to save homepage category'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      setTogglingId(id);
      await api.toggleHomepageCategory(id);
      await loadCategories();
    } catch (error) {
      console.error('Failed to toggle homepage category:', error);
      alert('Failed to toggle homepage category');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this homepage category card?')) {
      return;
    }

    try {
      setDeletingId(id);
      await api.deleteHomepageCategory(id);
      await loadCategories();
    } catch (error) {
      console.error('Failed to delete homepage category:', error);
      alert('Failed to delete homepage category');
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = categories.filter((category) => category.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Categories</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage the premium category cards shown on the storefront homepage.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add New Category
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Cards</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{categories.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {categories.length - activeCount}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
          Loading homepage categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <FolderOpen size={24} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No homepage category cards yet
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Add your first category card to populate the Categories slider.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add New Category
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-[220px_1fr_auto]"
            >
              <div className="relative h-[300px] overflow-hidden rounded-md bg-gray-100">
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  sizes="220px"
                  className="object-cover"
                />
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    Sort #{category.sort_order}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      category.is_active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-semibold tracking-[0.14em] text-gray-900 uppercase">
                    {category.name}
                  </h2>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.3em] text-gray-500">
                    Explore Collection
                  </p>
                </div>

                <p className="break-all text-sm text-gray-600">
                  <span className="font-medium text-gray-900">Link:</span>{' '}
                  {category.link_url}
                </p>
              </div>

              <div className="flex flex-col gap-2 lg:w-44">
                <button
                  type="button"
                  onClick={() => handleToggle(category.id)}
                  disabled={togglingId === category.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {category.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  {togglingId === category.id
                    ? 'Updating...'
                    : category.is_active
                      ? 'Deactivate'
                      : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(category)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(category.id)}
                  disabled={deletingId === category.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  {deletingId === category.id ? 'Deleting...' : 'Delete'}
                </button>
                <a
                  href={category.link_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
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
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCategory ? 'Edit Homepage Category' : 'Add Homepage Category'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Upload the portrait image and destination link for the Categories slider.
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
              <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Category Image {editingCategory ? '' : '*'}
                  </label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                    {form.imagePreview ? (
                      // Local object URLs are only used for temporary client-side preview.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.imagePreview}
                        alt="Category preview"
                        className="mb-4 h-[300px] w-[220px] rounded-md object-cover"
                      />
                    ) : (
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                        <Upload size={22} />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      Click to choose category image
                    </span>
                    <span className="mt-1 text-xs text-gray-500">
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
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Category Name
                    </label>
                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="Summer Sarees"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Link URL
                    </label>
                    <input
                      value={form.linkUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          linkUrl: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="/products?category_id=..."
                      required
                    />
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
                    ? editingCategory
                      ? 'Saving...'
                      : 'Creating...'
                    : editingCategory
                      ? 'Save Changes'
                      : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
