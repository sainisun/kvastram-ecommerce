'use client';

import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { customer, loading, setUser } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !customer) {
      router.push('/login');
    }
    if (customer) {
      setFormData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        phone: customer.phone || '',
        email: customer.email || '', // Readonly
      });
    }
  }, [loading, customer, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.updateCustomer({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
      });
      setUser(res.customer);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !customer)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-24">
      <div className="max-w-2xl mx-auto px-6">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-8 text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to Account
        </Link>

        <div className="bg-white p-8 border border-stone-200 shadow-sm">
          <h1 className="text-2xl font-serif text-stone-900 mb-6">
            Edit Profile
          </h1>

          {message && (
            <div
              className={`p-4 mb-6 text-sm rounded-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full border border-stone-100 bg-stone-50 p-3 text-sm text-stone-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Email cannot be changed directly.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 w-full bg-stone-900 text-white py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
