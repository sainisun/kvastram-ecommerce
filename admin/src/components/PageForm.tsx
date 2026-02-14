'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/components/editor/RichTextEditor';

interface PageFormProps {
    initialData?: any;
    isEdit?: boolean;
}

export default function PageForm({ initialData, isEdit }: PageFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState(initialData || {
        title: '',
        slug: '',
        content: '',
        is_visible: true,
        seo_title: '',
        seo_description: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => {
            const updates: any = { [name]: value };
            if (name === 'title' && !isEdit && !prev.slug) {
                updates.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            }
            if (name === 'is_visible') {
                updates.is_visible = value === 'true';
            }
            return { ...prev, ...updates };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await api.updatePage(initialData.id, formData);
            } else {
                await api.createPage(formData);
            }
            router.push('/dashboard/content/pages');
        } catch (error: any) {
            alert(error.message || 'Failed to save page');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/content/pages"
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Page' : 'Create Page'}</h1>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save Page'}
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
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Content</label>
                            <RichTextEditor
                                content={formData.content}
                                onChange={(content) => setFormData((prev: any) => ({ ...prev, content }))}
                                placeholder="Write your page content here..."
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-800">Settings</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">Visibility</label>
                            <select
                                name="is_visible"
                                value={String(formData.is_visible)}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg"
                            >
                                <option value="true">Visible</option>
                                <option value="false">Hidden</option>
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
                        <h3 className="font-bold text-gray-800">SEO</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">SEO Title</label>
                            <input
                                name="seo_title"
                                value={formData.seo_title}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Meta Description</label>
                            <textarea
                                name="seo_description"
                                rows={3}
                                value={formData.seo_description}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
