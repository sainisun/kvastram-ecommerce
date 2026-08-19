'use client';

import { AddressAutocomplete, Button, CountrySelect, HiddenCheckbox, Input, SelectionControl, Select, Textarea } from '@/design-system';
import Link from 'next/link';
import { INDIAN_STATES } from '@/config/indian-states';

export interface CheckoutFormData {
  email: string;
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  province: string;
  country_code: string;
  postal_code: string;
  phone: string;
}

export interface CheckoutShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimated_days: string;
  currency_code: string;
}

interface CheckoutShippingFormProps {
  formData: CheckoutFormData;
  shippingOptions: CheckoutShippingOption[];
  selectedShipping: CheckoutShippingOption | null;
  shippingLoading: boolean;
  freeShippingThreshold: number;
  shippingPreviewMessage: string;
  cartTotal: number;
  giftWrapping: boolean;
  giftMessage: string;
  acceptTerms: boolean;
  loading: boolean;
  policyRoutes: {
    terms: string;
    privacy: string;
    shipping: string;
    refundPolicy: string;
  };
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onAddressChange: (value: string) => void;
  onAddressSelect: (address: { address_1: string; city: string; postal_code: string; country: string }) => void;
  onCountryChange: (code: string) => void;
  onShippingChange: (option: CheckoutShippingOption) => void;
  onGiftWrappingChange: (checked: boolean) => void;
  onGiftMessageChange: (value: string) => void;
  onTermsChange: (checked: boolean) => void;
  displayMoney: (amount: number) => string;
}

export default function CheckoutShippingForm({
  formData,
  shippingOptions,
  selectedShipping,
  shippingLoading,
  freeShippingThreshold,
  shippingPreviewMessage,
  cartTotal,
  giftWrapping,
  giftMessage,
  acceptTerms,
  loading,
  policyRoutes,
  onSubmit,
  onChange,
  onAddressChange,
  onAddressSelect,
  onCountryChange,
  onShippingChange,
  onGiftWrappingChange,
  onGiftMessageChange,
  onTermsChange,
  displayMoney,
}: CheckoutShippingFormProps) {
  const giftWrappingFee = 29900;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div>
        <h3 className="mb-6 border-b border-border-subtle pb-2 text-body-xl font-display text-primary">Contact</h3>
        <div className="space-y-4">
          <Input id="email" type="email" name="email" label="Email Address" required value={formData.email} onChange={onChange} autoComplete="email" aria-required="true" aria-describedby="email-help" />
          <span id="email-help" className="sr-only">Enter your email address for order updates</span>
        </div>
      </div>

      <div>
        <h3 className="mb-6 border-b border-border-subtle pb-2 text-body-xl font-display text-primary">Shipping Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
          <Input id="first_name" type="text" name="first_name" label="First Name" required value={formData.first_name} onChange={onChange} autoComplete="given-name" aria-required="true" />
          <Input id="last_name" type="text" name="last_name" label="Last Name" required value={formData.last_name} onChange={onChange} autoComplete="family-name" aria-required="true" />
        </div>
        <div className="mb-4">
          <AddressAutocomplete label="Address (Line 1)" value={formData.address_1} onChange={onAddressChange} onAddressSelect={onAddressSelect} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
          <Input id="city" type="text" name="city" label="City" required value={formData.city} onChange={onChange} autoComplete="address-level2" aria-required="true" />
          {formData.country_code.toUpperCase() === 'IN' ? (
            <Select id="province" name="province" label="State/Union Territory" value={formData.province} onChange={onChange} autoComplete="address-level1" required aria-required="true">
              <option value="">Select state</option>
              {INDIAN_STATES.map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}
            </Select>
          ) : (
            <Input id="province" type="text" name="province" label="State/Province" value={formData.province} onChange={onChange} autoComplete="address-level1" />
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
          <Input id="postal_code" type="text" name="postal_code" label="Postal Code" required value={formData.postal_code} onChange={onChange} autoComplete="postal-code" aria-required="true" />
        </div>
        <div>
          <p className="form-label-typography mb-1.5 text-muted">Country <span className="ml-1 text-error">*</span></p>
          <CountrySelect name="country" value={formData.country_code} onChange={onCountryChange} required />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="mb-6 border-b border-border-subtle pb-2 text-body-xl font-display text-primary">Shipping Method</h3>
        {shippingLoading ? (
          <div className="py-4 text-center text-muted">Loading shipping options...</div>
        ) : shippingOptions.length > 0 ? (
          <div className="space-y-3">
            {shippingOptions.map((option) => {
              const isFree = option.price === 0 || cartTotal >= freeShippingThreshold;
              const displayPrice = isFree ? 0 : option.price;
              return (
                <label key={option.id} className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${selectedShipping?.id === option.id ? 'border-primary bg-surface' : 'border-border-subtle hover:border-muted'}`}>
                  <div className="flex items-center gap-3">
                    <SelectionControl type="radio" name="shipping_method" value={option.id} checked={selectedShipping?.id === option.id} onChange={() => onShippingChange(option)} />
                    <div><p className="font-medium text-primary">{option.name}</p><p className="text-body-sm text-muted">{option.description}</p></div>
                  </div>
                  <span className={`font-medium ${isFree ? 'text-success' : 'text-primary'}`}>{isFree ? 'FREE' : displayMoney(displayPrice)}</span>
                </label>
              );
            })}
            {cartTotal >= freeShippingThreshold && selectedShipping && <p className="text-body-sm text-success bg-success-bg p-3 border border-success">🎉 You&apos;ve unlocked FREE shipping!</p>}
          </div>
        ) : formData.country_code ? (
          <div className="py-4 text-center text-muted">No shipping options available for this country</div>
        ) : (
          <div className="py-4 text-center text-muted">Select your country to see available shipping methods</div>
        )}
        {!shippingLoading && shippingPreviewMessage ? <p className="mt-3 text-body-xs text-muted">{shippingPreviewMessage}</p> : null}
      </div>

      <div className="mt-8">
        <h3 className="mb-4 border-b border-border-subtle pb-2 text-body-xl font-display text-primary">Gift Options</h3>
        <label className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${giftWrapping ? 'border-primary bg-surface' : 'border-border-subtle hover:border-muted'}`}>
          <div className="flex items-center gap-4"><div className="text-display-md">🎁</div><div><p className="text-body-sm font-medium text-primary">Premium Gift Wrapping</p><p className="text-body-xs font-light text-muted">Signature Odhvica box with ribbon &amp; message card</p></div></div>
          <div className="flex items-center gap-3"><span className="text-body-sm font-medium text-muted">+{displayMoney(giftWrappingFee)}</span><div className={`relative w-11 h-6 rounded-full transition-colors ${giftWrapping ? 'bg-primary' : 'bg-border-subtle'}`}><HiddenCheckbox checked={giftWrapping} onChange={(event) => onGiftWrappingChange(event.target.checked)} id="gift-wrapping-toggle" /><span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface-paper shadow transition-transform ${giftWrapping ? 'translate-x-5' : 'translate-x-0'}`} /></div></div>
        </label>
        {giftWrapping && <div className="mt-3 animate-fade-in"><Textarea label="Gift Message (Optional)" value={giftMessage} onChange={(event) => onGiftMessageChange(event.target.value)} placeholder="Write a personal message for the recipient..." maxLength={200} rows={3} className="min-h-24 resize-none" /><p className="mt-1 text-right text-body-xs text-muted">{giftMessage.length}/200</p></div>}
      </div>

      <div className="mt-8 border-t border-border-subtle pt-6">
        <label className="flex items-start gap-3 cursor-pointer group">
          <SelectionControl type="checkbox" checked={acceptTerms} onChange={(event) => onTermsChange(event.target.checked)} className="-ml-3 -mt-3" />
          <span className="text-body-sm text-muted group-hover:text-primary">
            I agree to the <Link href={policyRoutes.terms} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Terms of Service</Link>{' '}and{' '}<Link href={policyRoutes.privacy} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Privacy Policy</Link>,{' '}<Link href={policyRoutes.shipping} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Shipping</Link>{' '}and{' '}<Link href={policyRoutes.refundPolicy} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Refund Policy</Link>
          </span>
        </label>
      </div>

      <Button type="submit" disabled={loading || !acceptTerms} variant="secondary" size="lg" fullWidth aria-live="polite" aria-busy={loading}>{loading ? 'Processing...' : 'Continue to Payment'}</Button>
    </form>
  );
}
