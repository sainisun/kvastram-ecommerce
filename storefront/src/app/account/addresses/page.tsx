'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Edit2, MapPin } from 'lucide-react';
import { getCountryName } from '@/config/countries';

interface Address {
  id: string;
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  postal_code: string;
  country_code: string;
  phone?: string;
  is_default?: boolean;
}

export default function AddressesPage() {
  const { customer, loading } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    address_1: '',
    address_2: '',
    city: '',
    postal_code: '',
    country_code: 'US',
    phone: '',
  });

  // Load addresses
  // In a real app, this would fetch from API
  // For now, we'll show empty state

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !customer) {
      router.push('/login');
    }
  }, [customer, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowForm(false);
    setEditingId(null);
    setFormData({
      first_name: '',
      last_name: '',
      address_1: '',
      address_2: '',
      city: '',
      postal_code: '',
      country_code: 'US',
      phone: '',
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-8 text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to Account
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif text-stone-900 mb-2">
              Addresses
            </h1>
            <p className="text-stone-500">Manage your shipping addresses</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
          >
            <Plus size={16} /> Add New
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white border border-stone-200 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-serif mb-6">
              {editingId ? 'Edit Address' : 'New Address'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
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
                    required
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
                  Address
                </label>
                <input
                  type="text"
                  required
                  value={formData.address_1}
                  onChange={(e) =>
                    setFormData({ ...formData, address_1: e.target.value })
                  }
                  className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900"
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
                  Apartment, suite, etc. (optional)
                </label>
                <input
                  type="text"
                  value={formData.address_2}
                  onChange={(e) =>
                    setFormData({ ...formData, address_2: e.target.value })
                  }
                  className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.postal_code}
                    onChange={(e) =>
                      setFormData({ ...formData, postal_code: e.target.value })
                    }
                    className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
                  Country
                </label>
                <select
                  value={formData.country_code}
                  onChange={(e) =>
                    setFormData({ ...formData, country_code: e.target.value })
                  }
                  className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900"
                >
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="IN">India</option>
                  <option value="JP">Japan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="bg-stone-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
                >
                  Save Address
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      first_name: '',
                      last_name: '',
                      address_1: '',
                      address_2: '',
                      city: '',
                      postal_code: '',
                      country_code: 'US',
                      phone: '',
                    });
                  }}
                  className="border border-stone-300 text-stone-600 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address List */}
        {addresses.length === 0 && !showForm ? (
          <div className="bg-white border border-stone-200 shadow-sm p-12 text-center">
            <MapPin size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="font-serif text-lg text-stone-900 mb-2">
              No Addresses Yet
            </h3>
            <p className="text-stone-500 mb-6">
              Add an address to speed up checkout
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
            >
              <Plus size={16} /> Add Your First Address
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white border border-stone-200 shadow-sm p-6 flex justify-between items-start"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    {address.first_name} {address.last_name}
                  </p>
                  <p className="text-sm text-stone-600 mt-1">
                    {address.address_1}
                    {address.address_2 && `, ${address.address_2}`}
                  </p>
                  <p className="text-sm text-stone-600">
                    {address.city}, {address.postal_code}
                  </p>
                  <p className="text-sm text-stone-600">
                    {getCountryName(address.country_code)}
                  </p>
                  {address.phone && (
                    <p className="text-sm text-stone-500 mt-2">
                      {address.phone}
                    </p>
                  )}
                  {address.is_default && (
                    <span className="inline-block mt-3 px-2 py-1 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(address.id);
                      setFormData({
                        first_name: address.first_name,
                        last_name: address.last_name,
                        address_1: address.address_1,
                        address_2: address.address_2 || '',
                        city: address.city,
                        postal_code: address.postal_code,
                        country_code: address.country_code,
                        phone: address.phone || '',
                      });
                      setShowForm(true);
                    }}
                    className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
