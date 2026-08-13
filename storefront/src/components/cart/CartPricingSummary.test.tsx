import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CartPricingSummary } from './CartPricingSummary';

const formatPrice = (amount: number) => `₹${amount}`;

describe('CartPricingSummary', () => {
  it('renders discount, selected shipping, and a derived total without page state', () => {
    render(
      <CartPricingSummary
        subtotal={10000}
        discountAmount={1000}
        shippingCost={500}
        countryCode="IN"
        hasShippingOptions
        hasSelectedShipping
        freeShippingThreshold={25000}
        formatPrice={formatPrice}
      />
    );

    expect(screen.getByText('₹10000')).toBeInTheDocument();
    expect(screen.getByText('-₹1000')).toBeInTheDocument();
    expect(screen.getByText('₹500')).toBeInTheDocument();
    expect(screen.getByText('₹9500')).toBeInTheDocument();
    expect(screen.getByText(/Add ₹15000 more for free shipping/i)).toBeInTheDocument();
  });

  it('renders free shipping and omits the free-shipping prompt when the threshold is met', () => {
    render(
      <CartPricingSummary
        subtotal={25000}
        discountAmount={0}
        shippingCost={0}
        countryCode="IN"
        hasShippingOptions
        hasSelectedShipping
        freeShippingThreshold={25000}
        formatPrice={formatPrice}
      />
    );

    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('(Free over ₹25000)')).toBeInTheDocument();
    expect(screen.queryByText(/more for free shipping/i)).not.toBeInTheDocument();
  });

  it('explains that shipping is calculated later before a country is selected', () => {
    render(
      <CartPricingSummary
        subtotal={1200}
        discountAmount={0}
        shippingCost={null}
        countryCode=""
        hasShippingOptions={false}
        hasSelectedShipping={false}
        freeShippingThreshold={25000}
        formatPrice={formatPrice}
      />
    );

    expect(screen.getByText('Calculated at checkout')).toBeInTheDocument();
    expect(screen.getAllByText('₹1200')).toHaveLength(2);
  });
});
