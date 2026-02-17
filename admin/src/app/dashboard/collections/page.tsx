'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Folder } from 'lucide-react';

interface Collection {
    id: string;
    title: string;
    handle: string;
    image?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export default function CollectionsPage() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ title: '', handle: '', image: '' });

    const fetchCollections = async () => {
        try {
            const data = await api.getCollections();
            setCollections(data?.collections || []);
        } catch (error) {
            console.error('Failed to fetch collections:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.updateCollection(editingId, formData);
            } else {
                await api.createCollection(formData);
            }
            setFormData({ title: '', handle: '', image: '' });
            setShowForm(false);
            setEditingId(null);
            fetchCollections();
        } catch (error) {
            console.error('Failed to save collection:', error);
            alert('Failed to save collection');
        }
    };

    const handleEdit = (collection: Collection) => {
        setFormData({ title: collection.title, handle: collection.handle, image: collection.image || '' });
        setEditingId(collection.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this collection?')) return;
        try {
            await api.deleteCollection(id);
            fetchCollections();
        } catch (error) {
            console.error('Failed to delete collection:', error);
            alert('Failed to delete collection');
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
                Loading collections...
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
                    <p className="text-gray-500 mt-1">Manage product collections</p>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ title: '', handle: '', image: '' }); }}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Plus size={20} />
                    Add Collection
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                        {editingId ? 'Edit Collection' : 'Create Collection'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="e.g. Summer Collection"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Handle</label>
                                <input
                                    type="text"
                                    value={formData.handle}
                                    onChange={(e) => setFormData({ ...formData, handle: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="e.g. summer-collection"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                            <input
                                type="text"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                placeholder="https://example.com/image.jpg"
                            />
                            <p className="text-xs text-gray-500 mt-1">Enter full URL to collection cover image</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                {editingId ? 'Update' : 'Create'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setEditingId(null); setFormData({ title: '', handle: '', image: '' }); }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex-1">Name</div>
                    <div className="w-40">Handle</div>
                    <div className="w-20 text-center">Actions</div>
                </div>

                {collections.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Folder size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium text-gray-900">No collections found</p>
                        <p className="mt-1 mb-6">Get started by creating your first collection.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                        >
                            <Plus size={18} />
                            Create Collection
                        </button>
                    </div>
                ) : (
                    collections.map((collection) => (
                        <div key={collection.id} className="flex items-center border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-0">
                            <div className="flex-1 py-3 px-4 flex items-center">
                                <Folder size={16} className="text-gray-400 mr-3" />
                                <span className="font-medium text-gray-900">{collection.title}</span>
                            </div>
                            <div className="w-40 py-3 px-4 text-sm text-gray-500">
                                /collections/{collection.handle}
                            </div>
                            <div className="w-20 py-3 px-4 flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(collection)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(collection.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
