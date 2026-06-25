'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Save, DollarSign, Tag } from 'lucide-react';
import Link from 'next/link';
import ProductMediaUpload, {
  type ProductMediaItem,
} from '@/components/ui/ProductMediaUpload';
import ProductReadinessPanel from '@/components/ProductReadinessPanel';
import { useNotification } from '@/context/notification-context';
import { getAdminProductReadinessIssues } from '@/lib/product-readiness';

interface Region {
  id: string;
  name: string;
  currency_code: string;
}

function toDisplayUrl(url: string): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  if (url.includes('/f_auto')) return url;
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
}

function getCoverThumbnail(mediaItems: ProductMediaItem[]) {
  const coverItem = mediaItems.find((item) => item.is_thumbnail) || mediaItems[0];
  if (!coverItem) return '';
  if (coverItem.metadata?.media_type === 'video') {
    const firstImage = mediaItems.find((item) => item.metadata?.media_type !== 'video');
    return coverItem.metadata.thumbnail_url || toDisplayUrl(firstImage?.url || '') || toDisplayUrl(coverItem.url);
  }
  return toDisplayUrl(coverItem.url);
}

// ─── Shared input classes ─────────────────────────────────────────────────────
const inputCls =
  'w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
const cardCls  = 'bg-white rounded-xl border border-gray-200 shadow-sm p-6';

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NewProductPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  // Data
  const [regions, setRegions]         = useState<Region[]>([]);
  const [categories, setCategories]   = useState<any[]>([]);
  const [tags, setTags]               = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

  // Selections
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds]           = useState<string[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');

  // Form
  const [formData, setFormData] = useState({
    title: '', subtitle: '', inventory_quantity: '', description: '',
    handle: '', status: 'draft', weight: '', length: '', height: '', width: '',
    hs_code: '', origin_country: '', material: '', size_guide: '',
    care_instructions: '', seo_title: '', seo_description: '', thumbnail: '', sku: '',
  });

  const [mediaItems, setMediaItems] = useState<ProductMediaItem[]>([]);
  // Single INR price — storefront converts to buyer's local currency automatically
  const [inrPrice, setInrPrice] = useState('');
  const [priceType, setPriceType] = useState<'fixed' | 'on_request'>('fixed');

  // INR region (from DB) — needed to build the prices payload
  const inrRegion = regions.find((r) => r.currency_code.toLowerCase() === 'inr');

  useEffect(() => {
    api.getRegions().then((d) => setRegions(d.regions || [])).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([api.getCategories(), api.getTags(), api.getCollections()])
      .then(([catsData, tagsData, colData]) => {
        setCategories(catsData.categories || []);
        setTags(tagsData.tags || []);
        setCollections(colData.collections || []);
      })
      .catch(() => {});
  }, []);

  const toggleCategory = (id: string) =>
    setSelectedCategoryIds((p) => p.includes(id) ? p.filter((c) => c !== id) : [...p, id]);

  const toggleTag = (id: string) =>
    setSelectedTagIds((p) => p.includes(id) ? p.filter((t) => t !== id) : [...p, id]);

  const toSlug = (text: string) =>
    text.toLowerCase().trim()
      .replaceAll(/[^\w\s-]/g, '')
      .replaceAll(/[\s_]+/g, '-')
      .replaceAll(/-+/g, '-')
      .replaceAll(/(?:^\-+|\-+$)/g, '');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'title') {
        const isAutoOrEmpty = prev.handle === '' || prev.handle === toSlug(prev.title);
        if (isAutoOrEmpty) updated.handle = toSlug(value);
      }
      return updated;
    });
  };

  const readinessInput = {
    title: formData.title,
    handle: formData.handle,
    priceType,
    inrPrice,
    mediaCount: mediaItems.length,
    categoryCount: selectedCategoryIds.length,
    collectionId: selectedCollectionId,
    material: formData.material,
    seoTitle: formData.seo_title,
    seoDescription: formData.seo_description,
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.title.trim()) throw new Error('Product title is required.');
      if (!formData.handle.trim()) throw new Error('URL handle is required.');
      if (mediaItems.length === 0) {
        throw new Error('Add at least 1 media item before saving this product.');
      }

      const parsedInrPrice = Number.parseFloat(inrPrice);
      if (priceType === 'fixed' && (!inrPrice || Number.isNaN(parsedInrPrice) || parsedInrPrice <= 0)) {
        throw new Error('Enter a valid INR price before saving this fixed-price product.');
      }

      if (formData.status === 'published') {
        const issues = getAdminProductReadinessIssues(readinessInput);
        if (issues.length > 0) {
          throw new Error(
            `Product is not ready to publish: ${issues.map((issue) => issue.message).join(' ')}`
          );
        }
      }

      // Save price only for fixed-price products. Region is optional because storefront pricing
      // only needs currency_code + amount, and some installs may not have an INR region yet.
      const formattedPrices = priceType === 'fixed'
        ? [{
            region_id: inrRegion?.id,
            currency_code: 'inr',
            amount: Math.round(parsedInrPrice * 100),
          }]
        : [];

      const payload = {
        ...formData,
        price_type:         priceType,
        weight:             formData.weight             ? Number.parseInt(formData.weight)             : undefined,
        length:             formData.length             ? Number.parseInt(formData.length)             : undefined,
        height:             formData.height             ? Number.parseInt(formData.height)             : undefined,
        width:              formData.width              ? Number.parseInt(formData.width)              : undefined,
        inventory_quantity: formData.inventory_quantity ? Number.parseInt(formData.inventory_quantity) : 0,
        prices:             formattedPrices,
        images:             mediaItems.map((item, idx) => ({
          url:          item.url,
          alt_text:     item.alt_text || '',
          is_thumbnail: item.is_thumbnail,
          position:     idx,
          metadata:     item.metadata ? { ...item.metadata, thumbnail_url: item.metadata.thumbnail_url || undefined } : undefined,
        })),
        thumbnail:     getCoverThumbnail(mediaItems) || undefined,
        category_ids:  selectedCategoryIds,
        tag_ids:       selectedTagIds,
        collection_id: selectedCollectionId || null,
        sku:           formData.sku || undefined,
      };

      const created = await api.createProduct(payload);
      const productId = created?.product?.id || created?.id;

      showNotification('success', 'Product created with an automatic SEO baseline. Review SEO & Discovery before publishing broadly.');
      if (productId) {
        router.push(`/dashboard/products/${productId}`);
      } else {
        router.push('/dashboard/products');
      }
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6 px-4 pb-16 md:px-8">

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 pt-2 md:flex-row md:items-end md:justify-between">
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
            <h1 className="mt-1 font-[var(--font-display)] text-[2.2rem] leading-none text-[var(--kv-text)]">
              Create Product
            </h1>
            <p className="mt-1.5 text-sm text-[var(--kv-muted)]">
              Build a new storefront listing — media, pricing, shipping, and organisation.
            </p>
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-2xl border border-[var(--kv-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--kv-text)] hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-[var(--kv-text)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition"
          >
            <Save size={16} />
            {loading ? 'Saving…' : 'Save Product'}
          </button>
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">

        {/* ════════════════════════════════════════
            LEFT COLUMN — main content, scrollable
            ════════════════════════════════════════ */}
        <div className="space-y-6 min-w-0">

          {/* 1 ── Media Upload (TOP) */}
          <div className={cardCls}>
            <h2 className="text-base font-bold text-gray-800 mb-1">Product Media</h2>
            <p className="text-sm text-gray-500 mb-5">
              Upload at least 3 photos or videos. Portrait images (4:5) work best on mobile.
              The first image becomes the cover photo.
            </p>
            <ProductMediaUpload
              items={mediaItems}
              onChange={setMediaItems}
              onError={(msg) => showNotification('error', msg)}
            />
          </div>

          {/* 2 + 3 ── Title & Subtitle */}
          <div className={cardCls}>
            <h2 className="text-base font-bold text-gray-800 mb-5">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className={labelCls}>
                  Product Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title" type="text" name="title"
                  value={formData.title} onChange={handleChange} required
                  className={inputCls} placeholder="e.g. Summer Linen Shirt"
                />
              </div>
              <div>
                <label htmlFor="subtitle" className={labelCls}>Subtitle</label>
                <input
                  id="subtitle" type="text" name="subtitle"
                  value={formData.subtitle} onChange={handleChange}
                  className={inputCls} placeholder="e.g. Lightweight and breathable"
                />
              </div>
            </div>
          </div>

          {/* 4 ── Description, Size Guide, Care */}
          <div className={cardCls}>
            <h2 className="text-base font-bold text-gray-800 mb-5">Details</h2>
            <div className="space-y-5">
              <div>
                <label htmlFor="description" className={labelCls}>Description</label>
                <textarea
                  id="description" name="description"
                  value={formData.description} onChange={handleChange} rows={6}
                  className={inputCls} placeholder="Detailed product description…"
                />
              </div>
              <div>
                <label htmlFor="size_guide" className={labelCls}>Size Guide</label>
                <textarea
                  id="size_guide" name="size_guide"
                  value={formData.size_guide || ''} onChange={handleChange} rows={3}
                  className={inputCls}
                  placeholder="e.g. Model is 5'9 and wearing size M. Fits true to size."
                />
              </div>
              <div>
                <label htmlFor="care_instructions" className={labelCls}>Care Instructions</label>
                <textarea
                  id="care_instructions" name="care_instructions"
                  value={formData.care_instructions || ''} onChange={handleChange} rows={3}
                  className={inputCls} placeholder="e.g. Machine wash cold, dry flat."
                />
              </div>
            </div>
          </div>

          {/* 5 ── Pricing */}
          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-green-600" />
              <h2 className="text-base font-bold text-gray-800">Price</h2>
            </div>
            <div className="flex gap-3 mb-5">
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${priceType === 'fixed' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <input type="radio" name="price_type" value="fixed" checked={priceType === 'fixed'} onChange={() => setPriceType('fixed')} className="sr-only" />
                Fixed Price
              </label>
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${priceType === 'on_request' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <input type="radio" name="price_type" value="on_request" checked={priceType === 'on_request'} onChange={() => setPriceType('on_request')} className="sr-only" />
                On Request (WhatsApp)
              </label>
            </div>
            {priceType === 'on_request' ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                Customer will see a WhatsApp enquiry button instead of &ldquo;Add to Bag&rdquo;. No price required.
              </div>
            ) : (
              <div className="max-w-xs">
                <label htmlFor="inr_price" className={labelCls}>
                  Price (INR ₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
                  <input
                    id="inr_price" type="number" min="0" step="1"
                    value={inrPrice}
                    onChange={(e) => setInrPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                    placeholder="e.g. 1999"
                  />
                </div>
                {inrPrice && (
                  <p className="mt-2 text-xs text-gray-500">
                    ≈ ${(Number(inrPrice) * 0.012).toFixed(2)} USD &nbsp;·&nbsp;
                    €{(Number(inrPrice) * 0.011).toFixed(2)} EUR
                    <span className="ml-1 text-gray-400">(indicative)</span>
                  </p>
                )}
                {!inrRegion && (
                  <p className="mt-2 text-xs text-red-600">
                    India (INR) region not found.{' '}
                    <Link href="/dashboard/regions" className="underline font-semibold">Create it here.</Link>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 6 ── Inventory */}
          <div className={cardCls}>
            <h2 className="text-base font-bold text-gray-800 mb-5">Inventory</h2>
            <div>
              <label htmlFor="inventory_quantity" className={labelCls}>
                Quantity in Stock
              </label>
              <input
                id="inventory_quantity" type="number" name="inventory_quantity"
                value={formData.inventory_quantity} onChange={handleChange}
                className={`${inputCls} max-w-xs`} placeholder="e.g. 100"
              />
            </div>
          </div>

          {/* 7 ── Shipping & Dimensions */}
          <div className={cardCls}>
            <h2 className="text-base font-bold text-gray-800 mb-5">Shipping & Dimensions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {[
                { id: 'weight', label: 'Weight (g)' },
                { id: 'length', label: 'Length (cm)' },
                { id: 'width',  label: 'Width (cm)' },
                { id: 'height', label: 'Height (cm)' },
              ].map(({ id, label }) => (
                <div key={id}>
                  <label htmlFor={id} className="block text-xs font-medium text-gray-500 mb-1">
                    {label}
                  </label>
                  <input
                    id={id} type="number" name={id}
                    value={(formData as any)[id]} onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="hs_code" className={labelCls}>HS Code</label>
                <input id="hs_code" type="text" name="hs_code"
                  value={formData.hs_code} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label htmlFor="origin_country" className={labelCls}>Origin Country</label>
                <input id="origin_country" type="text" name="origin_country"
                  value={formData.origin_country} onChange={handleChange}
                  className={inputCls} placeholder="IN" />
              </div>
              <div>
                <label htmlFor="material" className={labelCls}>Material</label>
                <input id="material" type="text" name="material"
                  value={formData.material} onChange={handleChange} className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            RIGHT COLUMN — sticky sidebar
            ════════════════════════════════════════ */}
        <div className="space-y-5 lg:sticky lg:top-6">

          <ProductReadinessPanel input={readinessInput} />

          {/* 2 ── Organisation */}
          <div className={cardCls}>
            <h2 className="text-base font-bold text-gray-800 mb-4">Organisation</h2>
            <div className="space-y-4">

              {/* Status */}
              <div>
                <label htmlFor="status" className={labelCls}>Status</label>
                <select
                  id="status" name="status" value={formData.status} onChange={handleChange}
                  className={inputCls}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="proposed">Proposed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* SKU */}
              <div>
                <label htmlFor="sku" className={labelCls}>SKU</label>
                <input id="sku" type="text" name="sku"
                  value={formData.sku} onChange={handleChange}
                  className={inputCls} placeholder="e.g. TSHIRT-L-BLU" />
                <p className="text-xs text-gray-500 mt-1">Stock Keeping Unit — unique product identifier</p>
              </div>

              {/* Collection */}
              <div>
                <label htmlFor="collection" className={labelCls}>Collection</label>
                <select
                  id="collection" value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">No Collection</option>
                  {collections.map((col: any) => (
                    <option key={col.id} value={col.id}>{col.title}</option>
                  ))}
                </select>
              </div>

              {/* URL Handle */}
              <div>
                <label htmlFor="handle" className={labelCls}>
                  URL Handle <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                  <span className="inline-flex items-center px-3 bg-gray-50 text-gray-400 text-xs border-r border-gray-200 whitespace-nowrap">
                    /products/
                  </span>
                  <input
                    id="handle" type="text" name="handle"
                    value={formData.handle} onChange={handleChange} required
                    className="flex-1 px-3 py-2 outline-none text-sm bg-white"
                    placeholder="url-handle"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3 ── Categorization */}
          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-4">
              <Tag size={15} className="text-gray-400" />
              <h2 className="text-base font-bold text-gray-800">Categorization</h2>
            </div>

            {/* Categories */}
            <div className="mb-5">
              <label className={labelCls}>Categories</label>
              <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-400">No categories found.</p>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <input
                        type="checkbox" id={`cat-${cat.id}`}
                        checked={selectedCategoryIds.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                      <label htmlFor={`cat-${cat.id}`}
                        className="text-sm text-gray-700 cursor-pointer select-none">
                        {cat.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className={labelCls}>Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <p className="text-sm text-gray-400">No tags found.</p>
                ) : (
                  tags.map((tag) => (
                    <button
                      key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        selectedTagIds.includes(tag.id)
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 4 ── SEO */}
          <div className={cardCls}>
            <h2 className="text-base font-bold text-gray-800 mb-4">
              Search Engine Optimisation
            </h2>
            <p className="mb-4 text-xs leading-relaxed text-gray-500">
              On save, Odhvica auto-creates the advanced SEO baseline: canonical, robots, schema-ready discovery document,
              structured attribute guesses, media SEO, Merchant draft fields, and vector-ready product text. Review the full
              SEO & Discovery panel on the next screen.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="seo_title" className={labelCls}>Page Title</label>
                <input
                  id="seo_title" type="text" name="seo_title"
                  value={formData.seo_title || ''} onChange={handleChange}
                  className={inputCls}
                  placeholder="e.g. Elegant Summer Linen Shirt | Odhvica"
                />
              </div>
              <div>
                <label htmlFor="seo_description" className={labelCls}>Meta Description</label>
                <textarea
                  id="seo_description" name="seo_description"
                  value={formData.seo_description || ''} onChange={handleChange} rows={3}
                  className={inputCls}
                  placeholder="Compelling summary for search results…"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Recommended: 150–160 characters
                </p>
              </div>
            </div>
          </div>

        </div>
        {/* end right column */}
      </div>
    </div>
  );
}
