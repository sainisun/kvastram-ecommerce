'use client';

import { useCart } from '@/context/cart-context';
import { useShop } from '@/context/shop-context';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, Trash2 } from 'lucide-react';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const { items, removeItem, updateQuantity, cartTotal } = useCart();
  const { currentRegion } = useShop();
  const cartRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close on escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const formatPrice = (amount: number) => {
    const currency = currentRegion?.currency_code?.toUpperCase() || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Cart Panel */}
      <div
        ref={cartRef}
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="text-lg font-medium text-stone-900">
            Your Cart ({items.length})
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <p className="text-stone-500 mb-4">Your cart is empty</p>
              <Link
                href="/products"
                onClick={onClose}
                className="text-sm font-medium text-stone-900 underline"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-4 p-4">
                  {/* Image */}
                  <div className="relative h-20 w-20 flex-shrink-0 bg-stone-100 overflow-hidden">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-stone-400">
                        <span className="text-xs">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-stone-900 truncate">
                      <Link
                        href={`/products/${item.variantId}`}
                        onClick={onClose}
                      >
                        {item.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-stone-500 mt-1">
                      {formatPrice(item.price)}
                    </p>
                    {(item.material || item.origin) && (
                      <div className="mt-1 text-xs text-stone-400">
                        {item.material && <span>{item.material}</span>}
                        {item.material && item.origin && <span> · </span>}
                        {item.origin && <span>{item.origin}</span>}
                      </div>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="p-1 text-stone-400 hover:text-stone-600 disabled:opacity-30"
                          aria-label={`Decrease quantity of ${item.title}`}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          className="p-1 text-stone-400 hover:text-stone-600"
                          aria-label={`Increase quantity of ${item.title}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="p-1 text-stone-400 hover:text-red-500"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-sm font-medium text-stone-900">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone-100 px-6 py-4 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-stone-600">Subtotal</span>
              <span className="text-lg font-medium text-stone-900">
                {formatPrice(cartTotal)}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Shipping and taxes calculated at checkout
            </p>

            {/* Actions */}
            <div className="space-y-2">
              <Link
                href="/cart"
                onClick={onClose}
                className="block w-full text-center py-3 border border-stone-300 text-stone-900 text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={onClose}
                className="block w-full text-center py-3 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
