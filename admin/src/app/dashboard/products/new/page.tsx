'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Save, DollarSign } from 'lucide-react';
import Link from 'next/link';
import ProductMediaUpload, {
  type ProductMediaItem,
} from '@/components/ui/ProductMediaUpload';

interface Region {
  id: string;
  name: string;
  currency_code: string;
}

function getCoverThumbnail(mediaItems: ProductMediaItem[]) {
  const coverItem = mediaItems.find((item) => item.is_thumbnail) || mediaItems[0];

  if (!coverItem) return '';

  if (coverItem.metadata?.media_type === 'video') {
    const firstImage = mediaItems.find(
      (item) => item.metadata?.media_type !== 'video'
    );
    return coverItem.metadata.thumbnail_url || firstImage?.url || coverItem.url;
  }

  return coverItem.url;
}

import { useNotification } from '@/context/notification-context';

export default function NewProductPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  // Data
  const [regions, setRegions] = useState<Region[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

  // Selection State
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');

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
    size_guide: '',
    care_instructions: '',
    seo_title: '',
    seo_description: '',
    thumbnail: '',
    sku: '',
  });

  const [mediaItems, setMediaItems] = useState<ProductMediaItem[]>([]);

  // Prices State: Map region_id -> amount (string for input)
  const [prices, setPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRegions();
  }, [router]);

  const loadRegions = async () => {
    try {
      const data = await api.getRegions();
      setRegions(data.regions || []);
    } catch {
      console.error('Failed to load regions');
      // No rethrow needed since the component handles empty state gracefully
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catsData, tagsData, collectionsData] = await Promise.all([
          api.getCategories(),
          api.getTags(),
          api.getCollections(),
        ]);
        setCategories(catsData.categories || []);
        setTags(tagsData.tags || []);
        setCollections(collectionsData.collections || []);
      } catch (err) {
        console.error('Failed to load categories/tags/collections', err);
      }
    };
    loadData();
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toSlug = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replaceAll(/[^\w\s-]/g, '') // remove special chars
      .replaceAll(/[\s_]+/g, '-') // spaces/underscores → hyphens
      .replaceAll(/-+/g, '-') // collapse multiple hyphens
      .replaceAll(/(?:^\-+|\-+$)/g, ''); // trim leading/trailing hyphens

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-generate handle from title (only if handle is empty or was auto-generated)
      if (name === 'title') {
        const currentHandleIsAutoOrEmpty =
          prev.handle === '' || prev.handle === toSlug(prev.title);
        if (currentHandleIsAutoOrEmpty) {
          updated.handle = toSlug(value);
        }
      }
      return updated;
    });
  };

  const handlePriceChange = (regionId: string, value: string) => {
    setPrices((prev) => ({ ...prev, [regionId]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mediaItems.length < 3) {
        throw new Error('Add at least 3 media items before saving this product.');
      }

      // Build Prices Array
      const formattedPrices = regions
        .filter((r) => prices[r.id]) // Only include filled prices
        .map((r) => ({
          region_id: r.id,
          currency_code: r.currency_code,
          amount: Math.round(Number.parseFloat(prices[r.id]) * 100), // Convert to cents
        }));

      const payload = {
        ...formData,
        weight: formData.weight ? Number.parseInt(formData.weight) : undefined,
        length: formData.length ? Number.parseInt(formData.length) : undefined,
        height: formData.height ? Number.parseInt(formData.height) : undefined,
        width: formData.width ? Number.parseInt(formData.width) : undefined,
        inventory_quantity: formData.inventory_quantity
          ? Number.parseInt(formData.inventory_quantity)
          : 0,
        prices: formattedPrices,
        images: mediaItems.map((item, idx) => ({
          url: item.url,
          alt_text: item.alt_text || '',
          is_thumbnail: item.is_thumbnail,
          position: idx,
          metadata: item.metadata || undefined,
        })),
        thumbnail: getCoverThumbnail(mediaItems),
        category_ids: selectedCategoryIds,
        tag_ids: selectedTagIds,
        collection_id: selectedCollectionId || undefined,
        sku: formData.sku || undefined,
      };

      await api.createProduct(payload);
      showNotification('success', 'Product created successfully');
      router.push('/dashboard/products');
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-4 pb-8 md:space-y-8 md:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/products"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--kv-border)] bg-white text-[var(--kv-muted)] transition hover:text-[var(--kv-text)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--kv-accent-deep)]">
              Listing editor
            </p>
            <h1 className="mt-2 font-[var(--font-display)] text-[2.35rem] leading-none text-[var(--kv-text)]">
              Create Product
            </h1>
            <p className="mt-2 text-sm text-[var(--kv-muted)]">
              Build a new storefront listing with pricing, media, shipping, and merchandising details.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-2xl border border-[var(--kv-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--kv-text)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-[var(--kv-text)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
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
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              General Information
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Product Title
                </label>
                <input
                  id="title"
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
                <label
                  htmlFor="subtitle"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Subtitle
                </label>
                <input
                  id="subtitle"
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Lightweight and breathable"
                />
              </div>
              <div>
                <label
                  htmlFor="inventory_quantity"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Inventory Quantity
                </label>
                <input
                  id="inventory_quantity"
                  type="number"
                  name="inventory_quantity"
                  value={formData.inventory_quantity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. 100"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Detailed product description..."
                />
              </div>
              <div>
                <label
                  htmlFor="size_guide"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Size Guide
                </label>
                <textarea
                  id="size_guide"
                  name="size_guide"
                  value={formData.size_guide || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Model is 5'9 and wearing a size M. Fits true to size."
                />
              </div>
              <div>
                <label
                  htmlFor="care_instructions"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Care Instructions
                </label>
                <textarea
                  id="care_instructions"
                  name="care_instructions"
                  value={formData.care_instructions || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Machine wash cold, dry flat."
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={20} className="text-green-600" />
              <h2 className="text-lg font-bold text-gray-800">
                International Pricing
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Set specific prices for each region. The system will automatically
              serve the correct price based on customer location.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {regions.map((region) => (
                <div
                  key={region.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">
                      {region.name}
                    </span>
                    <span className="text-xs font-bold bg-white px-2 py-1 rounded border uppercase text-gray-500">
                      {region.currency_code}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                      {(() => {
                        switch (region.currency_code) {
                          case 'usd':
                            return '$';
                          case 'eur':
                            return '€';
                          case 'inr':
                            return '₹';
                          default:
                            return region.currency_code.toUpperCase();
                        }
                      })()}
                    </span>
                    <input
                      type="number"
                      value={prices[region.id] || ''}
                      onChange={(e) =>
                        handlePriceChange(region.id, e.target.value)
                      }
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
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Shipping & Dimensions
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label
                  htmlFor="weight"
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  Weight (g)
                </label>
                <input
                  id="weight"
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="length"
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  Length (cm)
                </label>
                <input
                  id="length"
                  type="number"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="width"
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  Width (cm)
                </label>
                <input
                  id="width"
                  type="number"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="height"
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  Height (cm)
                </label>
                <input
                  id="height"
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
                <label
                  htmlFor="hs_code"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  HS Code
                </label>
                <input
                  id="hs_code"
                  type="text"
                  name="hs_code"
                  value={formData.hs_code}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="origin_country"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Origin Country
                </label>
                <input
                  id="origin_country"
                  type="text"
                  name="origin_country"
                  value={formData.origin_country}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  placeholder="IN"
                />
              </div>
              <div>
                <label
                  htmlFor="material"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Material
                </label>
                <input
                  id="material"
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Search Engine Optimization */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Search Engine Optimization
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="seo_title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Page Title (SEO)
                </label>
                <input
                  id="seo_title"
                  type="text"
                  name="seo_title"
                  value={formData.seo_title || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Elegant Summer Linen Shirt | Kvastram"
                />
              </div>
              <div>
                <label
                  htmlFor="seo_description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Meta Description
                </label>
                <textarea
                  id="seo_description"
                  name="seo_description"
                  value={formData.seo_description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Detailed description for search engine results..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended length: 150-160 characters. Provide a compelling
                  summary to encourage clicks.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Organization */}
        {/* Right Column: Organization */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Organization
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <select
                  id="status"
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
                <label
                  htmlFor="sku"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  SKU
                </label>
                <input
                  id="sku"
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  placeholder="e.g. TSHIRT-L-BLU"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Stock Keeping Unit - unique product identifier
                </p>
              </div>

              <div>
                <label
                  htmlFor="collection"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Collection
                </label>
                <select
                  id="collection"
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="">No Collection</option>
                  {collections.map((collection: any) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="handle"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  URL Handle
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    /products/
                  </span>
                  <input
                    id="handle"
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
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Categorization
            </h2>

            {/* Categories */}
            <div className="mb-6">
              <label
                htmlFor="categories-list"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Categories
              </label>
              <div
                id="categories-list"
                className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2"
              >
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500">No categories found.</p>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`cat-${cat.id}`}
                        checked={selectedCategoryIds.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                      <label
                        htmlFor={`cat-${cat.id}`}
                        className="text-sm text-gray-700 cursor-pointer select-none"
                      >
                        {cat.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label
                htmlFor="tags-list"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tags
              </label>
              <div id="tags-list" className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <p className="text-sm text-gray-500">No tags found.</p>
                ) : (
                  tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        selectedTagIds.includes(tag.id)
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Product Media
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Build the storefront gallery with portrait images and short videos.
            </p>

            <ProductMediaUpload
              items={mediaItems}
              onChange={setMediaItems}
              onError={(message) => showNotification('error', message)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
