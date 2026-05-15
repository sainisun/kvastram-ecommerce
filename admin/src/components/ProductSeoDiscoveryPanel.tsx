'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, Save, Search, Trash2 } from 'lucide-react';

import { api } from '@/lib/api';
import { useNotification } from '@/context/notification-context';
import type { ProductMediaItem } from '@/components/ui/ProductMediaUpload';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1';

function csvToArray(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayToCsv(value: unknown) {
  return Array.isArray(value) ? value.join(', ') : '';
}

export default function ProductSeoDiscoveryPanel({
  productId,
  productHandle,
  variants,
  mediaItems,
}: {
  productId: string;
  productHandle: string;
  variants: any[];
  mediaItems: ProductMediaItem[];
}) {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState<any>(null);
  const [attributeCatalog, setAttributeCatalog] = useState<any[]>([]);
  const [seo, setSeo] = useState({
    seo_title: '',
    meta_description: '',
    canonical_url: '',
    robots_index: true,
    robots_follow: true,
    og_title: '',
    og_description: '',
    og_image_url: '',
    twitter_card: 'summary_large_image',
    localized_metadata: {} as Record<string, unknown>,
  });
  const [discovery, setDiscovery] = useState({
    primary_keyword: '',
    secondary_keywords: '',
    long_tail_keywords: '',
    search_intents: 'buy, gift, occasion, styling',
    semantic_entities: 'Jaipur, block print, handcrafted, artisan-made, slow fashion',
    negative_keywords: '',
  });
  const [attributeRows, setAttributeRows] = useState<any[]>([]);
  const [merchantRows, setMerchantRows] = useState<any[]>([]);
  const [mediaSeoRows, setMediaSeoRows] = useState<any[]>([]);

  const variantsById = useMemo(
    () => new Map((variants || []).map((variant) => [variant.id, variant])),
    [variants]
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const [
          seoData,
          discoveryData,
          attributesData,
          merchantData,
          mediaSeoData,
          attributeCatalogData,
          scoreData,
        ] = await Promise.all([
          api.getProductSeo(productId),
          api.getProductDiscovery(productId),
          api.getProductAttributes(productId),
          api.getProductMerchant(productId),
          api.getProductMediaSeo(productId),
          api.getSeoAttributes(),
          api.getProductSeoScore(productId),
        ]);

        if (!mounted) return;

        const nextSeo = seoData.seo || {};
        setSeo({
          seo_title: nextSeo.seo_title || '',
          meta_description: nextSeo.meta_description || '',
          canonical_url: nextSeo.canonical_url || `/products/${productHandle}`,
          robots_index: nextSeo.robots_index !== false,
          robots_follow: nextSeo.robots_follow !== false,
          og_title: nextSeo.og_title || '',
          og_description: nextSeo.og_description || '',
          og_image_url: nextSeo.og_image_url || '',
          twitter_card: nextSeo.twitter_card || 'summary_large_image',
          localized_metadata: nextSeo.localized_metadata || {},
        });

        const nextDiscovery = discoveryData.discovery || {};
        setDiscovery({
          primary_keyword: nextDiscovery.primary_keyword || '',
          secondary_keywords: arrayToCsv(nextDiscovery.secondary_keywords),
          long_tail_keywords: arrayToCsv(nextDiscovery.long_tail_keywords),
          search_intents: arrayToCsv(nextDiscovery.search_intents) || 'buy, gift, occasion, styling',
          semantic_entities:
            arrayToCsv(nextDiscovery.semantic_entities) ||
            'Jaipur, block print, handcrafted, artisan-made, slow fashion',
          negative_keywords: arrayToCsv(nextDiscovery.negative_keywords),
        });

        setAttributeRows(
          (attributesData.attributes || []).map((row: any) => ({
            attribute_id: row.attribute_id,
            raw_value: row.raw_value || row.value_label || '',
            source: row.source || 'admin',
            confidence: row.confidence || 100,
          }))
        );
        setMerchantRows(
          (variants || []).map((variant) => {
            const saved = (merchantData.merchant || []).find((row: any) => row.variant_id === variant.id) || {};
            return {
              variant_id: variant.id,
              gtin: saved.gtin || '',
              mpn: saved.mpn || variant.sku || '',
              item_group_id: saved.item_group_id || productId,
              color: saved.color || '',
              size: saved.size || variant.title || '',
              size_system: saved.size_system || 'IN',
              gender: saved.gender || 'female',
              age_group: saved.age_group || 'adult',
              condition: saved.condition || 'new',
              google_product_category: saved.google_product_category || 'Apparel & Accessories > Clothing',
              material: saved.material || '',
              pattern: saved.pattern || '',
              feed_enabled: saved.feed_enabled === true,
            };
          })
        );
        setMediaSeoRows(
          (mediaItems || [])
            .filter((item) => item.id && item.id !== 'legacy-thumb')
            .map((item) => {
              const saved = (mediaSeoData.media_seo || []).find((row: any) => row.image_id === item.id) || {};
              return {
                image_id: item.id,
                alt_text: saved.alt_text || item.alt_text || '',
                image_role: saved.image_role || (item.is_thumbnail ? 'primary' : 'gallery'),
                view_type: saved.view_type || '',
                color: saved.color || '',
                seo_filename: saved.seo_filename || '',
                cloudinary_public_id: saved.cloudinary_public_id || (item as ProductMediaItem & { public_id?: string }).public_id || '',
                media_type: saved.media_type || item.metadata?.media_type || 'image',
              };
            })
        );
        setAttributeCatalog(attributeCatalogData.attributes || []);
        setScore(scoreData);
      } catch (error) {
        console.error(error);
        showNotification('error', 'Failed to load SEO discovery controls');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [mediaItems, productHandle, productId, showNotification, variants]);

  const addAttributeRow = () => {
    const firstAttribute = attributeCatalog[0];
    setAttributeRows((rows) => [
      ...rows,
      {
        attribute_id: firstAttribute?.id || '',
        raw_value: '',
        source: 'admin',
        confidence: 100,
      },
    ]);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await api.updateProductSeo(productId, seo);
      await api.updateProductDiscovery(productId, {
        primary_keyword: discovery.primary_keyword,
        secondary_keywords: csvToArray(discovery.secondary_keywords),
        long_tail_keywords: csvToArray(discovery.long_tail_keywords),
        search_intents: csvToArray(discovery.search_intents),
        semantic_entities: csvToArray(discovery.semantic_entities),
        negative_keywords: csvToArray(discovery.negative_keywords),
      });
      await api.updateProductAttributes(
        productId,
        attributeRows
          .filter((row) => row.attribute_id && row.raw_value)
          .map((row) => ({ ...row, confidence: Number(row.confidence) || 100 }))
      );
      await api.updateProductMerchant(productId, merchantRows);
      await api.updateProductMediaSeo(productId, mediaSeoRows);

      const nextScore = await api.getProductSeoScore(productId);
      setScore(nextScore);
      showNotification('success', 'SEO & Discovery saved');
    } catch (error) {
      console.error(error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to save SEO & Discovery');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="h-5 w-48 bg-gray-100 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Search size={16} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">SEO & Discovery</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Shopify Plus/WooCommerce-grade metadata, merchant fields, semantic attributes, and AI search readiness.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{score?.score ?? 0}/100</div>
          <div className="text-[10px] uppercase tracking-widest text-gray-400">SEO Score</div>
        </div>
      </div>

      {score?.blocking_errors?.length > 0 ? (
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          Missing before publish: {score.blocking_errors.join(', ')}
        </div>
      ) : (
        <div className="flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          Required product SEO fields are complete.
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>SEO title</label>
          <input className={inputCls} value={seo.seo_title} onChange={(e) => setSeo({ ...seo, seo_title: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Canonical URL</label>
          <input className={inputCls} value={seo.canonical_url} onChange={(e) => setSeo({ ...seo, canonical_url: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Meta description</label>
          <textarea className={inputCls} rows={3} value={seo.meta_description} onChange={(e) => setSeo({ ...seo, meta_description: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>OG title</label>
          <input className={inputCls} value={seo.og_title} onChange={(e) => setSeo({ ...seo, og_title: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>OG image URL</label>
          <input className={inputCls} value={seo.og_image_url} onChange={(e) => setSeo({ ...seo, og_image_url: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={seo.robots_index} onChange={(e) => setSeo({ ...seo, robots_index: e.target.checked })} />
          Index product
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={seo.robots_follow} onChange={(e) => setSeo({ ...seo, robots_follow: e.target.checked })} />
          Follow links
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Locale metadata</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {['en-us', 'en-gb', 'en-au', 'en-eu'].map((locale) => {
            const value = (seo.localized_metadata?.[locale] || {}) as {
              title?: string;
              description?: string;
              path?: string;
            };
            return (
              <div key={locale} className="rounded-lg border border-gray-100 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{locale}</p>
                <input
                  className={inputCls}
                  placeholder="Localized SEO title"
                  value={value.title || ''}
                  onChange={(e) =>
                    setSeo({
                      ...seo,
                      localized_metadata: {
                        ...seo.localized_metadata,
                        [locale]: { ...value, title: e.target.value },
                      },
                    })
                  }
                />
                <textarea
                  className={`${inputCls} mt-2`}
                  rows={2}
                  placeholder="Localized meta description"
                  value={value.description || ''}
                  onChange={(e) =>
                    setSeo({
                      ...seo,
                      localized_metadata: {
                        ...seo.localized_metadata,
                        [locale]: { ...value, description: e.target.value, path: `/${locale}/products/${productHandle}` },
                      },
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Primary keyword</label>
          <input className={inputCls} value={discovery.primary_keyword} onChange={(e) => setDiscovery({ ...discovery, primary_keyword: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Search intents</label>
          <input className={inputCls} value={discovery.search_intents} onChange={(e) => setDiscovery({ ...discovery, search_intents: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Secondary keywords</label>
          <textarea className={inputCls} rows={2} value={discovery.secondary_keywords} onChange={(e) => setDiscovery({ ...discovery, secondary_keywords: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Semantic entities</label>
          <textarea className={inputCls} rows={2} value={discovery.semantic_entities} onChange={(e) => setDiscovery({ ...discovery, semantic_entities: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Long-tail keywords</label>
          <textarea className={inputCls} rows={2} value={discovery.long_tail_keywords} onChange={(e) => setDiscovery({ ...discovery, long_tail_keywords: e.target.value })} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Structured attributes</h3>
          <button type="button" onClick={addAttributeRow} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
            <Plus size={14} /> Add
          </button>
        </div>
        {attributeRows.map((row, index) => (
          <div key={`${row.attribute_id}-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
            <select
              className={inputCls}
              value={row.attribute_id}
              onChange={(e) =>
                setAttributeRows((rows) => rows.map((item, i) => (i === index ? { ...item, attribute_id: e.target.value } : item)))
              }
            >
              {attributeCatalog.map((attribute) => (
                <option key={attribute.id} value={attribute.id}>
                  {attribute.label}
                </option>
              ))}
            </select>
            <input
              className={inputCls}
              value={row.raw_value}
              placeholder="Cotton, block print, festive, relaxed..."
              onChange={(e) =>
                setAttributeRows((rows) => rows.map((item, i) => (i === index ? { ...item, raw_value: e.target.value } : item)))
              }
            />
            <button
              type="button"
              onClick={() => setAttributeRows((rows) => rows.filter((_, i) => i !== index))}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-3 text-gray-500 hover:text-red-600"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </section>

      {merchantRows.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Merchant apparel fields</h3>
          {merchantRows.map((row, index) => (
            <div key={row.variant_id} className="rounded-lg border border-gray-100 p-3">
              <div className="mb-3 text-xs font-semibold text-gray-500">
                {variantsById.get(row.variant_id)?.title || 'Variant'}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['gtin', 'mpn', 'color', 'size', 'material', 'pattern'].map((field) => (
                  <input
                    key={field}
                    className={inputCls}
                    placeholder={field}
                    value={row[field] || ''}
                    onChange={(e) =>
                      setMerchantRows((rows) => rows.map((item, i) => (i === index ? { ...item, [field]: e.target.value } : item)))
                    }
                  />
                ))}
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={row.feed_enabled}
                    onChange={(e) =>
                      setMerchantRows((rows) => rows.map((item, i) => (i === index ? { ...item, feed_enabled: e.target.checked } : item)))
                    }
                  />
                  Feed eligible
                </label>
              </div>
            </div>
          ))}
        </section>
      )}

      {mediaSeoRows.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Image SEO</h3>
          {mediaSeoRows.map((row, index) => (
            <div key={row.image_id} className="grid grid-cols-1 md:grid-cols-[1fr_140px_140px_140px] gap-3">
              <input
                className={inputCls}
                placeholder="Alt text"
                value={row.alt_text}
                onChange={(e) =>
                  setMediaSeoRows((rows) => rows.map((item, i) => (i === index ? { ...item, alt_text: e.target.value } : item)))
                }
              />
              <input
                className={inputCls}
                placeholder="Role"
                value={row.image_role}
                onChange={(e) =>
                  setMediaSeoRows((rows) => rows.map((item, i) => (i === index ? { ...item, image_role: e.target.value } : item)))
                }
              />
              <input
                className={inputCls}
                placeholder="View"
                value={row.view_type}
                onChange={(e) =>
                  setMediaSeoRows((rows) => rows.map((item, i) => (i === index ? { ...item, view_type: e.target.value } : item)))
                }
              />
              <select
                className={inputCls}
                value={row.media_type}
                onChange={(e) =>
                  setMediaSeoRows((rows) => rows.map((item, i) => (i === index ? { ...item, media_type: e.target.value } : item)))
                }
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
          ))}
        </section>
      )}

      <button
        type="button"
        onClick={saveAll}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        <Save size={16} />
        {saving ? 'Saving...' : 'Save SEO & Discovery'}
      </button>
    </div>
  );
}
