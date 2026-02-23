'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Save, Image as ImageIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/components/editor/RichTextEditor';

interface PostFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function PostForm({ initialData, isEdit }: PostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState(
    initialData || {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      cover_image: '',
      status: 'draft',
      seo_title: '',
      seo_description: '',
      seo_keywords: '',
    }
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => {
      const updates: any = { [name]: value };
      // Auto-generate slug from title if creating and not manually editing slug
      if (name === 'title' && !isEdit && !prev.slug) {
        updates.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
      return { ...prev, ...updates };
    });
  };

  const handleUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large (max 5MB)');
      return;
    }
    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      setFormData((prev: any) => ({ ...prev, cover_image: res.url }));
    } catch (error) {
      console.error(error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        published_at:
          formData.status === 'published'
            ? formData.published_at || new Date().toISOString()
            : null,
      };

      if (isEdit) {
        if (!initialData?.id) {
          throw new Error('Missing post ID for update');
        }
        await api.updatePost(initialData.id, payload);
      } else {
        await api.createPost(payload);
      }
      router.push('/dashboard/content/posts');
    } catch (error: any) {
      alert(error.message || 'Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/content/posts"
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEdit ? 'Edit Post' : 'Create Post'}
            </h1>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {loading ? 'Saving...' : 'Save Post'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg text-lg font-bold"
                placeholder="Enter post title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) =>
                  setFormData((prev: any) => ({ ...prev, content }))
                }
                placeholder="Write your post content here..."
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800">SEO Settings</h3>
            <div>
              <label className="block text-sm font-medium mb-1">
                SEO Title
              </label>
              <input
                name="seo_title"
                value={formData.seo_title}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder={formData.title}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Meta Description
              </label>
              <textarea
                name="seo_description"
                rows={3}
                value={formData.seo_description}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Keywords (comma separated)
              </label>
              <input
                name="seo_keywords"
                value={formData.seo_keywords}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="fashion, luxury, silk"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800">Publishing</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                name="slug"
                required
                value={formData.slug}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-sm"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800">Featured Image</h3>
            {formData.cover_image ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={formData.cover_image}
                  alt="Cover"
                  className="w-full h-auto object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev: any) => ({ ...prev, cover_image: '' }))
                  }
                  className="absolute top-2 right-2 bg-white text-red-600 p-1.5 rounded-full shadow hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : null}
            <label className="cursor-pointer block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50">
              <ImageIcon className="mx-auto text-gray-400 mb-2" size={24} />
              <span className="text-sm text-gray-600">
                {uploading ? 'Uploading...' : 'Upload Image'}
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] && handleUpload(e.target.files[0])
                }
                disabled={uploading}
              />
            </label>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800">Excerpt</h3>
            <textarea
              name="excerpt"
              rows={4}
              value={formData.excerpt}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg text-sm"
              placeholder="Short summary for lists..."
            />
          </div>
        </div>
      </div>
    </form>
  );
}
