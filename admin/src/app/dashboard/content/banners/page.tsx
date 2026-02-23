'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Plus,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  Edit2,
  ChevronUp,
  ChevronDown,
  X,
  GripVertical,
} from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link?: string;
  button_text?: string;
  position: number;
  is_active: boolean;
  section: string;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [reordering, setReordering] = useState(false);

  // New Banner Form
  const [newItem, setNewItem] = useState({
    title: '',
    image_url: '',
    link: '',
    button_text: '',
    section: 'hero',
    is_active: true,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const data = await api.getBanners();
      if (data && Array.isArray(data.banners)) {
        setBanners(data.banners);
      } else {
        console.error('Unexpected response shape from getBanners:', data);
        setBanners([]);
      }
    } catch (error) {
      console.error('Failed to load banners:', error);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBanner({
        ...newItem,
        position: banners.length, // Append to end
      });

      setNewItem({
        title: '',
        image_url: '',
        link: '',
        button_text: '',
        section: 'hero',
        is_active: true,
      });
      setCreating(false);
      loadBanners();
    } catch (error) {
      alert('Failed to create banner');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    try {
      await api.updateBanner(editingBanner.id, {
        title: editingBanner.title,
        image_url: editingBanner.image_url,
        link: editingBanner.link,
        button_text: editingBanner.button_text,
        section: editingBanner.section,
        is_active: editingBanner.is_active,
      });

      setEditing(false);
      setEditingBanner(null);
      loadBanners();
    } catch (error) {
      alert('Failed to update banner');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await api.deleteBanner(id);
      loadBanners();
    } catch (error) {
      alert('Failed to delete banner');
    }
  };

  const handleReorder = async (bannerId: string, direction: 'up' | 'down') => {
    const currentIndex = banners.findIndex((b) => b.id === bannerId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    // Swap positions
    const newBanners = [...banners];
    const temp = newBanners[currentIndex];
    newBanners[currentIndex] = newBanners[newIndex];
    newBanners[newIndex] = temp;

    // Update positions
    const updatedBanners = newBanners.map((banner, index) => ({
      ...banner,
      position: index,
    }));

    setBanners(updatedBanners);

    // Save to backend
    try {
      const items = updatedBanners.map((b) => ({
        id: b.id,
        position: b.position,
      }));

      await api.reorderBanners(items);
    } catch (error) {
      alert('Failed to save reorder');
      loadBanners(); // Reload original order
    }
  };

  const handleUpload = async (file: File, isEditing = false) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large (max 5MB)');
      return;
    }
    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      if (res && typeof res.url === 'string' && res.url.length > 0) {
        if (isEditing && editingBanner) {
          setEditingBanner({ ...editingBanner, image_url: res.url });
        } else {
          setNewItem((prev) => ({ ...prev, image_url: res.url }));
        }
      } else {
        console.error('Upload response missing valid URL:', res);
        alert('Upload failed: Invalid response from server');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner({ ...banner });
    setEditing(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Banners</h1>
          <p className="text-gray-500">Manage homepage banners and sliders</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setReordering(!reordering)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${reordering ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <GripVertical size={18} />
            {reordering ? 'Done Reordering' : 'Reorder'}
          </button>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Banner
          </button>
        </div>
      </div>

      {/* Create Form Modal */}
      {creating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">New Banner</h2>
              <button
                onClick={() => setCreating(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title *
                  </label>
                  <input
                    required
                    value={newItem.title}
                    onChange={(e) =>
                      setNewItem({ ...newItem, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Link (Optional)
                  </label>
                  <input
                    value={newItem.link}
                    onChange={(e) =>
                      setNewItem({ ...newItem, link: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="/products/collection-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Button Text (Optional)
                  </label>
                  <input
                    value={newItem.button_text}
                    onChange={(e) =>
                      setNewItem({ ...newItem, button_text: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Shop Now"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Section
                  </label>
                  <select
                    value={newItem.section}
                    onChange={(e) =>
                      setNewItem({ ...newItem, section: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="hero">Hero Slider</option>
                    <option value="promo">Promo Banner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Image *
                </label>
                <div className="flex items-center gap-4">
                  {newItem.image_url && (
                    <img
                      src={newItem.image_url}
                      alt="Preview"
                      className="h-32 w-48 object-cover rounded-lg border"
                    />
                  )}
                  <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
                    <span className="flex items-center gap-2">
                      <ImageIcon size={18} />
                      {uploading ? 'Uploading...' : 'Choose Image'}
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
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !newItem.image_url}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {editing && editingBanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Banner</h2>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditingBanner(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title *
                  </label>
                  <input
                    required
                    value={editingBanner.title}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Link (Optional)
                  </label>
                  <input
                    value={editingBanner.link || ''}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        link: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="/products/collection-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Button Text (Optional)
                  </label>
                  <input
                    value={editingBanner.button_text || ''}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        button_text: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Shop Now"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Section
                  </label>
                  <select
                    value={editingBanner.section}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        section: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="hero">Hero Slider</option>
                    <option value="promo">Promo Banner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editingBanner.is_active ? 'true' : 'false'}
                  onChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      is_active: e.target.value === 'true',
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image</label>
                <div className="flex items-center gap-4">
                  {editingBanner.image_url && (
                    <img
                      src={editingBanner.image_url}
                      alt="Preview"
                      className="h-32 w-48 object-cover rounded-lg border"
                    />
                  )}
                  <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
                    <span className="flex items-center gap-2">
                      <ImageIcon size={18} />
                      {uploading ? 'Uploading...' : 'Change Image'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleUpload(e.target.files[0], true)
                      }
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setEditingBanner(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div>Loading...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No banners found. Create one to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="flex items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-4"
            >
              {reordering && (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleReorder(banner.id, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => handleReorder(banner.id, 'down')}
                    disabled={index === banners.length - 1}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}
              <div className="w-10 flex flex-col items-center text-gray-400">
                <div className="font-mono text-xs">{banner.position}</div>
              </div>
              <img
                src={banner.image_url}
                alt={banner.title}
                className="h-16 w-32 object-cover rounded-lg bg-gray-100"
              />
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{banner.title}</h3>
                <p className="text-sm text-gray-500">
                  {banner.section} •{' '}
                  {banner.is_active ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-500">Inactive</span>
                  )}
                </p>
                {banner.link && (
                  <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                    <ExternalLink size={10} /> {banner.link}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(banner)}
                  className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
                  title="Edit"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
