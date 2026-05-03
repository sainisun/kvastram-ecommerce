'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Package,
  TrendingUp,
  DollarSign,
  Globe,
  CheckCircle,
  Mail,
  Phone,
  FileText,
  ArrowRight,
} from 'lucide-react';

interface TierData {
  id: string;
  name: string;
  slug: string;
  discount_percent: number;
  default_moq: number;
  payment_terms: string;
  description: string | null;
}

export default function WholesalePage() {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    country: '',
    business_type: '',
    estimated_order_volume: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tiers, setTiers] = useState<TierData[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);

  // Fetch tiers from API on mount
  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const data = await api.getWholesaleTiers();
        if (data.tiers && data.tiers.length > 0) {
          setTiers(data.tiers);
        } else {
          // Fallback to default tiers if API returns empty
          setTiers([
            { id: '1', name: 'Starter', slug: 'starter', discount_percent: 20, default_moq: 50, payment_terms: 'net_30', description: 'Perfect for boutiques' },
            { id: '2', name: 'Growth', slug: 'growth', discount_percent: 30, default_moq: 200, payment_terms: 'net_45', description: 'For established retailers' },
            { id: '3', name: 'Enterprise', slug: 'enterprise', discount_percent: 40, default_moq: 500, payment_terms: 'net_60', description: 'For distributors & chains' },
          ]);
        }
      } catch (err) {
        console.error('Error fetching tiers:', err);
        // Fallback to default tiers
        setTiers([
          { id: '1', name: 'Starter', slug: 'starter', discount_percent: 20, default_moq: 50, payment_terms: 'net_30', description: 'Perfect for boutiques' },
          { id: '2', name: 'Growth', slug: 'growth', discount_percent: 30, default_moq: 200, payment_terms: 'net_45', description: 'For established retailers' },
          { id: '3', name: 'Enterprise', slug: 'enterprise', discount_percent: 40, default_moq: 500, payment_terms: 'net_60', description: 'For distributors & chains' },
        ]);
      } finally {
        setTiersLoading(false);
      }
    };

    fetchTiers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sanitize data: convert empty strings to undefined for optional fields
      const payload = {
        ...formData,
        estimated_order_volume: formData.estimated_order_volume || undefined,
        message: formData.message || undefined,
      };

      const response = await fetch(`/api/wholesale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit inquiry');
      }

      const _data = await response.json();

      setSubmitted(true);
      setFormData({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        country: '',
        business_type: '',
        estimated_order_volume: '',
        message: '',
      });
    } catch {
      console.error('Error submitting inquiry');
      setError('Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 py-16 pt-32 text-white md:py-20 lg:py-32">
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
          <div className="relative z-10 mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
            <div className="max-w-3xl">
              <span className="text-amber-400 text-body-xs type-bold uppercase tracking-token-wider block mb-4">
                B2B Partnership
              </span>
              <h1 className="text-display-xl md:text-display-xl font-serif mb-6 leading-token-tight">
                Wholesale & <br />
                Bulk Orders
              </h1>
              <p className="text-display-sm text-stone-300 type-light leading-token-relaxed mb-8">
                Partner with Kvastram to bring authentic artisanal luxury to
                your customers. Exclusive pricing, dedicated support, and global
                logistics for retailers and distributors worldwide.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#inquiry"
                  className="bg-amber-500 text-stone-900 px-8 py-4 type-bold uppercase tracking-token-wider text-body-xs hover:bg-amber-400 transition-colors"
                >
                  Request Pricing
                </a>
                <a
                  href="#benefits"
                  className="border-2 border-white text-white px-8 py-4 type-bold uppercase tracking-token-wider text-body-xs hover:bg-white hover:text-stone-900 transition-colors"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="bg-stone-50 py-12 md:py-16 lg:py-24">
          <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
            <div className="text-center mb-16">
              <h2 className="text-display-lg font-serif text-stone-900 mb-4">
                Why Partner With Kvastram?
              </h2>
              <p className="text-stone-600 type-light max-w-2xl mx-auto">
                We provide everything you need to offer premium artisanal
                products to your market.
              </p>
            </div>

            <div className="grid gap-x-4 gap-y-8 md:grid-cols-2 md:gap-x-6 md:gap-y-12 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
              <div className="bg-white p-8 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="text-amber-600" size={28} />
                </div>
                <h3 className="text-body-xl type-bold text-stone-900 mb-3">
                  Competitive Pricing
                </h3>
                <p className="text-body-sm text-stone-600 type-light leading-token-relaxed">
                  Volume-based discounts starting at 20% off retail. Tiered
                  pricing for larger orders.
                </p>
              </div>

              <div className="bg-white p-8 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="text-amber-600" size={28} />
                </div>
                <h3 className="text-body-xl type-bold text-stone-900 mb-3">
                  Flexible MOQ
                </h3>
                <p className="text-body-sm text-stone-600 type-light leading-token-relaxed">
                  Minimum order quantities starting from just 50 units. Mix and
                  match across collections.
                </p>
              </div>

              <div className="bg-white p-8 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="text-amber-600" size={28} />
                </div>
                <h3 className="text-body-xl type-bold text-stone-900 mb-3">
                  Global Shipping
                </h3>
                <p className="text-body-sm text-stone-600 type-light leading-token-relaxed">
                  DDP shipping to 150+ countries. Consolidated shipments and
                  customs support included.
                </p>
              </div>

              <div className="bg-white p-8 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="text-amber-600" size={28} />
                </div>
                <h3 className="text-body-xl type-bold text-stone-900 mb-3">
                  Marketing Support
                </h3>
                <p className="text-body-sm text-stone-600 type-light leading-token-relaxed">
                  High-res product images, brand assets, and storytelling
                  content for your channels.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="bg-white py-12 md:py-16 lg:py-24">
          <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
            <div className="text-center mb-16">
              <h2 className="text-display-lg font-serif text-stone-900 mb-4">
                Wholesale Pricing Tiers
              </h2>
              <p className="text-stone-600 type-light">
                Volume-based discounts to maximize your margins
              </p>
            </div>

            {tiersLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
              </div>
            ) : (
              <div className={`grid gap-8 ${tiers.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-' + tiers.length}`}>
                {tiers.map((tier, index) => (
                  <div
                    key={tier.id}
                    className={`border p-8 ${index === 1 ? 'border-2 border-amber-500 p-8 relative bg-amber-50' : 'border-stone-200'}`}
                  >
                    {index === 1 && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-body-xs type-bold px-4 py-1 uppercase tracking-token-wider">
                        Most Popular
                      </div>
                    )}
                    <div className="mb-6">
                      <h3 className="text-display-sm type-bold text-stone-900 mb-2">
                        {tier.name}
                      </h3>
                      <p className="text-body-sm text-stone-500 mb-4">
                        {tier.description || 'Wholesale pricing tier'}
                      </p>
                      <div className="text-display-lg type-bold text-stone-900">
                        {tier.discount_percent}% OFF
                      </div>
                      <p className="text-body-xs text-stone-500 mt-1">Retail pricing</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-2 text-body-sm">
                        <CheckCircle
                          size={16}
                          className="text-green-600 mt-0.5 flex-shrink-0"
                        />
                        <span>MOQ: {tier.default_moq} units</span>
                      </li>
                      <li className="flex items-start gap-2 text-body-sm">
                        <CheckCircle
                          size={16}
                          className="text-green-600 mt-0.5 flex-shrink-0"
                        />
                        <span className="capitalize">{tier.payment_terms.replace('_', ' ')} payment terms</span>
                      </li>
                      {index === 1 && (
                        <li className="flex items-start gap-2 text-body-sm">
                          <CheckCircle
                            size={16}
                            className="text-green-600 mt-0.5 flex-shrink-0"
                          />
                          <span>Dedicated account manager</span>
                        </li>
                      )}
                      {index === 2 && (
                        <>
                          <li className="flex items-start gap-2 text-body-sm">
                            <CheckCircle
                              size={16}
                              className="text-green-600 mt-0.5 flex-shrink-0"
                            />
                            <span>White-glove logistics</span>
                          </li>
                          <li className="flex items-start gap-2 text-body-sm">
                            <CheckCircle
                              size={16}
                              className="text-green-600 mt-0.5 flex-shrink-0"
                            />
                            <span>Custom product development</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Process Section */}
        <section className="bg-stone-50 py-12 md:py-16 lg:py-24">
          <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
            <div className="text-center mb-16">
              <h2 className="text-display-lg font-serif text-stone-900 mb-4">
                How It Works
              </h2>
              <p className="text-stone-600 type-light">
                Simple 4-step process to start ordering
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: '01',
                  title: 'Submit Inquiry',
                  desc: 'Fill out the form below with your business details',
                },
                {
                  step: '02',
                  title: 'Review & Quote',
                  desc: 'Our team reviews and sends custom pricing within 24hrs',
                },
                {
                  step: '03',
                  title: 'Sample Order',
                  desc: 'Place a sample order to evaluate quality and fit',
                },
                {
                  step: '04',
                  title: 'Bulk Orders',
                  desc: 'Start ordering with flexible payment and shipping terms',
                },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="text-display-xl type-bold text-amber-200 mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-body-xl type-bold text-stone-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-body-sm text-stone-600 type-light">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Inquiry Form */}
        <section id="inquiry" className="bg-white py-12 md:py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-6 md:px-12 lg:px-20">
            <div className="text-center mb-12">
              <h2 className="text-display-lg font-serif text-stone-900 mb-4">
                Request Wholesale Pricing
              </h2>
              <p className="text-stone-600 type-light">
                Fill out the form and our team will contact you within 24 hours
              </p>
            </div>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 p-12 text-center">
                <CheckCircle
                  size={48}
                  className="text-green-600 mx-auto mb-4"
                />
                <h3 className="text-display-md type-bold text-stone-900 mb-2">
                  Thank You!
                </h3>
                <p className="text-stone-600">
                  We&apos;ve received your inquiry and will respond within 24
                  hours.
                </p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 p-4 mb-6 text-center rounded">
                    <p className="text-red-600 type-medium">{error}</p>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-body-xs type-bold uppercase text-stone-500 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full border-b border-stone-200 py-3 focus:outline-none focus:border-stone-900 transition-colors"
                        value={formData.company_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            company_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-body-xs type-bold uppercase text-stone-500 mb-2">
                        Contact Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full border-b border-stone-200 py-3 focus:outline-none focus:border-stone-900 transition-colors"
                        value={formData.contact_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact_name: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-body-xs type-bold uppercase text-stone-500 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        className="w-full border-b border-stone-200 py-3 focus:outline-none focus:border-stone-900 transition-colors"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-body-xs type-bold uppercase text-stone-500 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        className="w-full border-b border-stone-200 py-3 focus:outline-none focus:border-stone-900 transition-colors"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-body-xs type-bold uppercase text-stone-500 mb-2">
                        Country *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full border-b border-stone-200 py-3 focus:outline-none focus:border-stone-900 transition-colors"
                        value={formData.country}
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-body-xs type-bold uppercase text-stone-500 mb-2">
                        Business Type *
                      </label>
                      <select
                        required
                        className="w-full border-b border-stone-200 py-3 focus:outline-none focus:border-stone-900 transition-colors bg-transparent"
                        value={formData.business_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            business_type: e.target.value,
                          })
                        }
                      >
                        <option value="">Select...</option>
                        <option value="boutique">
                          Boutique / Retail Store
                        </option>
                        <option value="online">Online Retailer</option>
                        <option value="distributor">Distributor</option>
                        <option value="chain">Retail Chain</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-body-xs type-bold uppercase text-stone-500 mb-2">
                      Estimated Monthly Order Volume
                    </label>
                    <select
                      className="w-full border-b border-stone-200 py-3 focus:outline-none focus:border-stone-900 transition-colors bg-transparent"
                      value={formData.estimated_order_volume}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimated_order_volume: e.target.value,
                        })
                      }
                    >
                      <option value="">Select...</option>
                      <option value="50-100">50-100 units</option>
                      <option value="100-200">100-200 units</option>
                      <option value="200-500">200-500 units</option>
                      <option value="500+">500+ units</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-body-xs type-bold uppercase text-stone-500 mb-2">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      className="w-full border border-stone-200 p-4 focus:outline-none focus:border-stone-900 transition-colors"
                      placeholder="Tell us about your business and what products you're interested in..."
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-stone-900 text-white py-4 type-bold uppercase tracking-token-wider text-body-xs hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit Inquiry'}{' '}
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 bg-stone-900 text-white">
          <div className="mx-auto max-w-[1440px] px-6 md:px-12 lg:px-20">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <Mail size={32} className="mx-auto mb-4 text-amber-400" />
                <h3 className="type-bold mb-2">Email Us</h3>
                <a
                  href="mailto:wholesale@kvastram.com"
                  className="text-stone-400 hover:text-white text-body-sm"
                >
                  wholesale@kvastram.com
                </a>
              </div>
              <div>
                <Phone size={32} className="mx-auto mb-4 text-amber-400" />
                <h3 className="type-bold mb-2">Call Us</h3>
                <a
                  href="tel:+1234567890"
                  className="text-stone-400 hover:text-white text-body-sm"
                >
                  +1 (234) 567-890
                </a>
              </div>
              <div>
                <FileText size={32} className="mx-auto mb-4 text-amber-400" />
                <h3 className="type-bold mb-2">Download Catalog</h3>
                <a href="#" className="text-stone-400 hover:text-white text-body-sm">
                  2024 Wholesale Catalog (PDF)
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

