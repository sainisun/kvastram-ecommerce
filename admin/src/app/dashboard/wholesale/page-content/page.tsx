'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Edit2, Eye, EyeOff, Save, X } from 'lucide-react';

interface WholesalePage {
  id: string;
  title: string;
  description?: string;
  hero_title?: string;
  hero_subtitle?: string;
  body_html?: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
}

interface WholesalePageWithSlug extends WholesalePage {
  slug: string;
}

interface PagesResponse {
  pages?: WholesalePageWithSlug[];
}

export default function WholesalePageManagerPage() {
  const [page, setPage] = useState<WholesalePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = useCallback(async () => {
    try {
      const data = (await api.getPages()) as PagesResponse;
      const wholesalePage = data?.pages?.find((p) => p.slug === 'wholesale');
      if (wholesalePage) {
        setPage(wholesalePage);
      }
    } catch (error) {
      console.error('Failed to fetch page:', error);
      setError('Failed to load wholesale page');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  const showSuccess = (message: string) => {
    const successMsg = document.createElement('div');
    successMsg.className =
      'fixed top-4 right-4 z-[100] bg-[var(--kv-success)]/10 border border-[var(--kv-success)]/30 text-[var(--kv-success)] px-4 py-3 rounded-lg';
    successMsg.textContent = message;
    document.body.appendChild(successMsg);
    window.setTimeout(() => successMsg.remove(), 3000);
  };

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    setError('');
    try {
      await api.updatePage(page.id, page);
      setEditing(false);
      showSuccess('Wholesale page saved!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!page) return;

    const newPage = { ...page, is_published: !page.is_published };
    setSaving(true);
    setError('');

    try {
      await api.updatePage(page.id, newPage);
      setPage(newPage);
      showSuccess(newPage.is_published ? 'Page published!' : 'Page unpublished!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-[var(--kv-muted)]">
        <div className="mr-3 h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--kv-text)]" />
        Loading page...
      </div>
    );
  }

  if (!page) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <div className="rounded-lg border border-[var(--kv-accent)]/30 bg-[var(--kv-accent)]/10 px-4 py-3 text-[var(--kv-accent-deep)]">
          Wholesale page not found. You may need to create it first.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--kv-text)]">Wholesale Page</h1>
          <p className="mt-1 text-[var(--kv-muted)]">
            Manage the wholesale section content and visibility
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTogglePublish}
            disabled={saving}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
              page.is_published
                ? 'border border-[var(--kv-success)]/30 bg-[var(--kv-success)]/10 text-[var(--kv-success)] hover:bg-[var(--kv-success)]/10'
                : 'border border-[var(--kv-border)] bg-[var(--kv-soft)] text-[var(--kv-text)] hover:bg-[var(--kv-border)]'
            } disabled:opacity-50`}
          >
            {page.is_published ? (
              <>
                <Eye size={18} />
                Published
              </>
            ) : (
              <>
                <EyeOff size={18} />
                Draft
              </>
            )}
          </button>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-lg bg-[var(--kv-text)] px-4 py-2 text-[var(--kv-card)] transition-colors hover:bg-[var(--kv-text)]"
            >
              <Edit2 size={18} />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-2 rounded-lg bg-[var(--kv-soft)] px-4 py-2 text-[var(--kv-text)] transition-colors hover:bg-[var(--kv-border)]"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[var(--kv-accent)] px-4 py-2 text-[var(--kv-card)] transition-colors hover:bg-[var(--kv-accent-deep)] disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-[var(--kv-danger)]/30 bg-[var(--kv-danger)]/10 px-4 py-3 text-[var(--kv-danger)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--kv-text)]">
              Page Title
            </h3>
            {editing ? (
              <input
                type="text"
                value={page.title}
                onChange={(e) => setPage({ ...page, title: e.target.value })}
                className="w-full rounded-lg border border-[var(--kv-border)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-lg font-semibold text-[var(--kv-text)]">{page.title}</p>
            )}
          </div>

          <div className="rounded-xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--kv-text)]">
              Hero Section
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--kv-text)]">
                  Hero Title
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={page.hero_title || ''}
                    onChange={(e) =>
                      setPage({ ...page, hero_title: e.target.value })
                    }
                    className="w-full rounded-lg border border-[var(--kv-border)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-[var(--kv-text)]">
                    {page.hero_title || 'No hero title'}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--kv-text)]">
                  Hero Subtitle
                </label>
                {editing ? (
                  <textarea
                    value={page.hero_subtitle || ''}
                    onChange={(e) =>
                      setPage({ ...page, hero_subtitle: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-lg border border-[var(--kv-border)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-[var(--kv-text)]">
                    {page.hero_subtitle || 'No subtitle'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--kv-text)]">
              Body Content
            </h3>
            {editing ? (
              <textarea
                value={page.body_html || ''}
                onChange={(e) => setPage({ ...page, body_html: e.target.value })}
                rows={10}
                className="w-full rounded-lg border border-[var(--kv-border)] px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: page.body_html || '<p>No content</p>',
                }}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--kv-text)]">
              SEO
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--kv-text)]">
                  Meta Title
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={page.meta_title || ''}
                    onChange={(e) =>
                      setPage({ ...page, meta_title: e.target.value })
                    }
                    className="w-full rounded-lg border border-[var(--kv-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-xs text-[var(--kv-text)]">
                    {page.meta_title || 'Not set'}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--kv-text)]">
                  Meta Description
                </label>
                {editing ? (
                  <textarea
                    value={page.meta_description || ''}
                    onChange={(e) =>
                      setPage({ ...page, meta_description: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-lg border border-[var(--kv-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-xs text-[var(--kv-text)]">
                    {page.meta_description || 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--kv-border)] bg-[var(--kv-card)] p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--kv-text)]">
              Preview
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-xs text-[var(--kv-muted)]">Title</p>
                <p className="truncate font-semibold text-[var(--kv-accent-deep)]">
                  {page.title}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-[var(--kv-muted)]">Meta Description</p>
                <p className="line-clamp-2 text-xs text-[var(--kv-text)]">
                  {page.meta_description || 'No description set'}
                </p>
              </div>
              <div className="border-t border-[var(--kv-border)] pt-3">
                <p className="mb-2 text-xs text-[var(--kv-muted)]">Publishing</p>
                {page.is_published ? (
                  <span className="font-medium text-[var(--kv-success)]">Published</span>
                ) : (
                  <span className="font-medium text-[var(--kv-text)]">Draft</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
