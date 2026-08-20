'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ArrowUp, ArrowDown, Eye, EyeOff, Save } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji?: string;
  image?: string;
  header_image_url?: string;
  display_order: number;
  show_in_header: boolean;
  parent_id?: string;
  children?: Category[];
}

export default function HeaderNavigationPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const data = await api.getCategoriesTree();
      // Filter to categories where show_in_header = true
      const headerCats = (data?.categories || []).filter(
        (cat: Category) => cat.show_in_header
      );
      // Sort by display_order
      const sorted = headerCats.sort(
        (a: Category, b: Category) => a.display_order - b.display_order
      );
      setCategories(sorted);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newCategories = [...categories];
    const temp = newCategories[index].display_order;
    newCategories[index].display_order =
      newCategories[index - 1].display_order;
    newCategories[index - 1].display_order = temp;

    // Swap positions
    const tempCat = newCategories[index];
    newCategories[index] = newCategories[index - 1];
    newCategories[index - 1] = tempCat;

    setCategories(newCategories);
  };

  const moveDown = (index: number) => {
    if (index === categories.length - 1) return;
    const newCategories = [...categories];
    const temp = newCategories[index].display_order;
    newCategories[index].display_order =
      newCategories[index + 1].display_order;
    newCategories[index + 1].display_order = temp;

    // Swap positions
    const tempCat = newCategories[index];
    newCategories[index] = newCategories[index + 1];
    newCategories[index + 1] = tempCat;

    setCategories(newCategories);
  };

  const handleShowInHeaderToggle = (id: string) => {
    setCategories(
      categories.map((cat) =>
        cat.id === id ? { ...cat, show_in_header: !cat.show_in_header } : cat
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updates = categories.map((cat) => ({
        id: cat.id,
        display_order: cat.display_order,
        show_in_header: cat.show_in_header,
      }));

      await api.updateCategoriesOrder(updates);
      setError('');
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className =
        'fixed top-4 right-4 bg-[var(--kv-success)]/10 border border-[var(--kv-success)]/30 text-[var(--kv-success)] px-4 py-3 rounded-lg';
      successMsg.textContent = 'Header navigation saved!';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-[var(--kv-muted)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--kv-text)] mr-3"></div>
        Loading navigation...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--kv-text)]">
          Header Navigation Manager
        </h1>
        <p className="text-[var(--kv-muted)] mt-1">
          Manage which categories appear in the storefront header and their order
        </p>
      </div>

      {error && (
        <div className="bg-[var(--kv-danger)]/10 border border-[var(--kv-danger)]/30 text-[var(--kv-danger)] px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-[var(--kv-card)] rounded-xl shadow-sm border border-[var(--kv-border)] overflow-hidden mb-6">
        <div className="border-b border-[var(--kv-border)] bg-[var(--kv-soft)] px-4 py-3 grid grid-cols-12 gap-4 text-xs font-medium text-[var(--kv-muted)] uppercase tracking-wider">
          <div className="col-span-5">Category</div>
          <div className="col-span-2 text-center">Image</div>
          <div className="col-span-2 text-center">Visible</div>
          <div className="col-span-3 text-center">Actions</div>
        </div>

        {categories.length === 0 ? (
          <div className="p-12 text-center text-[var(--kv-muted)]">
            <p className="text-lg font-medium text-[var(--kv-text)]">
              No categories in header
            </p>
            <p className="mt-1">
              Enable &quot;Show in Header&quot; in category settings to see them
              here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="px-4 py-3 flex items-center gap-4 hover:bg-[var(--kv-soft)] transition-colors grid grid-cols-12"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    {category.emoji && (
                      <span className="text-2xl">{category.emoji}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--kv-text)]">
                      {category.name}
                    </p>
                    <p className="text-xs text-[var(--kv-muted)]">{category.slug}</p>
                    {category.children && category.children.length > 0 && (
                      <p className="text-xs text-[var(--kv-muted)] mt-1">
                        {category.children.length} subcategories
                      </p>
                    )}
                  </div>
                </div>

                <div className="col-span-2 text-center">
                  {category.header_image_url || category.image ? (
                    <img
                      src={category.header_image_url || category.image}
                      alt={category.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <span className="text-xs text-[var(--kv-muted)]">No image</span>
                  )}
                </div>

                <div className="col-span-2 flex justify-center">
                  <button
                    onClick={() => handleShowInHeaderToggle(category.id)}
                    className="p-2 rounded text-[var(--kv-muted)] hover:text-[var(--kv-text)] transition-colors"
                  >
                    {category.show_in_header ? (
                      <Eye size={18} className="text-[var(--kv-accent-deep)]" />
                    ) : (
                      <EyeOff size={18} />
                    )}
                  </button>
                </div>

                <div className="col-span-3 flex justify-center gap-1">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-2 rounded text-[var(--kv-muted)] hover:text-[var(--kv-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ArrowUp size={18} />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === categories.length - 1}
                    className="p-2 rounded text-[var(--kv-muted)] hover:text-[var(--kv-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ArrowDown size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {categories.length > 0 && (
        <>
          <div className="mb-8 p-6 bg-[var(--kv-soft)] rounded-lg border border-[var(--kv-border)]">
            <h3 className="font-semibold text-[var(--kv-text)] mb-3">Live Preview</h3>
            <p className="text-xs text-[var(--kv-text)] mb-4">
              Header will show these categories in this order:
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="px-3 py-1 bg-[var(--kv-card)] border border-[var(--kv-border)] rounded text-sm text-[var(--kv-text)] flex items-center gap-2"
                >
                  {cat.emoji && <span>{cat.emoji}</span>}
                  <span>{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[var(--kv-text)] text-[var(--kv-card)] rounded-lg hover:bg-[var(--kv-text)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save size={18} />
                  Save Order
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
