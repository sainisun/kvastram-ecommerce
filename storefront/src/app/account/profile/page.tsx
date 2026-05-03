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
    <div className="min-h-screen bg-stone-50 py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-2xl px-6 md:px-12 lg:px-20">
        <Link
          href="/account"
          className="account-muted mb-8 inline-flex items-center gap-2 transition-colors hover:text-stone-900"
        >
          <ArrowLeft size={16} /> Back to Account
        </Link>

        <div className="bg-white p-8 border border-stone-200 shadow-sm">
          <h1 className="account-detail-title mb-6">
            Edit Profile
          </h1>

          {message && (
            <div
              className={`account-alert mb-6 rounded-sm p-4 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="account-form-label mb-2 block">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  className="account-input w-full border border-stone-200 p-3 focus:outline-none focus:border-stone-900"
                />
              </div>
              <div>
                <label className="account-form-label mb-2 block">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  className="account-input w-full border border-stone-200 p-3 focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="account-form-label mb-2 block">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="account-input w-full cursor-not-allowed border border-stone-100 bg-stone-50 p-3 text-stone-500"
              />
              <p className="account-caption mt-1">
                Email cannot be changed directly.
              </p>
            </div>

            <div>
              <label className="account-form-label mb-2 block">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="account-input w-full border border-stone-200 p-3 focus:outline-none focus:border-stone-900"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="account-primary-action flex w-full items-center justify-center gap-2 bg-stone-900 py-3.5 transition-colors hover:bg-stone-800 disabled:opacity-70"
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
