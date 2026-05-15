'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react';

import { api } from '@/lib/api';
import { useNotification } from '@/context/notification-context';

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

function getLandingRuleFields(rule: any) {
  if (rule?.category_id) {
    return { rule_type: 'category_id', rule_value: String(rule.category_id) };
  }
  if (rule?.collection_id) {
    return { rule_type: 'collection_id', rule_value: String(rule.collection_id) };
  }
  if (rule?.attribute_code && rule?.attribute_value) {
    return { rule_type: 'attribute', rule_value: `${rule.attribute_code}:${rule.attribute_value}` };
  }
  return { rule_type: 'search', rule_value: rule?.search ? String(rule.search) : '' };
}

const emptyLandingForm = {
  slug: '',
  title: '',
  meta_description: '',
  intro_content: '',
  outro_content: '',
  status: 'draft',
  priority: 65,
  rule_type: 'search',
  rule_value: '',
};

const emptySynonymForm = {
  term: '',
  synonyms: '',
  boost: 1,
};

export default function SeoDiscoveryPage() {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [landingPages, setLandingPages] = useState<any[]>([]);
  const [synonyms, setSynonyms] = useState<any[]>([]);
  const [zeroResults, setZeroResults] = useState<any[]>([]);
  const [topQueries, setTopQueries] = useState<any[]>([]);
  const [attributeGaps, setAttributeGaps] = useState<any[]>([]);
  const [merchantDiagnostics, setMerchantDiagnostics] = useState<any>(null);
  const [editingLandingId, setEditingLandingId] = useState<string | null>(null);
  const [editingSynonymId, setEditingSynonymId] = useState<string | null>(null);
  const [landingForm, setLandingForm] = useState(emptyLandingForm);
  const [synonymForm, setSynonymForm] = useState(emptySynonymForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [landingData, synonymData, zeroResultData, topQueryData, gapData, merchantData] = await Promise.all([
        api.getSeoLandingPages(),
        api.getSearchSynonyms(),
        api.getZeroResultSearches(),
        api.getTopSearchQueries(),
        api.getAttributeGapReport(),
        api.getGoogleMerchantDiagnostics().catch(() => null),
      ]);
      setLandingPages(landingData.landing_pages || []);
      setSynonyms(synonymData.synonyms || []);
      setZeroResults(zeroResultData.zero_results || []);
      setTopQueries(topQueryData.top_queries || []);
      setAttributeGaps(gapData.attribute_gaps || []);
      setMerchantDiagnostics(merchantData);
    } catch (error) {
      console.error(error);
      showNotification('error', 'Failed to load SEO discovery data');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetLandingForm = () => {
    setEditingLandingId(null);
    setLandingForm(emptyLandingForm);
  };

  const resetSynonymForm = () => {
    setEditingSynonymId(null);
    setSynonymForm(emptySynonymForm);
  };

  const buildLandingPayload = () => {
    const rule_definition =
      landingForm.rule_type === 'category_id'
        ? { category_id: landingForm.rule_value.trim() }
        : landingForm.rule_type === 'collection_id'
          ? { collection_id: landingForm.rule_value.trim() }
          : landingForm.rule_type === 'attribute'
            ? {
                attribute_code: landingForm.rule_value.split(':')[0]?.trim(),
                attribute_value: landingForm.rule_value.split(':')[1]?.trim(),
              }
          : { search: landingForm.rule_value.trim() };

    return {
      slug: landingForm.slug.trim(),
      title: landingForm.title.trim(),
      meta_description: landingForm.meta_description.trim(),
      intro_content: landingForm.intro_content,
      outro_content: landingForm.outro_content,
      status: landingForm.status,
      priority: Number(landingForm.priority) || 65,
      robots_index: landingForm.status === 'active',
      robots_follow: true,
      rule_definition,
    };
  };

  const saveLandingPage = async () => {
    try {
      const payload = buildLandingPayload();
      if (editingLandingId) {
        await api.updateSeoLandingPage(editingLandingId, payload);
        showNotification('success', 'SEO landing page updated');
      } else {
        await api.createSeoLandingPage(payload);
        showNotification('success', 'SEO landing page created');
      }
      resetLandingForm();
      await loadData();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to save landing page');
    }
  };

  const editLandingPage = (page: any) => {
    const ruleFields = getLandingRuleFields(page.rule_definition || {});
    setEditingLandingId(page.id);
    setLandingForm({
      slug: page.slug || '',
      title: page.title || '',
      meta_description: page.meta_description || '',
      intro_content: page.intro_content || '',
      outro_content: page.outro_content || '',
      status: page.status || 'draft',
      priority: Number(page.priority) || 65,
      rule_type: ruleFields.rule_type,
      rule_value: ruleFields.rule_value,
    });
  };

  const setLandingStatus = async (page: any, status: 'draft' | 'active' | 'archived') => {
    try {
      await api.updateSeoLandingPage(page.id, {
        status,
        robots_index: status === 'active',
        robots_follow: true,
      });
      showNotification('success', `Landing page set to ${status}`);
      await loadData();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to update landing page');
    }
  };

  const archiveLandingPage = async (page: any) => {
    try {
      await api.deleteSeoLandingPage(page.id);
      showNotification('success', 'SEO landing page archived');
      await loadData();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to archive landing page');
    }
  };

  const deleteSynonym = async (row: any) => {
    try {
      await api.deleteSearchSynonym(row.id);
      showNotification('success', 'Synonym deleted');
      await loadData();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to delete synonym');
    }
  };

  const saveSynonym = async () => {
    try {
      const payload = {
        locale: 'en',
        term: synonymForm.term.trim(),
        normalized_term: synonymForm.term.trim().toLowerCase(),
        synonyms: csvToArray(synonymForm.synonyms),
        boost: Number(synonymForm.boost) || 1,
      };

      if (editingSynonymId) {
        await api.updateSearchSynonym(editingSynonymId, payload);
        showNotification('success', 'Search synonym updated');
      } else {
        await api.createSearchSynonym(payload);
        showNotification('success', 'Search synonym created');
      }
      resetSynonymForm();
      await loadData();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to save synonym');
    }
  };

  const editSynonym = (row: any) => {
    setEditingSynonymId(row.id);
    setSynonymForm({
      term: row.term || '',
      synonyms: arrayToCsv(row.synonyms),
      boost: Number(row.boost) || 1,
    });
  };

  if (loading) {
    return <div className="p-8 text-sm text-gray-500">Loading SEO discovery...</div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Search size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Discovery</h1>
          <p className="text-sm text-gray-500">
            Control indexable landing pages, synonym matching, and zero-result search gaps.
          </p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingLandingId ? 'Edit SEO Landing Page' : 'Create SEO Landing Page'}
            </h2>
            {editingLandingId && (
              <button type="button" onClick={resetLandingForm} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700">
                <X size={14} /> Cancel
              </button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Slug</label>
              <input className={inputCls} value={landingForm.slug} onChange={(e) => setLandingForm({ ...landingForm, slug: e.target.value })} placeholder="cotton-kaftans" />
            </div>
            <div>
              <label className={labelCls}>Title</label>
              <input className={inputCls} value={landingForm.title} onChange={(e) => setLandingForm({ ...landingForm, title: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Meta description</label>
              <textarea className={inputCls} rows={2} value={landingForm.meta_description} onChange={(e) => setLandingForm({ ...landingForm, meta_description: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Rule type</label>
              <select className={inputCls} value={landingForm.rule_type} onChange={(e) => setLandingForm({ ...landingForm, rule_type: e.target.value })}>
                <option value="search">Search phrase</option>
                <option value="category_id">Category ID</option>
                <option value="collection_id">Collection ID</option>
                <option value="attribute">Attribute code:value</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Rule value</label>
              <input className={inputCls} value={landingForm.rule_value} onChange={(e) => setLandingForm({ ...landingForm, rule_value: e.target.value })} placeholder={landingForm.rule_type === 'attribute' ? 'fabric:cotton' : undefined} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={landingForm.status} onChange={(e) => setLandingForm({ ...landingForm, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <input className={inputCls} type="number" value={landingForm.priority} onChange={(e) => setLandingForm({ ...landingForm, priority: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Intro content</label>
              <textarea className={inputCls} rows={2} value={landingForm.intro_content} onChange={(e) => setLandingForm({ ...landingForm, intro_content: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Outro content</label>
              <textarea className={inputCls} rows={2} value={landingForm.outro_content} onChange={(e) => setLandingForm({ ...landingForm, outro_content: e.target.value })} />
            </div>
          </div>
          <button type="button" onClick={saveLandingPage} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white">
            {editingLandingId ? <Save size={16} /> : <Plus size={16} />}
            {editingLandingId ? 'Update Landing Page' : 'Create Landing Page'}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingSynonymId ? 'Edit Search Synonym' : 'Create Search Synonym'}
            </h2>
            {editingSynonymId && (
              <button type="button" onClick={resetSynonymForm} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700">
                <X size={14} /> Cancel
              </button>
            )}
          </div>
          <div>
            <label className={labelCls}>Term</label>
            <input className={inputCls} value={synonymForm.term} onChange={(e) => setSynonymForm({ ...synonymForm, term: e.target.value })} placeholder="block print" />
          </div>
          <div>
            <label className={labelCls}>Synonyms</label>
            <textarea className={inputCls} rows={3} value={synonymForm.synonyms} onChange={(e) => setSynonymForm({ ...synonymForm, synonyms: e.target.value })} placeholder="bagru print, sanganeri print" />
          </div>
          <div>
            <label className={labelCls}>Boost</label>
            <input className={inputCls} type="number" min={1} max={10} value={synonymForm.boost} onChange={(e) => setSynonymForm({ ...synonymForm, boost: Number(e.target.value) })} />
          </div>
          <button type="button" onClick={saveSynonym} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white">
            <Save size={16} /> {editingSynonymId ? 'Update Synonym' : 'Save Synonym'}
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Landing Pages</h2>
          <div className="divide-y divide-gray-100">
            {landingPages.map((page) => (
              <div key={page.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">/collections/{page.slug}</p>
                  <p className="text-sm text-gray-500">{page.title}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {JSON.stringify(page.rule_definition || {})}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                    {page.status}
                  </span>
                  {page.status !== 'active' && (
                    <button type="button" onClick={() => setLandingStatus(page, 'active')} className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-green-700">
                      Activate
                    </button>
                  )}
                  {page.status !== 'draft' && (
                    <button type="button" onClick={() => setLandingStatus(page, 'draft')} className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700">
                      Draft
                    </button>
                  )}
                  <button type="button" onClick={() => editLandingPage(page)} className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-blue-700">
                    Edit
                  </button>
                  <button type="button" onClick={() => archiveLandingPage(page)} className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-red-600">
                    Archive
                  </button>
                </div>
              </div>
            ))}
            {landingPages.length === 0 && <p className="text-sm text-gray-500">No SEO landing pages yet.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Zero-result Queries</h2>
          <div className="space-y-2">
            {zeroResults.slice(0, 12).map((row) => (
              <div key={row.id} className="rounded-lg border border-gray-100 px-3 py-2">
                <p className="text-sm font-medium text-gray-900">{row.query}</p>
                <p className="text-xs text-gray-400">{row.created_at}</p>
              </div>
            ))}
            {zeroResults.length === 0 && <p className="text-sm text-gray-500">No zero-result searches logged.</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Queries</h2>
          <div className="space-y-2">
            {topQueries.slice(0, 10).map((row, index) => (
              <div key={`${row.query}-${index}`} className="rounded-lg border border-gray-100 px-3 py-2">
                <p className="text-sm font-medium text-gray-900">{row.query || '(blank)'}</p>
                <p className="text-xs text-gray-500">{row.searches} searches - avg {row.avg_results || 0} results</p>
              </div>
            ))}
            {topQueries.length === 0 && <p className="text-sm text-gray-500">No search queries logged.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attribute Gaps</h2>
          <div className="space-y-2">
            {attributeGaps.slice(0, 10).map((row, index) => (
              <div key={`${row.query}-${index}`} className="rounded-lg border border-gray-100 px-3 py-2">
                <p className="text-sm font-medium text-gray-900">{row.query}</p>
                <p className="text-xs text-gray-500">{row.implied_attribute}: {row.implied_value}</p>
              </div>
            ))}
            {attributeGaps.length === 0 && <p className="text-sm text-gray-500">No attribute gaps detected.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Merchant Diagnostics</h2>
          {merchantDiagnostics?.totals ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xl font-bold text-gray-900">{merchantDiagnostics.totals.variants}</p>
                  <p className="text-xs text-gray-500">Variants</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-xl font-bold text-green-700">{merchantDiagnostics.totals.eligible}</p>
                  <p className="text-xs text-green-700">Eligible</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="text-xl font-bold text-amber-700">{merchantDiagnostics.totals.with_issues}</p>
                  <p className="text-xs text-amber-700">Issues</p>
                </div>
              </div>
              {merchantDiagnostics.diagnostics?.slice(0, 5).map((row: any) => (
                <div key={row.variant_id} className="rounded-lg border border-gray-100 px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">{row.product_title}</p>
                  <p className="text-xs text-gray-500">{row.issues?.join(', ') || 'Ready'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Diagnostics unavailable until backend is connected.</p>
          )}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Synonyms</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {synonyms.map((row) => (
            <div key={row.id} className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{row.term}</p>
                  <p className="text-sm text-gray-500">{arrayToCsv(row.synonyms)}</p>
                  <p className="mt-1 text-xs text-gray-400">Boost {row.boost || 1}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => editSynonym(row)} className="rounded-lg border border-gray-200 p-2 text-blue-700">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => deleteSynonym(row)} className="rounded-lg border border-gray-200 p-2 text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {synonyms.length === 0 && <p className="text-sm text-gray-500">No synonyms yet.</p>}
        </div>
      </section>
    </div>
  );
}
