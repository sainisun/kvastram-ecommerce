'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { api } from '@/lib/api';

interface ProductRow {
  id: string;
  title: string;
  handle: string;
  description: string;
  price_inr: string;
  material: string;
  origin_country: string;
  inventory_quantity: string;
  status: 'draft' | 'published';
  thumbnail_url: string;
  error?: string;
}

interface ImportResult {
  created_count: number;
  failed_count: number;
  failed: { index: number; title: string; error: string }[];
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function parseCSV(text: string): ProductRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));

  return lines.slice(1).map((line, i) => {
    // Handle quoted fields
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { cols.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    cols.push(current.trim());

    const get = (key: string) => cols[headers.indexOf(key)] ?? '';

    const title = get('title') || get('name') || get('product_name') || '';
    const handle = get('handle') || get('slug') || slugify(title);

    return {
      id: `row-${i}`,
      title,
      handle,
      description: get('description') || get('desc') || '',
      price_inr: get('price_inr') || get('price') || get('mrp') || '',
      material: get('material') || '',
      origin_country: get('origin_country') || get('origin') || '',
      inventory_quantity: get('inventory_quantity') || get('stock') || get('qty') || '0',
      status: (get('status') === 'published' ? 'published' : 'draft') as 'draft' | 'published',
      thumbnail_url: get('thumbnail_url') || get('image_url') || get('image') || '',
    };
  }).filter((r) => r.title);
}

function emptyRow(index: number): ProductRow {
  return {
    id: `manual-${index}-${Date.now()}`,
    title: '',
    handle: '',
    description: '',
    price_inr: '',
    material: '',
    origin_country: 'India',
    inventory_quantity: '0',
    status: 'draft',
    thumbnail_url: '',
  };
}

const SAMPLE_CSV = `title,handle,description,price_inr,material,origin_country,inventory_quantity,status,thumbnail_url
Blue Floral Tote Bag,blue-floral-tote-bag,Handmade quilted cotton tote bag,899,Cotton,India,25,draft,
Red Floral Tote Bag,red-floral-tote-bag,Handmade quilted cotton tote bag,899,Cotton,India,20,draft,
Green Tote Bag,green-tote-bag,Handmade quilted cotton shopping bag,799,Cotton,India,30,draft,`;

const inputCls = 'w-full rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-3 py-2 text-xs text-[var(--on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30';
const selectCls = `${inputCls} cursor-pointer`;

export default function BulkImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<ProductRow[]>([emptyRow(0)]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleCSV = useCallback((text: string) => {
    const parsed = parseCSV(text);
    if (parsed.length === 0) {
      alert('CSV mein koi valid product nahi mila. "title" column zaroori hai.');
      return;
    }
    setRows(parsed);
    setResult(null);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleCSV(ev.target?.result as string);
    reader.readAsText(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleCSV(ev.target?.result as string);
    reader.readAsText(file);
  };

  const updateRow = (id: string, field: keyof ProductRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === 'title' && !r.handle) {
          updated.handle = slugify(value);
        }
        return updated;
      })
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow(prev.length)]);
  };

  const handleImport = async () => {
    const valid = rows.filter((r) => r.title.trim());
    if (valid.length === 0) {
      alert('Kam se kam ek product ka title zaroori hai.');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const products = valid.map((r) => {
        const priceInr = parseFloat(r.price_inr);
        const qty = parseInt(r.inventory_quantity) || 0;

        return {
          title: r.title.trim(),
          handle: r.handle.trim() || slugify(r.title),
          description: r.description || undefined,
          status: r.status,
          material: r.material || undefined,
          origin_country: r.origin_country || undefined,
          inventory_quantity: qty,
          thumbnail: r.thumbnail_url || undefined,
          images: r.thumbnail_url
            ? [{ url: r.thumbnail_url, alt: r.title, position: 0 }]
            : undefined,
          prices: !isNaN(priceInr) && priceInr > 0
            ? [{ currency_code: 'inr', amount: Math.round(priceInr * 100) }]
            : undefined,
        };
      });

      const data = await api.bulkCreateProducts(products);
      setResult(data as ImportResult);
      setRows([emptyRow(0)]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kvastram-bulk-import-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = rows.filter((r) => r.title.trim()).length;

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            href="/dashboard/products"
            className="mb-3 flex items-center gap-1.5 text-xs font-bold text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] transition-colors"
          >
            <ArrowLeft size={13} /> Back to Products
          </Link>
          <h2 className="text-[2rem] font-black leading-none tracking-tight text-[var(--on-surface)]">
            Bulk Import
          </h2>
          <p className="mt-1.5 text-sm text-[var(--on-surface-variant)]">
            CSV upload karo ya manually products add karo — ek saath 50 tak.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={downloadSample}
            className="flex items-center gap-1.5 rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors"
          >
            <Download size={13} /> Sample CSV
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors"
          >
            <FileText size={13} /> Upload CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileChange} />
        </div>
      </div>

      {/* Success result */}
      {result && (
        <div className={`rounded-2xl border p-5 ${result.failed_count === 0 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
          <div className="flex items-start gap-3">
            {result.failed_count === 0
              ? <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-600" />
              : <AlertCircle size={20} className="mt-0.5 shrink-0 text-yellow-600" />}
            <div className="flex-1">
              <p className="font-bold text-sm text-[var(--on-surface)]">
                {result.created_count} product{result.created_count !== 1 ? 's' : ''} successfully create ho gaye
                {result.failed_count > 0 && `, ${result.failed_count} failed`}
              </p>
              {result.failed?.map((f) => (
                <p key={f.index} className="mt-1 text-xs text-yellow-700">
                  • {f.title}: {f.error}
                </p>
              ))}
              {result.created_count > 0 && (
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/products')}
                  className="mt-3 rounded-full bg-[var(--primary)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white hover:opacity-90"
                >
                  Products dekhein →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSV drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
          dragOver
            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
            : 'border-[var(--outline-variant)] hover:border-[var(--on-surface-variant)]'
        }`}
      >
        <Upload size={22} className="mx-auto mb-2 text-[var(--on-surface-variant)]" />
        <p className="text-sm font-semibold text-[var(--on-surface)]">
          CSV file yahan drag karo ya click karke choose karo
        </p>
        <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
          Columns: title, handle, description, price_inr, material, origin_country, inventory_quantity, status, thumbnail_url
        </p>
      </div>

      {/* Editable table */}
      <div className="rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] shadow-[0_4px_12px_rgba(25,28,30,0.04)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--surface-container-high)]">
          <p className="text-sm font-bold text-[var(--on-surface)]">
            Products to Import
            <span className="ml-2 text-xs font-normal text-[var(--on-surface-variant)]">
              ({validCount} valid)
            </span>
          </p>
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 rounded-full border border-[var(--outline-variant)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors"
          >
            <Plus size={11} /> Row add karo
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--surface-container-high)] bg-[var(--surface-container-low)]">
                {['Title *', 'Handle', 'Price (₹)', 'Material', 'Origin', 'Stock', 'Status', 'Thumbnail URL', ''].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-bold uppercase tracking-widest text-[10px] text-[var(--on-surface-variant)] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--surface-container-low)]">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-[var(--surface-container-low)]/50">
                  <td className="px-3 py-2 min-w-[180px]">
                    <input
                      className={inputCls}
                      placeholder="Product title *"
                      value={row.title}
                      onChange={(e) => updateRow(row.id, 'title', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 min-w-[160px]">
                    <input
                      className={inputCls}
                      placeholder="auto-generated"
                      value={row.handle}
                      onChange={(e) => updateRow(row.id, 'handle', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 min-w-[100px]">
                    <input
                      className={inputCls}
                      placeholder="899"
                      type="number"
                      min="0"
                      value={row.price_inr}
                      onChange={(e) => updateRow(row.id, 'price_inr', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 min-w-[120px]">
                    <input
                      className={inputCls}
                      placeholder="Cotton"
                      value={row.material}
                      onChange={(e) => updateRow(row.id, 'material', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 min-w-[100px]">
                    <input
                      className={inputCls}
                      placeholder="India"
                      value={row.origin_country}
                      onChange={(e) => updateRow(row.id, 'origin_country', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 min-w-[80px]">
                    <input
                      className={inputCls}
                      placeholder="0"
                      type="number"
                      min="0"
                      value={row.inventory_quantity}
                      onChange={(e) => updateRow(row.id, 'inventory_quantity', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 min-w-[110px]">
                    <select
                      className={selectCls}
                      value={row.status}
                      onChange={(e) => updateRow(row.id, 'status', e.target.value)}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 min-w-[200px]">
                    <input
                      className={inputCls}
                      placeholder="https://..."
                      value={row.thumbnail_url}
                      onChange={(e) => updateRow(row.id, 'thumbnail_url', e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--on-surface-variant)] hover:bg-[var(--error-container)] hover:text-[var(--on-error-container)] transition-colors disabled:opacity-30"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import button */}
      <div className="flex items-center justify-between rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-5 py-4">
        <p className="text-sm text-[var(--on-surface-variant)]">
          <span className="font-bold text-[var(--on-surface)]">{validCount} product{validCount !== 1 ? 's' : ''}</span> import hone ke liye ready hain.
          {' '}Images baad mein product edit karke upload kar sakte hain.
        </p>
        <button
          type="button"
          onClick={handleImport}
          disabled={importing || validCount === 0}
          className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {importing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {importing ? 'Importing...' : `Import ${validCount} Products`}
        </button>
      </div>

    </div>
  );
}
