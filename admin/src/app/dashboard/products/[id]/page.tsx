'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Save,
  Globe,
  DollarSign,
  Plus,
  Trash2,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import ImageUpload, { ImageItem } from '@/components/ui/ImageUpload';

interface Region {
  id: string;
  name: string;
  currency_code: string;
}

import { useNotification } from '@/context/notification-context';

export default function EditProductPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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
    size_guide: '',
    care_instructions: '',
    seo_title: '',
    seo_description: '',
  });

  const [images, setImages] = useState<ImageItem[]>([]);

  // Prices State: Map region_id -> amount (string for input)
  const [prices, setPrices] = useState<Record<string, string>>({});

  // Variant State
  const [variants, setVariants] = useState<any[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [showAddOption, setShowAddOption] = useState(false);
  const [newOptionTitle, setNewOptionTitle] = useState('');
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariant, setNewVariant] = useState({
    title: '',
    sku: '',
    inventory_quantity: '0',
    compare_at_price: '',
  });

  useEffect(() => {
    init();
  }, [router, id]);

  const init = async () => {
    try {
      const [regionData, productResult, catsData, tagsData] = await Promise.all(
        [
          api.getRegions(),
          api.getProduct(id),
          api.getCategories(),
          api.getTags(),
        ]
      );

      setRegions(regionData.regions || []);
      setCategories(catsData.categories || []);
      setTags(tagsData.tags || []);

      const product = productResult.data?.product || productResult.product;

      // Populate Categories & Tags
      if (product.categories) {
        setSelectedCategoryIds(
          product.categories.map((c: any) => c.category_id)
        );
      }
      if (product.tags) {
        setSelectedTagIds(product.tags.map((t: any) => t.tag_id));
      }

      // Populate Form
      setFormData({
        title: product.title || '',
        subtitle: product.subtitle || '',
        inventory_quantity:
          product.variants?.[0]?.inventory_quantity?.toString() || '',
        description: product.description || '',
        handle: product.handle || '',
        status: product.status || 'draft',
        weight: product.weight || '',
        length: product.length || '',
        height: product.height || '',
        width: product.width || '',
        hs_code: product.hs_code || '',
        origin_country: product.origin_country || '',
        material: product.material || '',
        thumbnail: product.thumbnail || '',
        size_guide: product.size_guide || '',
        care_instructions: product.care_instructions || '',
        seo_title: product.seo_title || '',
        seo_description: product.seo_description || '',
      });

      // Populate Images
      if (product.images && product.images.length > 0) {
        setImages(
          product.images
            .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
            .map((img: any) => ({
              id: img.id,
              url: img.url,
              is_thumbnail: img.is_thumbnail,
              alt_text: img.alt_text || '',
              position: img.position,
            }))
        );
      } else if (product.thumbnail) {
        // Fallback for old products
        setImages([
          {
            id: 'legacy-thumb',
            url: product.thumbnail,
            is_thumbnail: true,
            position: 0,
          },
        ]);
      }

      // Populate Prices
      // Assuming we look at the first variant's prices for now
      if (product.variants && product.variants.length > 0) {
        const variantPrices = product.variants[0].prices || [];
        const priceMap: Record<string, string> = {};
        variantPrices.forEach((p: any) => {
          if (p.region_id) {
            priceMap[p.region_id] = (p.amount / 100).toString();
          }
        });
        setPrices(priceMap);
      }

      // Load variants and options
      try {
        const variantData = await api.getVariants(id);
        setVariants(variantData?.variants || []);
        setOptions(variantData?.options || []);
      } catch (e) {
        console.error('Failed to load variants/options', e);
      }
    } catch (error) {
      console.error('Failed to load data', error);
      showNotification('error', 'Error loading product');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (regionId: string, value: string) => {
    setPrices((prev) => ({ ...prev, [regionId]: value }));
  };

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

  // Variant Handlers
  const handleAddVariant = async () => {
    if (!newVariant.title.trim()) return;
    try {
      await api.createVariant(id, {
        title: newVariant.title,
        sku: newVariant.sku || undefined,
        inventory_quantity: parseInt(newVariant.inventory_quantity) || 0,
        compare_at_price: newVariant.compare_at_price
          ? Math.round(parseFloat(newVariant.compare_at_price) * 100)
          : undefined,
        option_values: (newVariant as any).option_values || [],
      });
      showNotification('success', `Variant "${newVariant.title}" added`);
      setNewVariant({
        title: '',
        sku: '',
        inventory_quantity: '0',
        compare_at_price: '',
      });
      setShowAddVariant(false);
      // Reload variants
      const data = await api.getVariants(id);
      setVariants(data?.variants || []);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to add variant');
    }
  };

  const handleDeleteVariant = async (variantId: string, title: string) => {
    if (!confirm(`Delete size variant "${title}"?`)) return;
    try {
      await api.deleteVariant(id, variantId);
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      showNotification('success', `Variant "${title}" deleted`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete variant');
    }
  };

  const handleUpdateVariantInventory = async (
    variantId: string,
    qty: number
  ) => {
    try {
      await api.updateVariant(id, variantId, { inventory_quantity: qty });
      setVariants((prev) =>
        prev.map((v) =>
          v.id === variantId ? { ...v, inventory_quantity: qty } : v
        )
      );
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update inventory');
    }
  };

  const handleUpdateVariantCompareAtPrice = async (
    variantId: string,
    val: string
  ) => {
    const cents = val ? Math.round(parseFloat(val) * 100) : null;
    try {
      await api.updateVariant(id, variantId, { compare_at_price: cents });
      setVariants((prev) =>
        prev.map((v) =>
          v.id === variantId ? { ...v, compare_at_price: cents } : v
        )
      );
    } catch (err: any) {
      showNotification(
        'error',
        err.message || 'Failed to update compare price'
      );
    }
  };

  const PRESET_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

  const handleAddPresetSize = async (size: string) => {
    // Check if already exists
    if (variants.some((v) => v.title === size)) {
      showNotification('error', `Size ${size} already exists`);
      return;
    }

    // First ensure "Size" option exists
    let sizeOptionId = options.find(
      (o) => o.title.toLowerCase() === 'size'
    )?.id;
    if (!sizeOptionId) {
      try {
        const optRes = await api.createOption(id, { title: 'Size' });
        sizeOptionId = optRes.option.id;
        const data = await api.getVariants(id);
        setOptions(data?.options || []);
      } catch (e) {
        console.error('Failed to auto-create size option', e);
      }
    }

    try {
      await api.createVariant(id, {
        title: size,
        sku: `${formData.handle}-${size.toLowerCase()}`,
        inventory_quantity: 0,
        option_values: sizeOptionId
          ? [{ option_id: sizeOptionId, value: size }]
          : [],
      });
      showNotification('success', `Size ${size} added`);
      const data = await api.getVariants(id);
      setVariants(data?.variants || []);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to add size');
    }
  };

  const handleCreateOption = async () => {
    if (!newOptionTitle.trim()) return;
    try {
      await api.createOption(id, { title: newOptionTitle });
      showNotification('success', `Option "${newOptionTitle}" created`);
      setNewOptionTitle('');
      setShowAddOption(false);
      const data = await api.getVariants(id);
      setOptions(data?.options || []);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create option');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build Prices Array
      const formattedPrices = regions
        .filter((r) => prices[r.id]) // Only include filled prices
        .map((r) => ({
          region_id: r.id,
          currency_code: r.currency_code,
          amount: Math.round(parseFloat(prices[r.id]) * 100), // Convert to cents
        }));

      const payload = {
        ...formData,
        weight: formData.weight
          ? parseInt(formData.weight as string)
          : undefined,
        length: formData.length
          ? parseInt(formData.length as string)
          : undefined,
        height: formData.height
          ? parseInt(formData.height as string)
          : undefined,
        width: formData.width ? parseInt(formData.width as string) : undefined,
        inventory_quantity: formData.inventory_quantity
          ? parseInt(formData.inventory_quantity as string)
          : 0,
        prices: formattedPrices,
        images: images.map((img, idx) => ({
          url: img.url,
          alt_text: img.alt_text || '',
          is_thumbnail: img.is_thumbnail,
          position: idx,
        })),
        thumbnail:
          images.find((img) => img.is_thumbnail)?.url || images[0]?.url || '',
        category_ids: selectedCategoryIds,
        tag_ids: selectedTagIds,
      };

      await api.updateProduct(id, payload);
      showNotification('success', 'Product updated successfully');
      router.push('/dashboard/products');
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 text-center">Loading...</div>;

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
            <h1 className="text-2xl font-bold text-gray-800">Edit Product</h1>
            <p className="text-gray-500 text-sm">{formData.title}</p>
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
            {loading ? 'Saving...' : 'Save Changes'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Title
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtitle
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inventory Quantity
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Detailed product description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size Guide
                </label>
                <textarea
                  name="size_guide"
                  value={formData.size_guide || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Model is 5'9 and wearing a size M. Fits true to size."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Care Instructions
                </label>
                <textarea
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
                      {region.currency_code === 'usd'
                        ? '$'
                        : region.currency_code === 'eur'
                          ? '€'
                          : region.currency_code === 'inr'
                            ? '₹'
                            : region.currency_code.toUpperCase()}
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

          {/* Size Variants */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package size={20} className="text-purple-600" />
                <h2 className="text-lg font-bold text-gray-800">
                  Size Variants
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVariant(!showAddVariant)}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                <Plus size={16} />
                Add Size
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Add size variants for this product. Each size can have its own
              inventory count and SKU.
            </p>

            {/* Quick Add Preset Sizes */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Quick Add Sizes:
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_SIZES.map((size) => {
                  const exists = variants.some((v) => v.title === size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => !exists && handleAddPresetSize(size)}
                      disabled={exists}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        exists
                          ? 'bg-green-50 text-green-700 border-green-200 cursor-default'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                      }`}
                    >
                      {exists ? `✓ ${size}` : `+ ${size}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Options Management */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  Product Options
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddOption(!showAddOption)}
                  className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Option
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {options.map((opt) => (
                  <span
                    key={opt.id}
                    className="inline-flex items-center px-2.5 py-1 rounded bg-white border border-gray-300 text-sm font-medium text-gray-700"
                  >
                    {opt.title}
                  </span>
                ))}
                {options.length === 0 && (
                  <span className="text-xs text-gray-500 italic">
                    No options defined (e.g. Size, Color)
                  </span>
                )}
              </div>

              {showAddOption && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={newOptionTitle}
                    onChange={(e) => setNewOptionTitle(e.target.value)}
                    placeholder="e.g. Color"
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleCreateOption}
                    className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900"
                  >
                    Save Option
                  </button>
                </div>
              )}
            </div>

            {/* Add Custom Variant Form */}
            {showAddVariant && (
              <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="text-sm font-semibold text-purple-800 mb-3">
                  Add Custom Variant
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {options.map((opt) => (
                    <div key={opt.id}>
                      <label className="block text-xs text-gray-600 mb-1">
                        {opt.title}
                      </label>
                      <input
                        type="text"
                        placeholder={`e.g. ${opt.title === 'Size' ? 'XL' : opt.title === 'Color' ? 'Red' : 'Value'}`}
                        onChange={(e) => {
                          const currentValues =
                            (newVariant as any).option_values || [];
                          const existing = currentValues.findIndex(
                            (v: any) => v.option_id === opt.id
                          );
                          if (existing >= 0) {
                            currentValues[existing].value = e.target.value;
                          } else {
                            currentValues.push({
                              option_id: opt.id,
                              value: e.target.value,
                            });
                          }
                          setNewVariant((p) => ({
                            ...p,
                            option_values: currentValues,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Variant Title *
                    </label>
                    <input
                      type="text"
                      value={newVariant.title}
                      onChange={(e) =>
                        setNewVariant((p) => ({ ...p, title: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      placeholder="e.g. Free Size"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={newVariant.sku}
                      onChange={(e) =>
                        setNewVariant((p) => ({ ...p, sku: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      placeholder="Auto-generated"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Inventory
                    </label>
                    <input
                      type="number"
                      value={newVariant.inventory_quantity}
                      onChange={(e) =>
                        setNewVariant((p) => ({
                          ...p,
                          inventory_quantity: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Compare Price
                    </label>
                    <input
                      type="number"
                      value={newVariant.compare_at_price}
                      onChange={(e) =>
                        setNewVariant((p) => ({
                          ...p,
                          compare_at_price: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                  >
                    Add Variant
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddVariant(false)}
                    className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Variants Table */}
            {variants.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                        Size
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                        SKU
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">
                        Inventory
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">
                        Compare at Price
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {variants.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                            {v.title}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {v.sku || '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={v.inventory_quantity ?? 0}
                            onChange={(e) =>
                              handleUpdateVariantInventory(
                                v.id,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20 text-center px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="relative inline-block">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                              $
                            </span>
                            <input
                              type="number"
                              value={
                                v.compare_at_price
                                  ? v.compare_at_price / 100
                                  : ''
                              }
                              onChange={(e) =>
                                handleUpdateVariantCompareAtPrice(
                                  v.id,
                                  e.target.value
                                )
                              }
                              placeholder="0.00"
                              className="w-24 pl-5 pr-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteVariant(v.id, v.title)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Delete variant"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 border border-dashed border-gray-300 rounded-lg">
                <Package size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No size variants yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Use the quick-add buttons above to add standard sizes
                </p>
              </div>
            )}
          </div>

          {/* Shipping */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Shipping & Dimensions
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Weight (g)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Length (cm)
                </label>
                <input
                  type="number"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Width (cm)
                </label>
                <input
                  type="number"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Height (cm)
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HS Code
                </label>
                <input
                  type="text"
                  name="hs_code"
                  value={formData.hs_code}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origin Country
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material
                </label>
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
          {/* Search Engine Optimization */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Search Engine Optimization
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Title (SEO)
                </label>
                <input
                  type="text"
                  name="seo_title"
                  value={formData.seo_title || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Elegant Summer Linen Shirt | Kvastram"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                </label>
                <textarea
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Handle
                </label>
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
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Categorization
            </h2>

            {/* Categories */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
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
            <h2 className="text-lg font-bold text-gray-800 mb-4">Media</h2>
            <p className="text-sm text-gray-500 mb-4">
              Upload product images. The first image will be used as the
              thumbnail. Drag to reorder.
            </p>

            <ImageUpload
              images={images}
              onChange={setImages}
              onUpload={(file) => api.uploadImage(file).then((res) => res.url)}
              uploading={false}
              maxFiles={10}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
