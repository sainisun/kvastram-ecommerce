'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings as SettingsIcon,
  Store,
  Globe,
  Bell,
  Lock,
  Mail,
  CreditCard,
  Truck,
  Save,
  Shield,
  CheckCircle,
  X,
  Home,
  MessageCircle,
} from 'lucide-react';
import { api } from '@/lib/api';

import { useNotification } from '@/context/notification-context';

// Default values for navigation and quick links
const DEFAULT_NAV_LINKS =
  '[{"label":"Home","url":"/","order":1},{"label":"New Arrivals","url":"/products?sort=newest","order":2},{"label":"Shop","url":"/products","order":3},{"label":"Collections","url":"/collections","order":4},{"label":"Sale","url":"/sale","order":5,"highlight":true},{"label":"About","url":"/about","order":6},{"label":"Contact","url":"/contact","order":7}]';

const DEFAULT_QUICK_LINKS =
  '[{"label":"Bestsellers","url":"/products?tag=bestseller","order":1},{"label":"New Arrivals","url":"/products?tag=new","order":2},{"label":"Collections","url":"/collections","order":3},{"label":"Sale","url":"/sale","order":4,"highlight":true}]';

export default function SettingsPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({});
  const [user, setUser] = useState<any>(null);

  // Stripe Modal State
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeKeys, setStripeKeys] = useState({ publishable: '', secret: '' });

  // 2FA Modal State
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [otp, setOtp] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);

  // WhatsApp Settings State
  const [whatsappSettings, setWhatsappSettings] = useState({
    phone_number_id: '',
    access_token: '',
    business_account_id: '',
    admin_phone: '',
    notify_on_order: true,
    notify_on_new_customer: false,
    is_active: false,
  });
  const [testingWhatsapp, setTestingWhatsapp] = useState(false);

  useEffect(() => {
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsData, profileData] = await Promise.all([
        api.getSettings(),
        api.getMe().catch(() => null),
      ]);

      // Flatten settings - handle both array and object formats
      const flatSettings: any = {};
      if (settingsData && settingsData.settings) {
        // Backend returns array: [{ key, value, category }, ...]
        if (Array.isArray(settingsData.settings)) {
          settingsData.settings.forEach((setting: any) => {
            flatSettings[setting.key] = setting.value;
          });
        }
        // Backend returns object: { category: { key: value } }
        else if (typeof settingsData.settings === 'object') {
          Object.values(settingsData.settings).forEach((category: any) => {
            if (category && typeof category === 'object') {
              Object.entries(category).forEach(([key, value]) => {
                flatSettings[key] = value;
              });
            }
          });
        }
      }
      setSettings(flatSettings);

      // Set User Profile
      if (profileData && profileData?.user) {
        setUser(profileData.user);
      }

      // Pre-fill stripe
      if (flatSettings.stripe_publishable_key) {
        setStripeKeys({
          publishable: flatSettings.stripe_publishable_key,
          secret: flatSettings.stripe_secret_key || '',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateSettingsBulk(settings);
      showNotification('success', 'Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStripe = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      await api.updateSetting(
        'stripe_publishable_key',
        stripeKeys.publishable,
        'payment'
      );
      await api.updateSetting(
        'stripe_secret_key',
        stripeKeys.secret,
        'payment'
      );

      setSettings((prev: any) => ({
        ...prev,
        stripe_publishable_key: stripeKeys.publishable,
        stripe_secret_key: stripeKeys.secret,
      }));

      setShowStripeModal(false);
      showNotification('success', 'Stripe configuration saved!');
    } catch (error) {
      console.error('Error saving Stripe settings:', error);
      showNotification('error', 'Failed to save Stripe settings');
    } finally {
      setSaving(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      setLoading(true); // temporary spinner
      const res = await api.generate2FA();
      setQrCode(res.qrCode);
      setShowTwoFactorModal(true);
    } catch (error) {
      console.error('Error generating 2FA:', error);
      showNotification('error', 'Failed to generate 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      setVerifying2FA(true);
      await api.verify2FA(otp);

      // Refresh User
      const profile = await api.getMe();
      setUser(profile?.user);

      setShowTwoFactorModal(false);
      setOtp('');
      showNotification('success', 'Two-Factor Authentication Enabled!');
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      showNotification('error', 'Invalid OTP. Please try again.');
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleDisable2FA = () => {
    setOtp('');
    setShowDisable2FAModal(true);
  };

  const handleConfirmDisable2FA = async () => {
    if (otp.length !== 6) return;

    try {
      setDisabling2FA(true);
      await api.disable2FA(otp);
      const profile = await api.getMe();
      setUser(profile?.user);
      setShowDisable2FAModal(false);
      setOtp('');
      showNotification('success', 'Two-Factor Authentication Disabled');
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      showNotification('error', 'Invalid OTP. Please try again.');
    } finally {
      setDisabling2FA(false);
    }
  };

  const fetchWhatsAppSettings = async () => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_BASE_URL}/admin/whatsapp/settings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setWhatsappSettings({
          phone_number_id: data.phone_number_id || '',
          access_token: '',
          business_account_id: data.business_account_id || '',
          admin_phone: data.admin_phone || '',
          notify_on_order: data.notify_on_order ?? true,
          notify_on_new_customer: data.notify_on_new_customer ?? false,
          is_active: data.is_active ?? false,
        });
      }
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error);
    }
  };

  const handleSaveWhatsApp = async () => {
    try {
      setSaving(true);
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_BASE_URL}/admin/whatsapp/settings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(whatsappSettings),
      });

      if (res.ok) {
        showNotification('success', 'WhatsApp settings saved!');
      } else {
        const data = await res.json();
        showNotification(
          'error',
          data.error || 'Failed to save WhatsApp settings'
        );
      }
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      showNotification('error', 'Failed to save WhatsApp settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    try {
      setTestingWhatsapp(true);
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_BASE_URL}/admin/whatsapp/test`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        showNotification('success', 'Test message sent to WhatsApp!');
      } else {
        showNotification('error', data.error || 'Failed to send test message');
      }
    } catch (error) {
      console.error('Error testing WhatsApp:', error);
      showNotification('error', 'Failed to test WhatsApp');
    } finally {
      setTestingWhatsapp(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'whatsapp') {
      fetchWhatsAppSettings();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'homepage', label: 'Homepage', icon: Home },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'shipping', label: 'Shipping', icon: Truck },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your store settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
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

        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">
                  General Settings
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={settings.store_name || ''}
                    onChange={(e) => handleChange('store_name', e.target.value)}
                    placeholder="Kvastram Store"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Description
                  </label>
                  <textarea
                    rows={4}
                    value={settings.store_description || ''}
                    onChange={(e) =>
                      handleChange('store_description', e.target.value)
                    }
                    placeholder="Your premium e-commerce store"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={settings.contact_email || ''}
                    onChange={(e) =>
                      handleChange('contact_email', e.target.value)
                    }
                    placeholder="admin@kvastram.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={settings.phone_number || ''}
                    onChange={(e) =>
                      handleChange('phone_number', e.target.value)
                    }
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {activeTab === 'homepage' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Homepage Settings
                </h2>

                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Announcement Bar
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Enable Announcement Bar
                        </p>
                        <p className="text-sm text-gray-500">
                          Show a banner at the top of the homepage
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.announcement_bar_enabled ?? false}
                        onChange={(e) =>
                          handleChange(
                            'announcement_bar_enabled',
                            e.target.checked
                          )
                        }
                        className="w-5 h-5 text-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Announcement Text
                      </label>
                      <input
                        type="text"
                        value={settings.announcement_bar_text || ''}
                        onChange={(e) =>
                          handleChange('announcement_bar_text', e.target.value)
                        }
                        placeholder="Complimentary Worldwide Shipping on Orders Over $250"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Hero Section
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hero Title
                      </label>
                      <input
                        type="text"
                        value={settings.hero_title || ''}
                        onChange={(e) =>
                          handleChange('hero_title', e.target.value)
                        }
                        placeholder="Where Tradition Meets Modern"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hero Subtitle
                      </label>
                      <textarea
                        rows={3}
                        value={settings.hero_subtitle || ''}
                        onChange={(e) =>
                          handleChange('hero_subtitle', e.target.value)
                        }
                        placeholder="Discover handcrafted elegance from master artisans..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CTA Button Text
                        </label>
                        <input
                          type="text"
                          value={settings.hero_cta_text || ''}
                          onChange={(e) =>
                            handleChange('hero_cta_text', e.target.value)
                          }
                          placeholder="Shop New Arrivals"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hero Image URL
                      </label>
                      <input
                        type="text"
                        value={settings.hero_image || ''}
                        onChange={(e) =>
                          handleChange('hero_image', e.target.value)
                        }
                        placeholder="https://example.com/hero-image.jpg"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Full URL to hero section background image
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CTA Button Text
                        </label>
                        <input
                          type="text"
                          value={settings.hero_cta_text || ''}
                          onChange={(e) =>
                            handleChange('hero_cta_text', e.target.value)
                          }
                          placeholder="Shop New Arrivals"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CTA Link
                        </label>
                        <input
                          type="text"
                          value={settings.hero_cta_link || ''}
                          onChange={(e) =>
                            handleChange('hero_cta_link', e.target.value)
                          }
                          placeholder="/products"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Category & Collection Images
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Upload images for categories and collections in their
                    respective pages.
                  </p>
                  <div className="flex gap-4">
                    <a
                      href="/dashboard/categories"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Manage Categories
                    </a>
                    <a
                      href="/dashboard/collections"
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Manage Collections
                    </a>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Newsletter Section
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Newsletter Title
                      </label>
                      <input
                        type="text"
                        value={settings.newsletter_title || ''}
                        onChange={(e) =>
                          handleChange('newsletter_title', e.target.value)
                        }
                        placeholder="Unlock 10% Off"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Newsletter Subtitle
                      </label>
                      <textarea
                        rows={3}
                        value={settings.newsletter_subtitle || ''}
                        onChange={(e) =>
                          handleChange('newsletter_subtitle', e.target.value)
                        }
                        placeholder="Be the first to know about new collections..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Brand Story Section
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={settings.brand_story_title || ''}
                        onChange={(e) =>
                          handleChange('brand_story_title', e.target.value)
                        }
                        placeholder="Crafted with Soul & Purpose"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content
                      </label>
                      <textarea
                        rows={4}
                        value={settings.brand_story_content || ''}
                        onChange={(e) =>
                          handleChange('brand_story_content', e.target.value)
                        }
                        placeholder="Every Kvastram piece begins its journey..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image URL
                      </label>
                      <input
                        type="text"
                        value={settings.brand_story_image || ''}
                        onChange={(e) =>
                          handleChange('brand_story_image', e.target.value)
                        }
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Featured Products
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Enter product IDs (comma-separated) to feature on the
                    homepage. Leave empty to show newest products.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Featured Product IDs
                      </label>
                      <textarea
                        rows={3}
                        value={settings.featured_product_ids || ''}
                        onChange={(e) =>
                          handleChange('featured_product_ids', e.target.value)
                        }
                        placeholder="prod_123, prod_456, prod_789"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter product IDs separated by commas. First 8 will be
                        displayed.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <a
                        href="/dashboard/products"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Browse Products
                      </a>
                    </div>
                  </div>
                </div>

                {/* Navigation Links Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Navigation Links
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Configure the navigation menu links shown in the header.
                  </p>
                  {/* Force rebuild */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nav Links (JSON)
                        <span className="ml-2 text-xs text-gray-400 font-normal">
                          {'Array of (label, url, order, highlight)'}
                        </span>
                      </label>
                      <textarea
                        rows={8}
                        value={settings.nav_links || '[]'}
                        onChange={(e) => {
                          try {
                            JSON.parse(e.target.value);
                            handleChange('nav_links', e.target.value);
                          } catch {
                            // Invalid JSON - don't save
                          }
                        }}
                        placeholder='[{"label":"Home","url":"/","order":1}]'
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Valid JSON required. See placeholder for format example.
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          handleChange('nav_links', DEFAULT_NAV_LINKS)
                        }
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Reset to Default
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Links (JSON)
                        <span className="ml-2 text-xs text-gray-400 font-normal">
                          {'Array of {label, url, order, highlight}'}
                        </span>
                      </label>
                      <textarea
                        rows={6}
                        value={settings.quick_links || '[]'}
                        onChange={(e) => {
                          try {
                            JSON.parse(e.target.value);
                            handleChange('quick_links', e.target.value);
                          } catch {
                            // Invalid JSON - don't save
                          }
                        }}
                        placeholder='[{"label":"Bestsellers","url":"/products?tag=bestseller","order":1}]'
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Valid JSON required. Use "highlight":true for
                        Sale/featured links.
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          handleChange('quick_links', DEFAULT_QUICK_LINKS)
                        }
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Reset to Default
                      </button>
                    </div>
                  </div>
                </div>

                {/* Store Info Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Store Information
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Contact information shown in the footer.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Logo URL
                      </label>
                      <input
                        type="text"
                        value={settings.store_logo_url || ''}
                        onChange={(e) =>
                          handleChange('store_logo_url', e.target.value)
                        }
                        placeholder="https://example.com/logo.png"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Address
                      </label>
                      <textarea
                        rows={2}
                        value={settings.store_address || ''}
                        onChange={(e) =>
                          handleChange('store_address', e.target.value)
                        }
                        placeholder="123 Fashion Avenue, New York, NY 10001"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={settings.store_phone || ''}
                          onChange={(e) =>
                            handleChange('store_phone', e.target.value)
                          }
                          placeholder="+1 (555) 123-4567"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={settings.store_email || ''}
                          onChange={(e) =>
                            handleChange('store_email', e.target.value)
                          }
                          placeholder="support@kvastram.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Notification Settings
                </h2>
                {/* Use settings state but simplified for brevity in this replace */}
                <div className="space-y-4">
                  {/* Keeping previous structure simplified */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Order Notifications
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notify_orders ?? true}
                      onChange={(e) =>
                        handleChange('notify_orders', e.target.checked)
                      }
                      className="w-5 h-5 text-blue-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Low Stock Alerts
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notify_low_stock ?? true}
                      onChange={(e) =>
                        handleChange('notify_low_stock', e.target.checked)
                      }
                      className="w-5 h-5 text-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'whatsapp' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      WhatsApp Notifications
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Receive order notifications on your WhatsApp
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleTestWhatsApp}
                      disabled={testingWhatsapp || !whatsappSettings.is_active}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {testingWhatsapp ? 'Sending...' : 'Test'}
                    </button>
                    <button
                      onClick={handleSaveWhatsApp}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                    >
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">
                    WhatsApp Business API
                  </h3>
                  <p className="text-sm text-green-700">
                    To enable WhatsApp notifications, you need a WhatsApp
                    Business Account and Meta Developer App. Get your
                    credentials from{' '}
                    <a
                      href="https://developers.facebook.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      developers.facebook.com
                    </a>
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Enable WhatsApp Notifications
                      </p>
                      <p className="text-sm text-gray-500">
                        Send notifications to your phone
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={whatsappSettings.is_active}
                      onChange={(e) =>
                        setWhatsappSettings((prev) => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                      className="w-5 h-5 text-green-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number ID
                    </label>
                    <input
                      type="text"
                      value={whatsappSettings.phone_number_id}
                      onChange={(e) =>
                        setWhatsappSettings((prev) => ({
                          ...prev,
                          phone_number_id: e.target.value,
                        }))
                      }
                      placeholder="123456789012345"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Access Token
                    </label>
                    <input
                      type="password"
                      value={whatsappSettings.access_token}
                      onChange={(e) =>
                        setWhatsappSettings((prev) => ({
                          ...prev,
                          access_token: e.target.value,
                        }))
                      }
                      placeholder={
                        whatsappSettings.access_token
                          ? '••••••••••••'
                          : 'Enter access token'
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to keep existing token
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Account ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={whatsappSettings.business_account_id}
                      onChange={(e) =>
                        setWhatsappSettings((prev) => ({
                          ...prev,
                          business_account_id: e.target.value,
                        }))
                      }
                      placeholder="123456789012345"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Phone Number
                    </label>
                    <input
                      type="text"
                      value={whatsappSettings.admin_phone}
                      onChange={(e) =>
                        setWhatsappSettings((prev) => ({
                          ...prev,
                          admin_phone: e.target.value,
                        }))
                      }
                      placeholder="+1234567890"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your WhatsApp number to receive notifications (with
                      country code)
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="font-medium text-gray-900 mb-4">
                      Notification Types
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            New Orders
                          </p>
                          <p className="text-sm text-gray-500">
                            Get notified when a new order is placed
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={whatsappSettings.notify_on_order}
                          onChange={(e) =>
                            setWhatsappSettings((prev) => ({
                              ...prev,
                              notify_on_order: e.target.checked,
                            }))
                          }
                          className="w-5 h-5 text-green-600"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            New Customers
                          </p>
                          <p className="text-sm text-gray-500">
                            Get notified when a new customer registers
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={whatsappSettings.notify_on_new_customer}
                          onChange={(e) =>
                            setWhatsappSettings((prev) => ({
                              ...prev,
                              notify_on_new_customer: e.target.checked,
                            }))
                          }
                          className="w-5 h-5 text-green-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Security Settings
                </h2>
                <p className="text-gray-600">
                  Password management is handled via profile settings.
                </p>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          Two-Factor Authentication
                        </p>
                        {user?.two_factor_enabled && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle size={10} /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {user?.two_factor_enabled
                          ? 'Account is secured with 2FA'
                          : 'Add an extra layer of security'}
                      </p>
                    </div>
                    {user?.two_factor_enabled ? (
                      <button
                        onClick={handleDisable2FA}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        onClick={handleEnable2FA}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                      >
                        Enable 2FA
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Payment Settings
                </h2>

                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">Stripe</p>
                          {settings.stripe_publishable_key && (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle size={10} /> Configured
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Accept credit cards and digital wallets
                        </p>
                      </div>
                      <button
                        onClick={() => setShowStripeModal(true)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Email Settings (SMTP)
                </h2>
                <p className="text-gray-600">
                  Configure your email provider for sending order confirmations
                  and notifications.
                </p>

                <div className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        From Name
                      </label>
                      <input
                        type="text"
                        value={settings.from_name || ''}
                        onChange={(e) =>
                          handleChange('from_name', e.target.value)
                        }
                        placeholder="Kvastram Support"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        From Email
                      </label>
                      <input
                        type="email"
                        value={settings.from_email || ''}
                        onChange={(e) =>
                          handleChange('from_email', e.target.value)
                        }
                        placeholder="support@kvastram.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      SMTP Configuration
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Host
                        </label>
                        <input
                          type="text"
                          value={settings.smtp_host || ''}
                          onChange={(e) =>
                            handleChange('smtp_host', e.target.value)
                          }
                          placeholder="smtp.example.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Port
                        </label>
                        <input
                          type="number"
                          value={settings.smtp_port || ''}
                          onChange={(e) =>
                            handleChange('smtp_port', e.target.value)
                          }
                          placeholder="587"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP User
                        </label>
                        <input
                          type="text"
                          value={settings.smtp_user || ''}
                          onChange={(e) =>
                            handleChange('smtp_user', e.target.value)
                          }
                          placeholder="apikey"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Password
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={settings.smtp_pass || ''}
                            onChange={(e) =>
                              handleChange('smtp_pass', e.target.value)
                            }
                            placeholder="••••••••••••"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                          />
                          <Lock
                            size={16}
                            className="absolute right-3 top-3 text-gray-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Shipping Settings
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Shipping Rate
                  </label>
                  <input
                    type="number"
                    value={settings.shipping_rate || 10.0}
                    onChange={(e) =>
                      handleChange('shipping_rate', parseFloat(e.target.value))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Shipping Threshold
                  </label>
                  <input
                    type="number"
                    value={settings.free_shipping_threshold || 100.0}
                    onChange={(e) =>
                      handleChange(
                        'free_shipping_threshold',
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save size={20} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Config Modal */}
      {showStripeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard size={24} className="text-blue-600" />
                Configure Stripe
              </h2>
              <button
                onClick={() => setShowStripeModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveStripe} className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 border border-blue-200">
                Enter your Stripe API keys. These are stored safely and used for
                payment processing.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Publishable Key
                </label>
                <input
                  type="text"
                  required
                  placeholder="pk_test_..."
                  className="w-full border border-gray-300 rounded p-2 text-gray-900"
                  value={stripeKeys.publishable}
                  onChange={(e) =>
                    setStripeKeys({
                      ...stripeKeys,
                      publishable: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secret Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="sk_test_..."
                    className="w-full border border-gray-300 rounded p-2 text-gray-900 pr-10"
                    value={stripeKeys.secret}
                    onChange={(e) =>
                      setStripeKeys({ ...stripeKeys, secret: e.target.value })
                    }
                  />
                  <Lock
                    size={14}
                    className="absolute right-3 top-3 text-gray-400"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowStripeModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Modal - Enable */}
      {showTwoFactorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Shield size={24} className="text-blue-600" />
                Enable 2FA
              </h2>
              <button
                onClick={() => setShowTwoFactorModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 text-center">
              <p className="text-sm text-gray-600">
                Scan this QR code with your authenticator app (Google
                Authenticator, Authy, etc.), then enter the code below.
              </p>

              {qrCode && (
                <div className="flex justify-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                  Authentication Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000 000"
                  className="w-full text-center text-2xl tracking-widest border border-gray-300 rounded-lg p-3 font-mono"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/[^0-9]/g, ''))
                  }
                />
              </div>

              <button
                onClick={handleVerify2FA}
                disabled={otp.length !== 6 || verifying2FA}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {verifying2FA ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Modal - Disable */}
      {showDisable2FAModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Shield size={24} className="text-red-600" />
                Disable 2FA
              </h2>
              <button
                onClick={() => setShowDisable2FAModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> Disabling 2FA will remove the extra
                  layer of security from your account. You will only need your
                  password to log in.
                </p>
              </div>

              <p className="text-sm text-gray-600">
                To confirm, please enter the current 6-digit code from your
                authenticator app:
              </p>

                    <div>
                      {/* Nav Links JSON format hint */}
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authentication Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000 000"
                  className="w-full text-center text-2xl tracking-widest border border-gray-300 rounded-lg p-3 font-mono"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/[^0-9]/g, ''))
                  }
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisable2FAModal(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDisable2FA}
                  disabled={otp.length !== 6 || disabling2FA}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {disabling2FA ? 'Disabling...' : 'Disable 2FA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
