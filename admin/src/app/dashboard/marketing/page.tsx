'use client';

import { useState, useEffect } from 'react';
import {
  Megaphone,
  Mail,
  Tag,
  Users,
  Calendar,
  DollarSign,
  Target,
  Plus,
  Trash2,
  Edit2,
  Bell,
} from 'lucide-react';
import { api } from '@/lib/api';
export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);

  // Modal states
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showEditCampaignModal, setShowEditCampaignModal] = useState(false);
  const [showEditDiscountModal, setShowEditDiscountModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [editingDiscount, setEditingDiscount] = useState<any>(null);

  // Blast Modal
  const [showBlastModal, setShowBlastModal] = useState(false);
  const [blastLoading, setBlastLoading] = useState(false);
  const [selectedBlastCampaign, setSelectedBlastCampaign] = useState<any>(null);
  const [blastMsg, setBlastMsg] = useState<string | null>(null);
  const [blastForm, setBlastForm] = useState({
    subject: '',
    headline: '',
    body_text: '',
    cta_text: 'Shop Now',
    cta_url: '/',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [campaignsData, discountsData] = await Promise.all([
        api.getCampaigns(),
        api.getDiscounts(),
      ]);
      setCampaigns(campaignsData?.campaigns || []);
      setDiscounts(discountsData?.discounts || []);
    } catch (error) {
      console.error('Error fetching marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await api.createCampaign({
        ...formData,
        status: 'active', // Default status
        start_date: new Date().toISOString(), // Default start now
      });
      setShowCampaignModal(false);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete campaign "${name}"?`)) return;

    try {
      await api.deleteCampaign(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign');
    }
  };

  const handleUpdateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCampaign) return;

    try {
      await api.updateCampaign(editingCampaign.id, {
        name: editingCampaign.name,
        description: editingCampaign.description,
        status: editingCampaign.status,
        type: editingCampaign.type,
      });
      setShowEditCampaignModal(false);
      setEditingCampaign(null);
      fetchData();
    } catch (error) {
      console.error('Error updating campaign:', error);
      alert('Failed to update campaign');
    }
  };

  const handleUpdateDiscount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDiscount) return;

    try {
      await api.updateDiscount(editingDiscount.id, {
        code: editingDiscount.code,
        type: editingDiscount.type,
        value: Number.parseInt(editingDiscount.value),
        is_active: editingDiscount.is_active,
        usage_limit: editingDiscount.usage_limit
          ? Number.parseInt(editingDiscount.usage_limit)
          : null,
        starts_at: editingDiscount.starts_at
          ? new Date(editingDiscount.starts_at).toISOString()
          : undefined,
        ends_at: editingDiscount.ends_at
          ? new Date(editingDiscount.ends_at).toISOString()
          : undefined,
      });
      setShowEditDiscountModal(false);
      setEditingDiscount(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating discount:', error);
      const msg =
        error.response?.details?.[0]?.message ||
        error.message ||
        'Failed to update discount';
      alert(msg);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await api.createDiscount({
        ...formData,
        value: Number.parseInt(formData.value),
        usage_limit: formData.usage_limit
          ? Number.parseInt(formData.usage_limit)
          : null,
        is_active: true,
        starts_at: formData.starts_at
          ? new Date(formData.starts_at).toISOString()
          : undefined,
        ends_at: formData.ends_at
          ? new Date(formData.ends_at).toISOString()
          : undefined,
      });
      setShowDiscountModal(false);
      setFormData({});
      fetchData();
    } catch (error: any) {
      console.error('Error creating discount:', error);
      const msg =
        error.response?.details?.[0]?.message ||
        error.message ||
        'Failed to create discount';
      alert(msg);
    }
  };

  const handleDeleteDiscount = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete discount code "${code}"?`))
      return;

    try {
      await api.deleteDiscount(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert('Failed to delete discount');
    }
  };

  const handleSendBlast = async () => {
    if (!selectedBlastCampaign) return;
    setBlastLoading(true);
    setBlastMsg(null);
    try {
      const res = await api.post(
        `/marketing/campaigns/${selectedBlastCampaign.id}/send`,
        blastForm
      );
      setBlastMsg((res as any).message || 'Blast sent successfully!');
      fetchData();
    } catch (err: any) {
      setBlastMsg(`Error: ${err.message}`);
    } finally {
      setBlastLoading(false);
    }
  };

  const tabs = [
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'discounts', label: 'Discounts', icon: Tag },

    // { id: 'email', label: 'Email Marketing', icon: Mail },

    // { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading marketing data...
      </div>
    );
  }

  return (
    <div className="p-8 relative">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing</h1>
        <p className="text-gray-600">
          Manage campaigns, discounts, and promotional activities
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Megaphone className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Active Campaigns</p>
          <p className="text-2xl font-bold text-gray-900">
            {campaigns.filter((c) => c.status === 'active').length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Tag className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Active Discounts</p>
          <p className="text-2xl font-bold text-gray-900">
            {discounts.filter((d) => d.is_active).length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Mail className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Customers Reached</p>
          <p className="text-2xl font-bold text-gray-900">
            {campaigns.reduce(
              (acc, curr) => acc + (curr.customers_reached || 0),
              0
            )}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="flex gap-3">
          <a
            href="/dashboard/marketing/back-in-stock"
            className="flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <Bell size={18} className="text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Back-in-Stock Alerts
              </p>
              <p className="text-xs text-amber-600">
                View & manage restock subscribers
              </p>
            </div>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === 'campaigns' && (
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Marketing Campaigns
                </h2>
                <button
                  onClick={() => setShowCampaignModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <Plus size={18} />
                  Create Campaign
                </button>
              </div>

              <div className="space-y-4">
                {campaigns.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No campaigns found. Create your first one!
                  </p>
                ) : (
                  campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {campaign.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {campaign.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>
                                {new Date(
                                  campaign.start_date || campaign.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users size={14} />
                              <span>
                                {campaign.customers_reached || 0} reached
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target size={14} />
                              <span>
                                {campaign.conversions || 0} conversions
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign size={14} />
                              <span>
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD',
                                }).format((campaign.revenue || 0) / 100)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`px-3 py-1 text-sm font-medium rounded-full ${
                              campaign.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {campaign.status}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingCampaign(campaign);
                                setShowEditCampaignModal(true);
                              }}
                              className="text-blue-500 hover:text-blue-700 p-1"
                              title="Edit Campaign"
                            >
                              <Edit2 size={16} />
                            </button>
                            {campaign.status === 'active' && (
                              <button
                                onClick={() => {
                                  setSelectedBlastCampaign(campaign);
                                  setBlastForm({
                                    subject: campaign.name + ' — Kvastram',
                                    headline: campaign.name,
                                    body_text: campaign.description || '',
                                    cta_text: 'Shop Now',
                                    cta_url: '/',
                                  });
                                  setBlastMsg(null);
                                  setShowBlastModal(true);
                                }}
                                className="text-purple-500 hover:text-purple-700 p-1"
                                title="Send Email Blast"
                              >
                                <Mail size={16} />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleDeleteCampaign(campaign.id, campaign.name)
                              }
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete Campaign"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'discounts' && (
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Discount Codes
                </h2>
                <button
                  onClick={() => setShowDiscountModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <Plus size={18} />
                  Create Discount
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Uses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {discounts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No discount codes found.
                        </td>
                      </tr>
                    ) : (
                      discounts.map((discount) => (
                        <tr key={discount.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {discount.code}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                            {(discount.type || 'unknown').replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {discount.type === 'percentage'
                              ? `${discount.value}%`
                              : `$${discount.value}`}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {discount.usage_count} /{' '}
                            {discount.usage_limit || '∞'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {discount.ends_at
                              ? new Date(discount.ends_at).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                discount.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {discount.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingDiscount(discount);
                                  setShowEditDiscountModal(true);
                                }}
                                className="text-blue-500 hover:text-blue-700 p-1"
                                title="Edit Discount"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteDiscount(
                                    discount.id,
                                    discount.code
                                  )
                                }
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Delete Discount"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Campaign Modal */}
      {showEditCampaignModal && editingCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Edit Campaign
            </h2>
            <form onSubmit={handleUpdateCampaign} className="space-y-4">
              <div>
                <label
                  htmlFor="field-1"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Campaign Name
                </label>
                <input
                  id="field-1"
                  type="text"
                  required
                  value={editingCampaign.name || ''}
                  className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                  onChange={(e) =>
                    setEditingCampaign({
                      ...editingCampaign,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="field-2"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="field-2"
                  value={editingCampaign.description || ''}
                  className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                  onChange={(e) =>
                    setEditingCampaign({
                      ...editingCampaign,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="field-3"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <select
                  id="field-3"
                  value={editingCampaign.status || 'draft'}
                  className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                  onChange={(e) =>
                    setEditingCampaign({
                      ...editingCampaign,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="field-4"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Type
                </label>
                <select
                  id="field-4"
                  value={editingCampaign.type || 'promotion'}
                  className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                  onChange={(e) =>
                    setEditingCampaign({
                      ...editingCampaign,
                      type: e.target.value,
                    })
                  }
                >
                  <option value="promotion">Promotion</option>
                  <option value="email">Email</option>
                  <option value="social">Social</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCampaignModal(false);
                    setEditingCampaign(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Discount Modal */}
      {showEditDiscountModal && editingDiscount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Edit Discount Code
            </h2>
            <form onSubmit={handleUpdateDiscount} className="space-y-4">
              <div>
                <label
                  htmlFor="field-5"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Code
                </label>
                <input
                  id="field-5"
                  type="text"
                  required
                  value={editingDiscount.code || ''}
                  className="w-full border border-gray-300 rounded p-2 uppercase text-gray-900 bg-white"
                  onChange={(e) =>
                    setEditingDiscount({
                      ...editingDiscount,
                      code: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="field-6"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Type
                </label>
                <select
                  id="field-6"
                  value={editingDiscount.type || 'percentage'}
                  className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                  onChange={(e) =>
                    setEditingDiscount({
                      ...editingDiscount,
                      type: e.target.value,
                    })
                  }
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed Amount</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="field-7"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Value
                </label>
                <input
                  id="field-7"
                  type="number"
                  required
                  value={editingDiscount.value || ''}
                  className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                  onChange={(e) =>
                    setEditingDiscount({
                      ...editingDiscount,
                      value: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="field-8"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <select
                  id="field-8"
                  value={editingDiscount.is_active ? 'true' : 'false'}
                  className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                  onChange={(e) =>
                    setEditingDiscount({
                      ...editingDiscount,
                      is_active: e.target.value === 'true',
                    })
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="field-9"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Usage Limit (Optional)
                </label>
                <input
                  id="field-9"
                  type="number"
                  value={editingDiscount.usage_limit || ''}
                  className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                  onChange={(e) =>
                    setEditingDiscount({
                      ...editingDiscount,
                      usage_limit: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="field-10"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Start Date
                  </label>
                  <input
                    id="field-10"
                    type="datetime-local"
                    value={
                      editingDiscount.starts_at
                        ? new Date(editingDiscount.starts_at)
                            .toISOString()
                            .slice(0, 16)
                        : ''
                    }
                    className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                    onChange={(e) =>
                      setEditingDiscount({
                        ...editingDiscount,
                        starts_at: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="field-11"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    End Date
                  </label>
                  <input
                    id="field-11"
                    type="datetime-local"
                    value={
                      editingDiscount.ends_at
                        ? new Date(editingDiscount.ends_at)
                            .toISOString()
                            .slice(0, 16)
                        : ''
                    }
                    className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                    onChange={(e) =>
                      setEditingDiscount({
                        ...editingDiscount,
                        ends_at: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditDiscountModal(false);
                    setEditingDiscount(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Creation Modals */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Create Campaign
            </h2>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label
                  htmlFor="field-12"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Campaign Name
                </label>
                <input
                  id="field-12"
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="field-13"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="field-13"
                  className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Create Discount Code
            </h2>
            <form onSubmit={handleCreateDiscount} className="space-y-4">
              <div>
                <label
                  htmlFor="field-14"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Code
                </label>
                <input
                  id="field-14"
                  type="text"
                  required
                  placeholder="SUMMER2026"
                  className="w-full border border-gray-300 rounded p-2 uppercase text-gray-900 bg-white placeholder-gray-400"
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="field-15"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Campaign (Optional)
                </label>
                <select
                  id="field-15"
                  className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                  onChange={(e) =>
                    setFormData({ ...formData, campaign_id: e.target.value })
                  }
                >
                  <option value="">None</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="field-16"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Type
                </label>
                <select
                  id="field-16"
                  className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  defaultValue="percentage"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed Amount</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="field-17"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Value
                </label>
                <input
                  id="field-17"
                  type="number"
                  required
                  className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="field-18"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Usage Limit (Optional)
                </label>
                <input
                  id="field-18"
                  type="number"
                  className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                  onChange={(e) =>
                    setFormData({ ...formData, usage_limit: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="field-19"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Start Date
                  </label>
                  <input
                    id="field-19"
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                    onChange={(e) =>
                      setFormData({ ...formData, starts_at: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="field-20"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    End Date
                  </label>
                  <input
                    id="field-20"
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white"
                    onChange={(e) =>
                      setFormData({ ...formData, ends_at: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Blast Modal */}
      {showBlastModal && selectedBlastCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Send Email Blast
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Campaign: <strong>{selectedBlastCampaign.name}</strong> — will
              send to all active newsletter subscribers
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={blastForm.subject}
                  onChange={(e) =>
                    setBlastForm({ ...blastForm, subject: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Subject line..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  value={blastForm.headline}
                  onChange={(e) =>
                    setBlastForm({ ...blastForm, headline: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Main heading in email..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Body Text
                </label>
                <textarea
                  value={blastForm.body_text}
                  onChange={(e) =>
                    setBlastForm({ ...blastForm, body_text: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Email body message..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={blastForm.cta_text}
                    onChange={(e) =>
                      setBlastForm({ ...blastForm, cta_text: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Shop Now"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    CTA URL
                  </label>
                  <input
                    type="text"
                    value={blastForm.cta_url}
                    onChange={(e) =>
                      setBlastForm({ ...blastForm, cta_url: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="/collections"
                  />
                </div>
              </div>
            </div>
            {blastMsg && (
              <div
                className={`mt-4 p-3 rounded-lg text-sm ${blastMsg.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
              >
                {blastMsg}
              </div>
            )}
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowBlastModal(false);
                  setBlastMsg(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBlast}
                disabled={blastLoading}
                className="px-5 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Mail size={14} />
                {blastLoading ? 'Sending...' : 'Send Blast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
