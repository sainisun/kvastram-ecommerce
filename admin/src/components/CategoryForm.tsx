'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Save, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parent_id?: string;
    image?: string;
    is_active?: boolean;
}

interface CategoryFormProps {
    initialData?: Category;
}

export default function CategoryForm({ initialData }: CategoryFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState<Category[]>([]); // For parent selection

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        slug: initialData?.slug || '',
        description: initialData?.description || '',
        parent_id: initialData?.parent_id || '', // Empty string for no parent
        image: initialData?.image || '',
        is_active: initialData?.is_active ?? true,
    });

    useEffect(() => {
        // Fetch categories for parent dropdown
        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                if (token) {
                    const data = await api.getCategories(token); // Flat list
                    // Filter out current category (can't be own parent)
                    const filtered = initialData
                        ? data.categories.filter((c: Category) => c.id !== initialData.id)
                        : data.categories;
                    setCategories(filtered);
                }
            } catch (err) {
                console.error("Failed to fetch categories for parent select", err);
            }
        };
        fetchCategories();
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto-generate slug from name if creating new
        if (name === 'name' && !initialData) {
            setFormData(prev => ({
                ...prev,
                slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
            }));
        }
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('adminToken');
            if (!token) throw new Error('Not authenticated');

            const payload = {
                ...formData,
                parent_id: formData.parent_id === '' ? null : formData.parent_id // Convert empty string to null
            };

            if (initialData) {
                await api.updateCategory(token, initialData.id, payload);
            } else {
                await api.createCategory(token, payload);
            }

            router.push('/dashboard/categories');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to save category');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <Link href="/dashboard/categories" className="flex items-center text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Categories
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">{initialData ? 'Edit Category' : 'New Category'}</h1>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                    <AlertCircle size={20} className="mr-2" />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 block">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none"
                            placeholder="e.g. Summer Collection"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 block">Slug</label>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 focus:ring-2 focus:ring-black focus:border-black transition-all outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">Parent Category</label>
                    <select
                        name="parent_id"
                        value={formData.parent_id}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none"
                    >
                        <option value="">None (Top Level)</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">Description (Optional)</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none resize-none"
                        placeholder="Describe this category..."
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="is_active"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Visible on Storefront?
                    </label>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : (
                            <>
                                <Save size={18} />
                                Save Category
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
