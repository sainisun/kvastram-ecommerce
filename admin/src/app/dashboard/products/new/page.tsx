'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Save, DollarSign } from 'lucide-react';
import Link from 'next/link';
import ImageUpload, { ImageItem } from '@/components/ui/ImageUpload';

interface Region {
    id: string;
    name: string;
    currency_code: string;
}

import { useNotification } from '@/context/notification-context';

export default function NewProductPage() {
    const router = useRouter();
    const { showNotification } = useNotification();
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Data
    const [regions, setRegions] = useState<Region[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);

    // Selection State
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

    // Form
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        inventory_quantity: '',
        description: '',
        handle: '',
        status: 'draft',
        weight: '',
        length: '',
        height: '',
        width: '',
        hs_code: '',
        origin_country: '',
        material: '',
        thumbnail: '',
    });

    const [images, setImages] = useState<ImageItem[]>([]);

    // Prices State: Map region_id -> amount (string for input)
    const [prices, setPrices] = useState<Record<string, string>>({});

    useEffect(() => {
        const storedToken = localStorage.getItem('adminToken');
        if (!storedToken) {
            router.push('/');
            return;
        }
        setToken(storedToken);
        loadRegions(storedToken);
    }, [router]);

    const loadRegions = async (authToken: string) => {
        try {
            const data = await api.getRegions(authToken);
            setRegions(data.regions || []);
        } catch (error) {
            console.error('Failed to load regions');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            const storedToken = localStorage.getItem('adminToken');
            if (!storedToken) return;

            try {
                const [catsData, tagsData] = await Promise.all([
                    api.getCategories(storedToken),
                    api.getTags(storedToken)
                ]);
                setCategories(catsData.categories || []);
                setTags(tagsData.tags || []);
            } catch (err) {
                console.error('Failed to load categories/tags', err);
            }
        };
        loadData();
    }, []);

    const toggleCategory = (id: string) => {
        setSelectedCategoryIds(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const toggleTag = (id: string) => {
        setSelectedTagIds(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePriceChange = (regionId: string, value: string) => {
        setPrices(prev => ({ ...prev, [regionId]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Build Prices Array
            const formattedPrices = regions
                .filter(r => prices[r.id]) // Only include filled prices
                .map(r => ({
                    region_id: r.id,
                    currency_code: r.currency_code,
                    amount: Math.round(parseFloat(prices[r.id]) * 100) // Convert to cents
                }));

            const payload = {
                ...formData,
                weight: formData.weight ? parseInt(formData.weight) : undefined,
                length: formData.length ? parseInt(formData.length) : undefined,
                height: formData.height ? parseInt(formData.height) : undefined,
                width: formData.width ? parseInt(formData.width) : undefined,
                inventory_quantity: formData.inventory_quantity ? parseInt(formData.inventory_quantity) : 0,
                prices: formattedPrices,
                images: images.map((img, idx) => ({
                    url: img.url,
                    alt_text: img.alt_text || '',
                    is_thumbnail: img.is_thumbnail,
                    position: idx
                })),
                thumbnail: images.find(img => img.is_thumbnail)?.url || images[0]?.url || '',
                category_ids: selectedCategoryIds,
                tag_ids: selectedTagIds
            };

            await api.createProduct(token, payload);
            showNotification('success', 'Product created successfully');
            router.push('/dashboard/products');
        } catch (error: any) {
            showNotification('error', error.message || 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/products"
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Create Product</h1>
                        <p className="text-gray-500 text-sm">Add a new item to your catalog</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Product'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: General Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">General Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. Summer Linen Shirt"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                                <input
                                    type="text"
                                    name="subtitle"
                                    value={formData.subtitle}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. Lightweight and breathable"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Quantity</label>
                                <input
                                    type="number"
                                    name="inventory_quantity"
                                    value={formData.inventory_quantity}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. 100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={5}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Detailed product description..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign size={20} className="text-green-600" />
                            <h2 className="text-lg font-bold text-gray-800">International Pricing</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            Set specific prices for each region. The system will automatically serve the correct price based on customer location.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {regions.map((region) => (
                                <div key={region.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-700">{region.name}</span>
                                        <span className="text-xs font-bold bg-white px-2 py-1 rounded border uppercase text-gray-500">
                                            {region.currency_code}
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                                            {region.currency_code === 'usd' ? '$' : region.currency_code === 'eur' ? '€' : region.currency_code === 'inr' ? '₹' : region.currency_code.toUpperCase()}
                                        </span>
                                        <input
                                            type="number"
                                            value={prices[region.id] || ''}
                                            onChange={(e) => handlePriceChange(region.id, e.target.value)}
                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            ))}
                            {regions.length === 0 && (
                                <p className="text-sm text-red-500 col-span-2">
                                    No regions found. Please create regions in Settings first.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Shipping */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Shipping & Dimensions</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Weight (g)</label>
                                <input
                                    type="number"
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Length (cm)</label>
                                <input
                                    type="number"
                                    name="length"
                                    value={formData.length}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Width (cm)</label>
                                <input
                                    type="number"
                                    name="width"
                                    value={formData.width}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Height (cm)</label>
                                <input
                                    type="number"
                                    name="height"
                                    value={formData.height}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">HS Code</label>
                                <input
                                    type="text"
                                    name="hs_code"
                                    value={formData.hs_code}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Origin Country</label>
                                <input
                                    type="text"
                                    name="origin_country"
                                    value={formData.origin_country}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="IN"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                                <input
                                    type="text"
                                    name="material"
                                    value={formData.material}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Organization */}
                {/* Right Column: Organization */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Organization</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="proposed">Proposed</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL Handle</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                        /products/
                                    </span>
                                    <input
                                        type="text"
                                        name="handle"
                                        value={formData.handle}
                                        onChange={handleChange}
                                        required
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        placeholder="url-handle"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Categorization */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Categorization</h2>

                        {/* Categories */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                                {categories.length === 0 ? <p className="text-sm text-gray-500">No categories found.</p> : categories.map(cat => (
                                    <div key={cat.id} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`cat-${cat.id}`}
                                            checked={selectedCategoryIds.includes(cat.id)}
                                            onChange={() => toggleCategory(cat.id)}
                                            className="rounded border-gray-300 text-black focus:ring-black"
                                        />
                                        <label htmlFor={`cat-${cat.id}`} className="text-sm text-gray-700 cursor-pointer select-none">
                                            {cat.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                            <div className="flex flex-wrap gap-2">
                                {tags.length === 0 ? <p className="text-sm text-gray-500">No tags found.</p> : tags.map(tag => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => toggleTag(tag.id)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedTagIds.includes(tag.id)
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Media</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Upload product images. The first image will be used as the thumbnail.
                            Drag to reorder.
                        </p>

                        <ImageUpload
                            images={images}
                            onChange={setImages}
                            onUpload={(file) => api.uploadImage(token, file).then(res => res.url)}
                            uploading={uploading}
                            maxFiles={10}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

