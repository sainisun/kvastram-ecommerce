'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Plus, Trash2, Edit2, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PostsPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const data = await api.getPosts();
            if (data && Array.isArray(data.posts)) {
                setPosts(data.posts);
            } else {
                console.error('Unexpected response shape from getPosts:', data);
                setPosts([]);
            }
        } catch (error) {
            console.error('Failed to load posts:', error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await api.deletePost(id);
            loadPosts(); // Reload list
        } catch (error) {
            alert('Failed to delete post');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Blog Posts</h1>
                    <p className="text-gray-500">Manage articles and news</p>
                </div>
                <Link
                    href="/dashboard/content/posts/new"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Create Post
                </Link>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
                    <p className="text-gray-500 mb-4">Start writing your first article.</p>
                    <Link
                        href="/dashboard/content/posts/new"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Create a post
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">Title</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">Published</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {posts.map((post) => (
                                <tr key={post.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div className="font-medium text-gray-800">{post.title}</div>
                                        <div className="text-xs text-gray-400">/{post.slug}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex px-2 py-1 rounded text-xs font-bold uppercase
                                            ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}
                                        `}>
                                            {post.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-500">
                                        {post.published_at ? new Date(post.published_at).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/dashboard/content/posts/${post.id}`}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Edit2 size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(post.id)}
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
