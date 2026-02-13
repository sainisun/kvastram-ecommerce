'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Package, Plus, Edit, Trash2, Search, Filter, Download,
    Eye, Archive, CheckSquare, Square, AlertTriangle, TrendingUp,
    Box, PackageX, X, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { exportToCSV, formatProductsForExport } from '@/lib/csv-export';

interface Product {
    id: string;
    title: string;
    handle: string;
    description: string | null;
    status: 'draft' | 'published' | 'archived';
    thumbnail: string | null;
    created_at: string;
    variant_count: number;
    total_inventory: number;
}

interface ProductStats {
    total_products: number;
    published_products: number;
    draft_products: number;
    low_stock_products: number;
    out_of_stock_products: number;
}

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState<ProductStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Search & Filtering
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');

    // Selection & Pagination
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Bulk Delete Modal State
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchProducts();
        fetchStats();
    }, [page, debouncedSearch, statusFilter]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

            let url = `${API_URL}/products?limit=20&offset=${(page - 1) * 20}`;
            if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const result = await response.json();
                setProducts(result.data || []);
                setTotalPages(result.pagination?.total_pages || 1);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const response = await fetch(`${API_URL}/products/stats/overview`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const confirmDelete = (id: string) => {
        setProductToDelete(id);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!productToDelete) return;

        try {
            setIsDeleting(true);
            const token = localStorage.getItem('adminToken');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const response = await fetch(`${API_URL}/products/${productToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setProducts(products.filter(p => p.id !== productToDelete));
                fetchStats();
                setShowDeleteModal(false);
                setProductToDelete(null);
                alert('Product deleted successfully!');
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Delete failed:', errorData);
                alert('Failed to delete product: ' + (errorData.error || errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete product: ' + (error as Error).message);
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmBulkDelete = () => {
        if (selectedProducts.size === 0) return;
        setShowBulkDeleteModal(true);
    };

    const handleBulkDelete = async () => {
        try {
            setIsDeleting(true);
            const token = localStorage.getItem('adminToken');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const response = await fetch(`${API_URL}/products/bulk-delete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_ids: Array.from(selectedProducts),
                }),
            });

            if (response.ok) {
                fetchProducts();
                fetchStats();
                setSelectedProducts(new Set());
                setShowBulkDeleteModal(false);
            }
        } catch (error) {
            alert('Failed to delete products');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkStatusUpdate = async (status: 'draft' | 'published' | 'archived') => {
        if (selectedProducts.size === 0) return;

        try {
            const token = localStorage.getItem('adminToken');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
            const response = await fetch(`${API_URL}/products/bulk-update`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_ids: Array.from(selectedProducts),
                    updates: { status },
                }),
            });

            if (response.ok) {
                fetchProducts();
                fetchStats();
                setSelectedProducts(new Set());
            }
        } catch (error) {
            alert('Failed to update products');
        }
    };

    const toggleSelectAll = () => {
        if (selectedProducts.size === products.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(products.map(p => p.id)));
        }
    };

    const toggleSelectProduct = (id: string) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedProducts(newSelected);
    };

    const handleExport = () => {
        const formattedData = formatProductsForExport(products);
        exportToCSV(formattedData, 'products');
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            published: 'bg-green-100 text-green-800',
            draft: 'bg-yellow-100 text-yellow-800',
            archived: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="p-8 relative">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { fetchProducts(); fetchStats(); }}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Refresh Data"
                        >
                            <RefreshCw size={20} />
                        </button>
                        <Link
                            href="/dashboard/products/new"
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Add Product
                        </Link>
                    </div>
                </div>
                <p className="text-gray-600">Manage your product catalog and inventory</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total_products}</p>
                            </div>
                            <Package className="text-blue-500" size={32} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Published</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.published_products}</p>
                            </div>
                            <TrendingUp className="text-green-500" size={32} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Draft</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.draft_products}</p>
                            </div>
                            <Box className="text-yellow-500" size={32} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Low Stock</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.low_stock_products}</p>
                            </div>
                            <AlertTriangle className="text-orange-500" size={32} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.out_of_stock_products}</p>
                            </div>
                            <PackageX className="text-red-500" size={32} />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'all'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setStatusFilter('published')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'published'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Published
                        </button>
                        <button
                            onClick={() => setStatusFilter('draft')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'draft'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Draft
                        </button>
                        <button
                            onClick={() => setStatusFilter('archived')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'archived'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Archived
                        </button>
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                        <Download size={20} />
                        Export
                    </button>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedProducts.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-900">
                            {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkStatusUpdate('published')}
                                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                            >
                                Publish
                            </button>
                            <button
                                onClick={() => handleBulkStatusUpdate('draft')}
                                className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                            >
                                Draft
                            </button>
                            <button
                                onClick={() => handleBulkStatusUpdate('archived')}
                                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                            >
                                Archive
                            </button>
                            <button
                                onClick={confirmBulkDelete}
                                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <button onClick={toggleSelectAll}>
                                        {selectedProducts.size === products.length ? (
                                            <CheckSquare className="text-blue-500" size={20} />
                                        ) : (
                                            <Square className="text-gray-400" size={20} />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Inventory
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Variants
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        Loading products...
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No products found
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <button onClick={() => toggleSelectProduct(product.id)}>
                                                {selectedProducts.has(product.id) ? (
                                                    <CheckSquare className="text-blue-500" size={20} />
                                                ) : (
                                                    <Square className="text-gray-400" size={20} />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                                    {product.thumbnail ? (
                                                        <img
                                                            src={product.thumbnail}
                                                            alt={product.title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center">
                                                            <Package className="text-gray-400" size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{product.title}</div>
                                                    <div className="text-sm text-gray-500">{product.handle}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(product.status)}`}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {product.total_inventory} units
                                            </div>
                                            {product.total_inventory < 10 && product.total_inventory > 0 && (
                                                <div className="text-xs text-orange-600">Low stock</div>
                                            )}
                                            {product.total_inventory === 0 && (
                                                <div className="text-xs text-red-600">Out of stock</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {product.variant_count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(product.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/dashboard/products/${product.id}`}
                                                    className="text-blue-600 hover:text-blue-900 p-1"
                                                    title="View / Edit"
                                                >
                                                    <Edit size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => confirmDelete(product.id)}
                                                    className="text-red-600 hover:text-red-900 p-1"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-700">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Single Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <AlertTriangle className="text-red-500" size={24} />
                                Delete Product?
                            </h3>
                            <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this product? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Modal */}
            {showBulkDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <AlertTriangle className="text-red-500" size={24} />
                                Delete {selectedProducts.size} Products?
                            </h3>
                            <button onClick={() => setShowBulkDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete these products? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowBulkDeleteModal(false)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
