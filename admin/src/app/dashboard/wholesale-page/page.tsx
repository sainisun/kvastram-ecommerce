'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Edit2, Save, X, Plus, Trash2, FileDown, Eye, EyeOff } from 'lucide-react';

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

export default function WholesalePageManagerPage() {
  const [page, setPage] = useState<WholesalePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const fetchPage = async () => {
    try {
      const data = await api.getPages();
      const wholesalePage = data?.pages?.find(
        (p: any) => p.slug === 'wholesale'
      );
      if (wholesalePage) {
        setPage(wholesalePage);
        setPreviewTitle(wholesalePage.title);
      }
    } catch (error) {
      console.error('Failed to fetch page:', error);
      setError('Failed to load wholesale page');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage();
  }, []);

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    setError('');
    try {
      await api.updatePage(page.id, page);
      setError('');
      setEditing(false);
      const successMsg = document.createElement('div');
      successMsg.className =
        'fixed top-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg';
      successMsg.textContent = 'Wholesale page saved!';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save page');
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

      const successMsg = document.createElement('div');
      successMsg.className =
        'fixed top-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg';
      successMsg.textContent = newPage.is_published
        ? 'Page published!'
        : 'Page unpublished!';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
        Loading page...
      </div>
    );
  }

  if (!page) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          Wholesale page not found. You may need to create it first.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wholesale Page</h1>
          <p className="text-gray-500 mt-1">
            Manage the wholesale section content and visibility
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTogglePublish}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              page.is_published
                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
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
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Edit2 size={18} />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Form/View */}
      <div className="grid grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Title Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Page Title
            </h3>
            {editing ? (
              <input
                type="text"
                value={page.title}
                onChange={(e) =>
                  setPage({ ...page, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-lg font-semibold text-gray-900">
                {page.title}
              </p>
            )}
          </div>

          {/* Hero Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Hero Section
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Hero Title
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={page.hero_title || ''}
                    onChange={(e) =>
                      setPage({ ...page, hero_title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-700">
                    {page.hero_title || 'No hero title'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Hero Subtitle
                </label>
                {editing ? (
                  <textarea
                    value={page.hero_subtitle || ''}
                    onChange={(e) =>
                      setPage({ ...page, hero_subtitle: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-600">
                    {page.hero_subtitle || 'No subtitle'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Body Content
            </h3>
            {editing ? (
              <textarea
                value={page.body_html || ''}
                onChange={(e) =>
                  setPage({ ...page, body_html: e.target.value })
                }
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
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

        {/* Sidebar - SEO & Preview */}
        <div className="space-y-6">
          {/* SEO */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              SEO
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Meta Title
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={page.meta_title || ''}
                    onChange={(e) =>
                      setPage({ ...page, meta_title: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-xs text-gray-600">
                    {page.meta_title || 'Not set'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Meta Description
                </label>
                {editing ? (
                  <textarea
                    value={page.meta_description || ''}
                    onChange={(e) =>
                      setPage({ ...page, meta_description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-xs text-gray-600">
                    {page.meta_description || 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Preview
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">Title</p>
                <p className="font-semibold text-blue-600 truncate">
                  {page.title}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Meta Description</p>
                <p className="text-gray-700 text-xs line-clamp-2">
                  {page.meta_description || 'No description set'}
                </p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Publishing</p>
                <p className="text-sm">
                  {page.is_published ? (
                    <span className="text-green-600 font-medium">
                      ✓ Published
                    </span>
                  ) : (
                    <span className="text-gray-600 font-medium">Draft</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
