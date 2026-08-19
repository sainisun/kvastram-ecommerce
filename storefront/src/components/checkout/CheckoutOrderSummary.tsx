'use client';

import { Input, Button, OptimizedImage, PaymentIcons, SecurityBadges } from '@/design-system';
import { ShieldCheck } from 'lucide-react';
import type { CartItem } from '@/lib/cart-state';

interface ConfirmedOrderTotals {
  total: number;
  shipping_total: number;
  tax_total: number;
  gift_wrapping_total: number;
  currency_code: string;
}

interface Discount {
  code: string;
  amount: number;
}

interface PromoMessage {
  type: 'success' | 'error';
  text: string;
}

interface SelectedShipping {
  name: string;
}

interface CheckoutOrderSummaryProps {
  items: CartItem[];
  step: 'auth' | 'shipping' | 'payment' | 'success';
  cartTotal: number;
  discount: Discount | null;
  promoCode: string;
  promoLoading: boolean;
  promoMessage: PromoMessage | null;
  selectedShipping: SelectedShipping | null;
  shippingCost: number;
  taxLoading: boolean;
  taxName: string;
  displayedTaxAmount: number;
  giftWrapping: boolean;
  giftWrappingCost: number;
  finalTotal: number;
  confirmedOrderTotals: ConfirmedOrderTotals | null;
  onPromoCodeChange: (value: string) => void;
  onApplyPromo: () => void;
  displayMoney: (amount: number) => string;
  displayConfirmedMoney: (amount: number) => string;
}

export default function CheckoutOrderSummary({
  items,
  step,
  cartTotal,
  discount,
  promoCode,
  promoLoading,
  promoMessage,
  selectedShipping,
  shippingCost,
  taxLoading,
  taxName,
  displayedTaxAmount,
  giftWrapping,
  giftWrappingCost,
  finalTotal,
  confirmedOrderTotals,
  onPromoCodeChange,
  onApplyPromo,
  displayMoney,
  displayConfirmedMoney,
}: CheckoutOrderSummaryProps) {
  return (
    <div className="bg-surface p-4 md:p-8 lg:p-20 order-1 lg:order-2">
      <div className="max-w-lg mx-auto sticky top-24">
        <h2 className="mb-8 text-display-sm font-display text-primary">Order Summary</h2>
        <div className="space-y-6 mb-8">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4">
              <div className="relative w-20 h-24 bg-surface-paper border border-border-subtle">
                {item.thumbnail ? (
                  <OptimizedImage src={item.thumbnail} alt={item.title} fill className="object-cover" sizes="80px" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-border-subtle p-1 text-center text-body-xs text-muted">No Image</div>
                )}
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-body-xs text-inverse">{item.quantity}</span>
              </div>
              <div className="flex-1">
                <p className="font-display text-primary">{item.title}</p>
                <p className="mt-1 text-body-xs tracking-token-wider text-muted">Qty: {item.quantity}</p>
                {(item.material || item.origin || item.sku) && (
                  <div className="mt-1 text-body-xs text-muted">
                    {item.material && <span>{item.material}</span>}
                    {item.material && (item.origin || item.sku) && <span> · </span>}
                    {item.origin && <span>{item.origin}</span>}
                    {item.origin && item.sku && <span> · </span>}
                    {item.sku && <span>{item.sku}</span>}
                  </div>
                )}
              </div>
              <p className="font-medium text-primary">{displayMoney(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        {step === 'shipping' && (
          <div className="mb-6 border-b border-border-subtle pb-6">
            <label className="mb-2 block text-body-xs font-bold tracking-token-wider text-muted">Promo Code</label>
            <div className="flex gap-0 border-b border-border-subtle transition-colors focus-within:border-primary">
              <Input type="text" aria-label="Promo code" placeholder="ENTER CODE" value={promoCode} onChange={(event) => onPromoCodeChange(event.target.value)} containerClassName="flex-1" className="h-auto border-0 bg-transparent px-0 py-2 font-display focus:border-transparent" />
              <Button type="button" onClick={onApplyPromo} disabled={promoLoading || !promoCode} variant="ghost" size="sm" className="px-2">{promoLoading ? 'Adjusting...' : 'Apply'}</Button>
            </div>
            {promoMessage && <p className={`text-body-xs mt-2 ${promoMessage.type === 'success' ? 'text-success' : 'text-error'}`}>{promoMessage.text}</p>}
          </div>
        )}
        <div className="border-t border-border-subtle pt-6 space-y-3 text-body-sm">
          <div className="flex justify-between text-muted"><span>Subtotal</span><span>{displayMoney(cartTotal)}</span></div>
          {discount && <div className="flex justify-between text-success"><div className="flex items-center gap-2"><span>Discount</span><span className="rounded bg-surface-soft px-1 py-0.5 text-body-xs text-muted">{discount.code}</span></div><span>-{displayMoney(discount.amount)}</span></div>}
          {step === 'payment' || selectedShipping ? (
            <div className="flex justify-between text-muted"><span>Shipping{selectedShipping ? ` (${selectedShipping.name})` : ''}</span><span className={shippingCost === 0 ? 'text-success' : ''}>{shippingCost === 0 ? 'FREE' : confirmedOrderTotals ? displayConfirmedMoney(shippingCost) : displayMoney(shippingCost)}</span></div>
          ) : <div className="flex justify-between text-muted"><span>Shipping</span><span>Calculated at next step</span></div>}
          {(taxLoading || displayedTaxAmount > 0) && <div className="flex justify-between text-muted"><span>{taxName}</span><span>{taxLoading ? <span className="text-muted">Calculating...</span> : confirmedOrderTotals ? displayConfirmedMoney(displayedTaxAmount) : displayMoney(displayedTaxAmount)}</span></div>}
          {giftWrapping && <div className="flex justify-between text-muted"><span className="flex items-center gap-1.5"><span>🎁</span> Gift Wrapping</span><span>{confirmedOrderTotals ? displayConfirmedMoney(giftWrappingCost) : displayMoney(giftWrappingCost)}</span></div>}
          <div className="flex justify-between border-t border-border-subtle pt-4 text-body-xl font-display text-primary"><span>Total</span><span>{confirmedOrderTotals ? displayConfirmedMoney(finalTotal) : displayMoney(finalTotal)}</span></div>
        </div>
        <div className="mt-8 flex gap-3 border border-border-subtle bg-surface-paper p-4 text-body-xs text-muted"><ShieldCheck size={32} className="shrink-0 text-muted" /><p>Every purchase is backed by our Authenticity Guarantee. We ensure the highest standards of craftsmanship.</p></div>
        <div className="mt-6"><p className="mb-3 text-center text-body-xs tracking-token-wider text-muted">Accepted Payment Methods</p><PaymentIcons /></div>
        <div className="mt-6 border-t border-border-subtle pt-6"><SecurityBadges /></div>
      </div>
    </div>
  );
}
