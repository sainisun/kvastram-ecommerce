'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Globe, DollarSign, MapPin, Plus, Edit, Trash2,
    Check, X as XIcon, Loader2
} from 'lucide-react';
import { api } from '@/lib/api';

export default function RegionsPage() {
    const router = useRouter();
    const [regions, setRegions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        currency_code: '',
        tax_rate: '0',
        countries: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/');
            return;
        }
        fetchRegions(token);
    }, [router]);

    const fetchRegions = async (token: string) => {
        try {
            setLoading(true);
            const data = await api.getRegions(token);
            setRegions(data.regions || []);
        } catch (error) {
            console.error('Error fetching regions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        try {
            // Process countries string into array
            const countriesArray = formData.countries
                .split(',')
                .map(c => c.trim().toUpperCase())
                .filter(c => c.length === 2); // Only valid ISO codes

            await api.createRegion(token, {
                ...formData,
                tax_rate: parseFloat(formData.tax_rate),
                countries: countriesArray
            });

            setShowModal(false);
            setFormData({ name: '', currency_code: '', tax_rate: '0', countries: '' });
            fetchRegions(token);
        } catch (error) {
            console.error('Error creating region:', error);
            alert('Failed to create region');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this region?')) return;

        const token = localStorage.getItem('adminToken');
        if (!token) return;

        try {
            setDeleting(id);
            await api.deleteRegion(token, id);
            setRegions(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error deleting region:', error);
            alert('Failed to delete region');
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <p className="text-gray-500">Loading regions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 relative">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Regions & Currencies</h1>
                        <p className="text-gray-600">Manage regional settings, currencies, and tax rates</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Region
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Globe className="text-blue-600" size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Total Regions</p>
                    <p className="text-2xl font-bold text-gray-900">{regions.length}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Check className="text-green-600" size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Active Regions</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {regions.length} {/* Assuming all created are active for now */}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <DollarSign className="text-purple-600" size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Currencies</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {new Set(regions.map(r => r.currency_code)).size}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <MapPin className="text-amber-600" size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Countries Supported</p>
                    <p className="text-2xl font-bold text-gray-900">
                        N/A {/* Simplification as we might dynamically key this in real app */}
                    </p>
                </div>
            </div>

            {/* Regions Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">All Regions</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Region
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Currency
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tax Rate
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {regions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No regions found. Add your first region!
                                    </td>
                                </tr>
                            ) : (
                                regions.map((region) => (
                                    <tr key={region.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                                    <Globe className="text-blue-600" size={20} />
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {region.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <DollarSign size={16} className="text-gray-400" />
                                                <span className="text-sm font-medium text-gray-900 uppercase">
                                                    {region.currency_code}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {region.tax_rate}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                <Check size={14} />
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDelete(region.id)}
                                                disabled={deleting === region.id}
                                                className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                                                title="Delete"
                                            >
                                                {deleting === region.id ? (
                                                    <Loader2 className="animate-spin" size={18} />
                                                ) : (
                                                    <Trash2 size={18} />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Region Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Add Region</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                <XIcon size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Region Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. North America"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 bg-white placeholder-gray-400"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Currency Code (3 chars)</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={3}
                                    placeholder="USD"
                                    className="w-full border border-gray-300 rounded-lg p-2 uppercase text-gray-900 bg-white placeholder-gray-400"
                                    value={formData.currency_code}
                                    onChange={e => setFormData({ ...formData, currency_code: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 bg-white placeholder-gray-400"
                                    value={formData.tax_rate}
                                    onChange={e => setFormData({ ...formData, tax_rate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Countries (ISO Codes, comma separated)</label>
                                <input
                                    type="text"
                                    placeholder="US, CA, MX"
                                    className="w-full border border-gray-300 rounded-lg p-2 uppercase text-gray-900 bg-white placeholder-gray-400"
                                    value={formData.countries}
                                    onChange={e => setFormData({ ...formData, countries: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Example: US, GB, IN, DE</p>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create Region
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
