'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Plus, Trash2, Edit2, FileText } from 'lucide-react';

export default function PagesPage() {
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPages();
    }, []);

    const loadPages = async () => {
        try {
            const data = await api.getPages();
            if (data && Array.isArray(data.pages)) {
                setPages(data.pages);
            } else {
                console.error('Unexpected response shape from getPages:', data);
                setPages([]);
            }
        } catch (error) {
            console.error('Failed to load pages:', error);
            setPages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this page?')) return;
        try {
            await api.deletePage(id);
            loadPages();
        } catch (error) {
            alert('Failed to delete page');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Pages</h1>
                    <p className="text-gray-500">Manage legal and content pages</p>
                </div>
                <Link
                    href="/dashboard/content/pages/new"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Create Page
                </Link>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : pages.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900">No pages yet</h3>
                    <Link
                        href="/dashboard/content/pages/new"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Create a page
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">Title</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">Slug</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">Visible</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pages.map((page) => (
                                <tr key={page.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium text-gray-800">{page.title}</td>
                                    <td className="py-3 px-4 text-gray-500">/{page.slug}</td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex px-2 py-1 rounded text-xs font-bold uppercase
                                            ${page.is_visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}
                                        `}>
                                            {page.is_visible ? 'Visible' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/dashboard/content/pages/${page.id}`}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Edit2 size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(page.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
