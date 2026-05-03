'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Plus, Trash2, ArrowRight, RefreshCw } from 'lucide-react';

interface Redirect {
  id: string;
  from_path: string;
  to_path: string;
  status: 301 | 302;
  created_at: string;
}

const emptyForm = { from_path: '', to_path: '', status: 301 as 301 | 302 };

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');

  const fetchRedirects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.request('/redirects');
      setRedirects(data.redirects || []);
    } catch {
      setRedirects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRedirects(); }, [fetchRedirects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.from_path.startsWith('/') || !formData.to_path.startsWith('/')) {
      setError('Both paths must start with /');
      return;
    }
    setSaving(true);
    try {
      await api.request('/redirects', { method: 'POST', body: JSON.stringify(formData) });
      setFormData(emptyForm);
      setShowForm(false);
      void fetchRedirects();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create redirect');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, from: string) => {
    if (!confirm(`Delete redirect: ${from}?`)) return;
    try {
      await api.request(`/redirects/${id}`, { method: 'DELETE' });
      void fetchRedirects();
    } catch {
      alert('Failed to delete redirect');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Redirects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage 301/302 redirects for broken or moved URLs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void fetchRedirects()}
            className="p-2 text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setError(''); setFormData(emptyForm); }}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm"
          >
            <Plus size={16} /> Add Redirect
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">New Redirect</h2>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr,120px] gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From Path</label>
                <input
                  type="text"
                  value={formData.from_path}
                  onChange={(e) => setFormData({ ...formData, from_path: e.target.value })}
                  required
                  placeholder="/old-url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <ArrowRight size={18} className="text-gray-400 mb-2" />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To Path</label>
                <input
                  type="text"
                  value={formData.to_path}
                  onChange={(e) => setFormData({ ...formData, to_path: e.target.value })}
                  required
                  placeholder="/new-url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) as 301 | 302 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value={301}>301 Permanent</option>
                  <option value={302}>302 Temporary</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Create Redirect'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-[1fr,auto,1fr,80px,120px,48px] gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div>From</div>
          <div />
          <div>To</div>
          <div>Type</div>
          <div>Created</div>
          <div />
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2" />
            Loading...
          </div>
        ) : redirects.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ArrowRight size={40} className="mx-auto mb-3 text-gray-300" />
            <p>No redirects yet. Add one to fix broken links.</p>
          </div>
        ) : (
          redirects.map((r) => (
            <div key={r.id} className="grid grid-cols-[1fr,auto,1fr,80px,120px,48px] gap-3 px-4 py-3 items-center border-b border-gray-100 last:border-0 hover:bg-gray-50">
              <span className="text-sm font-mono text-gray-800 truncate">{r.from_path}</span>
              <ArrowRight size={14} className="text-gray-400 shrink-0" />
              <span className="text-sm font-mono text-gray-600 truncate">{r.to_path}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${r.status === 301 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                {r.status}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(r.created_at).toLocaleDateString('en-IN')}
              </span>
              <button
                onClick={() => void handleDelete(r.id, r.from_path)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
