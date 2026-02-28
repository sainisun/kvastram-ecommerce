'use client';

import { useCart } from '@/context/cart-context';
import { useShop } from '@/context/shop-context';
import { useNotification } from '@/context/notification-context';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';

interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimated_days: string;
  currency_code: string;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, cartTotal, clearCart } = useCart();
  const { currentRegion, settings } = useShop();
  const { showNotification } = useNotification();
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [discount, setDiscount] = useState<{
    code: string;
    amount: number;
  } | null>(null);

  // Get free shipping threshold from settings (default 25000 = $250)
  const freeShippingThreshold = settings?.free_shipping_threshold || 25000;

  // Dynamic shipping state
  const [countryCode, setCountryCode] = useState('');
  const [_shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [selectedShippingOption, setSelectedShippingOption] = useState<string>('');
  const [shippingLoading, setShippingLoading] = useState(false);

  // Fetch shipping options when country changes
  useEffect(() => {
    const fetchShippingOptions = async () => {
      if (!countryCode || !currentRegion?.id || items.length === 0) {
        setShippingOptions([]);
        setSelectedShipping(null);
        setSelectedShippingOption('');
        return;
      }

      setShippingLoading(true);
      try {
        const data = await api.getShippingOptions(countryCode, currentRegion.id);
        if (data.options && data.options.length > 0) {
          setShippingOptions(data.options);
          // Auto-select first option
          setSelectedShipping(data.options[0]);
          setSelectedShippingOption(data.options[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch shipping options:', error);
        setShippingOptions([]);
        setSelectedShipping(null);
        setSelectedShippingOption('');
      } finally {
        setShippingLoading(false);
      }
    };

    const timer = setTimeout(fetchShippingOptions, 300);
    return () => clearTimeout(timer);
  }, [countryCode, items.length, currentRegion?.id]);

  // Handle shipping option selection
  const handleShippingOptionChange = (optionId: string) => {
    setSelectedShippingOption(optionId);
    const option = _shippingOptions.find(o => o.id === optionId);
    setSelectedShipping(option || null);
  };

  const formatCartPrice = (amount: number) => {
    const currency = currentRegion?.currency_code?.toUpperCase() || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);

    try {
      const res = await api.validateCoupon(promoCode, cartTotal);
      setDiscount({ code: res.code, amount: res.discount_amount });
      showNotification('success', `Coupon ${res.code} applied!`);
    } catch (_error) {
      showNotification('error', 'Invalid promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setDiscount(null);
    setPromoCode('');
  };

  const subtotal = cartTotal;
  const discountAmount = discount ? discount.amount : 0;
  
  // Calculate dynamic shipping cost - null represents "no shipping option selected"
  let shippingCost: number | null = null;
  if (selectedShipping && subtotal < freeShippingThreshold) {
    shippingCost = selectedShipping.price;
  } else if (subtotal >= freeShippingThreshold && selectedShipping) {
    shippingCost = 0; // Free shipping when above threshold
  } else if (!selectedShipping && subtotal >= freeShippingThreshold) {
    shippingCost = 0; // No option but qualifies for free shipping
  }
  
  // Use 0 for math when shippingCost is null, but track presence for display
  const shippingCostForMath = shippingCost ?? 0;
  const total = Math.max(0, subtotal - discountAmount + shippingCostForMath);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-stone-300" />
            <h2 className="mt-4 text-2xl font-serif text-stone-900">
              Your cart is empty
            </h2>
            <p className="mt-2 text-stone-500">
              Looks like you haven&apos;t added anything to your cart yet.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-block bg-stone-900 text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif text-stone-900">Shopping Cart</h1>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear your cart?')) {
                clearCart();
                showNotification('success', 'Cart cleared');
              }
            }}
            className="text-sm text-stone-500 hover:text-stone-700 underline"
          >
            Clear Cart
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          {/* Cart Items */}
          <div className="lg:col-span-7">
            <ul className="divide-y divide-stone-200 border-t border-b border-stone-200">
              {items.map((item) => (
                <li key={item.variantId} className="flex py-6 sm:py-10">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="relative h-24 w-24 sm:h-32 sm:w-32 bg-stone-100 overflow-hidden">
                      {item.thumbnail ? (
                        <OptimizedImage
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          className="object-cover object-center"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-stone-400">
                          <ShoppingBag size={32} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                    <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                      <div>
                        <div className="flex justify-between">
                          <h3 className="text-sm font-medium text-stone-900">
                            {item.handle ? (
                              <Link
                                href={`/products/${item.handle}`}
                                className="hover:underline"
                              >
                                {item.title}
                              </Link>
                            ) : (
                              <span>{item.title}</span>
                            )}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-stone-500">
                          {formatCartPrice(item.price)}
                        </p>
                        {(item.material || item.origin || item.sku) && (
                          <div className="mt-2 space-y-1 text-xs text-stone-400">
                            {item.material && <p>Material: {item.material}</p>}
                            {item.origin && <p>Origin: {item.origin}</p>}
                            {item.sku && (
                              <p className="text-stone-300">SKU: {item.sku}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 sm:mt-0 sm:pr-9">
                        {/* Quantity Selector */}
                        <div className="flex items-center">
                          <button
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity - 1)
                            }
                            className="p-1 min-h-[44px] min-w-[44px] text-stone-400 hover:text-stone-600 flex items-center justify-center"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 1;
                              updateQuantity(item.variantId, qty);
                            }}
                            className="w-16 text-center border-0 bg-transparent py-1 text-stone-900 focus:ring-0 sm:text-sm"
                            min="1"
                          />
                          <button
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity + 1)
                            }
                            className="p-1 min-h-[44px] min-w-[44px] text-stone-400 hover:text-stone-600 flex items-center justify-center"
                            aria-label="Increase quantity"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <div className="absolute right-0 top-0">
                          <button
                            onClick={() => removeItem(item.variantId)}
                            className="p-2 min-h-[44px] min-w-[44px] text-stone-400 hover:text-red-500 transition-colors flex items-center justify-center"
                            aria-label="Remove item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-4">
                      <p className="text-base font-medium text-stone-900">
                        Subtotal: {formatCartPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Continue Shopping */}
            <div className="mt-6">
              <Link
                href="/products"
                className="text-sm text-stone-600 hover:text-stone-900 flex items-center gap-2"
              >
                <ArrowRight size={16} className="rotate-180" />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-16 lg:col-span-5 lg:mt-0">
            <div className="bg-white rounded-lg border border-stone-200 p-6">
              <h2 className="text-lg font-medium text-stone-900 mb-6">
                Order Summary
              </h2>

              {/* Promo Code */}
              <div className="mb-6">
                {discount ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-3">
                    <div>
                      <span className="text-sm font-medium text-green-800">
                        {discount.code}
                      </span>
                      <span className="text-xs text-green-600 ml-2">
                        (-{formatCartPrice(discount.amount)})
                      </span>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className="text-xs text-green-700 hover:text-green-900"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Promo code"
                      className="flex-1 border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoCode.trim()}
                      className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-md hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {promoLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Country Selector for Shipping */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-stone-500 mb-2">
                  Shipping to
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
                >
                  <option value="">Select country</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="IN">India</option>
                  <option value="JP">Japan</option>
                </select>
                {shippingLoading && (
                  <p className="text-xs text-stone-500 mt-1">Loading shipping options...</p>
                )}

                {/* Shipping Options Radio Group */}
                {_shippingOptions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <label className="block text-xs font-medium text-stone-500 mb-2">
                      Select shipping method
                    </label>
                    {_shippingOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                          selectedShippingOption === option.id
                            ? 'border-stone-900 bg-stone-50'
                            : 'border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="shipping-option"
                            value={option.id}
                            checked={selectedShippingOption === option.id}
                            onChange={() => handleShippingOptionChange(option.id)}
                            className="h-4 w-4 text-stone-900 focus:ring-stone-900"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-stone-900">
                              {option.name}
                            </p>
                            <p className="text-xs text-stone-500">
                              {option.description}{option.estimated_days && option.estimated_days.trim() !== '' ? ` (${option.estimated_days})` : null}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-stone-900">
                          {subtotal >= freeShippingThreshold
                            ? 'Free'
                            : formatCartPrice(option.price)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary Details */}
              <div className="flow-root">
                <dl className="-my-4 divide-y divide-stone-100">
                  <div className="flex items-center justify-between py-4">
                    <dt className="text-stone-600">Subtotal</dt>
                    <dd className="font-medium text-stone-900">
                      {formatCartPrice(subtotal)}
                    </dd>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between py-4">
                      <dt className="text-stone-600">Discount</dt>
                      <dd className="font-medium text-green-600">
                        -{formatCartPrice(discountAmount)}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-4">
                    <dt className="text-stone-600">
                      Shipping
                      {shippingCost === 0 && subtotal >= freeShippingThreshold && (
                        <span className="ml-2 text-xs text-green-600">
                          (Free over {formatCartPrice(freeShippingThreshold)})
                        </span>
                      )}
                    </dt>
                    <dd className="font-medium text-stone-900">
                      {!countryCode ? (
                        <span className="text-stone-400 text-sm">Calculated at checkout</span>
                      ) : countryCode && _shippingOptions.length === 0 ? (
                        <span className="text-stone-400 text-sm">Shipping unavailable</span>
                      ) : !selectedShipping ? (
                        <span className="text-stone-400 text-sm">Not available</span>
                      ) : shippingCost === 0 ? (
                        'Free'
                      ) : (
                        formatCartPrice(shippingCost ?? 0)
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <dt className="text-base font-medium text-stone-900">
                      Total
                    </dt>
                    <dd className="text-xl font-medium text-stone-900">
                      {formatCartPrice(total)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Free Shipping Notice */}
              {(shippingCost === null || shippingCost > 0) && subtotal < freeShippingThreshold && (
                <div className="mt-4 flex items-center gap-2 text-sm text-stone-500 bg-stone-50 p-3 rounded-md">
                  <AlertCircle size={16} />
                  <span>
                    Add {formatCartPrice(freeShippingThreshold - subtotal)} more
                    for free shipping!
                  </span>
                </div>
              )}

              {/* Checkout Button */}
              <Link
                href="/checkout"
                className="mt-6 block w-full bg-stone-900 text-white text-center py-4 text-sm font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
              >
                Proceed to Checkout
              </Link>

              {/* Secure Checkout Notice */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-stone-500">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Secure checkout powered by Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
