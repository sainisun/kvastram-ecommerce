'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Trash2, Tag as TagIcon, X } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [error, setError] = useState('');

  const fetchTags = async () => {
    try {
      const data = await api.getTags();
      setTags(data.tags);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newTagName.trim()) return;

    try {
      const slug = newTagName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      await api.createTag({ name: newTagName, slug });
      setNewTagName('');
      setIsCreating(false);
      fetchTags();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      await api.deleteTag(id);
      fetchTags();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete tag');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-[var(--kv-muted)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--kv-text)] mr-3"></div>
        Loading tags...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--kv-text)]">Tags</h1>
          <p className="text-[var(--kv-muted)] mt-1">
            Manage product tags for filtering and organization
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--kv-text)] text-[var(--kv-card)] rounded-lg hover:bg-[var(--kv-text)] transition-colors"
        >
          <Plus size={20} />
          Add Tag
        </button>
      </div>

      {/* Create Tag Modal/Form */}
      {isCreating && (
        <div className="fixed inset-0 bg-[var(--kv-text)]/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--kv-card)] rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">New Tag</h2>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                aria-label="Close tag form"
                className="text-[var(--kv-muted)] hover:text-[var(--kv-text)]"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="bg-[var(--kv-danger)]/10 text-[var(--kv-danger)] text-sm p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--kv-text)] mb-1">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--kv-border)] rounded-lg focus:ring-2 focus:ring-black focus:border-[var(--kv-text)] outline-none"
                  placeholder="e.g. New Arrival, Sale, Exclusive"
                  autoFocus
                />
                <p className="text-xs text-[var(--kv-muted)] mt-1">
                  Slug will be auto-generated.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-[var(--kv-text)] hover:bg-[var(--kv-soft)] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTagName.trim()}
                  className="px-4 py-2 bg-[var(--kv-text)] text-[var(--kv-card)] rounded-lg hover:bg-[var(--kv-text)] transition-colors disabled:opacity-50"
                >
                  Create Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-[var(--kv-card)] rounded-xl shadow-sm border border-[var(--kv-border)] overflow-hidden">
        {tags.length === 0 ? (
          <div className="p-12 text-center text-[var(--kv-muted)]">
            <TagIcon size={48} className="mx-auto mb-4 text-[var(--kv-muted)]" />
            <p className="text-lg font-medium text-[var(--kv-text)]">No tags found</p>
            <p className="mt-1">
              Create tags to help customers filter products.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="p-4 flex items-center justify-between hover:bg-[var(--kv-soft)] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--kv-soft)] flex items-center justify-center text-[var(--kv-muted)]">
                    <TagIcon size={14} />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--kv-text)]">{tag.name}</p>
                    <p className="text-xs text-[var(--kv-muted)]">/{tag.slug}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(tag.id)}
                  aria-label={`Delete tag ${tag.name}`}
                  className="p-2 text-[var(--kv-muted)] hover:text-[var(--kv-danger)] hover:bg-[var(--kv-danger)]/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Tag"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
