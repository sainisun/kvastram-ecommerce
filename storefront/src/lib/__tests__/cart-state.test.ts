import { describe, expect, it } from 'vitest';
import {
  addCartItem,
  calculateCartTotals,
  mergeCartItems,
  removeCartItem,
  setCartItemQuantity,
  type CartItem,
} from '../cart-state';

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'variant-1',
  variantId: 'variant-1',
  quantity: 1,
  title: 'Handwoven Textile',
  price: 1200,
  currency: 'INR',
  ...overrides,
});

describe('cart state transitions', () => {
  it('merges a repeated variant without mutating the prior array', () => {
    const existingItems = [item({ quantity: 2 })];
    const nextItems = addCartItem(existingItems, item({ quantity: 3 }));

    expect(nextItems).toEqual([item({ quantity: 5 })]);
    expect(nextItems).not.toBe(existingItems);
    expect(existingItems).toEqual([item({ quantity: 2 })]);
  });

  it('removes an item when its quantity is set to zero', () => {
    expect(setCartItemQuantity([item()], 'variant-1', 0)).toEqual([]);
    expect(removeCartItem([item()], 'variant-1')).toEqual([]);
  });

  it('merges a recovered cart by variant while retaining new variants', () => {
    const currentItems = [item({ quantity: 1 })];
    const recoveredItems = [
      item({ quantity: 2 }),
      item({ id: 'variant-2', variantId: 'variant-2', quantity: 1, price: 900 }),
    ];

    expect(mergeCartItems(currentItems, recoveredItems)).toEqual([
      item({ quantity: 3 }),
      item({ id: 'variant-2', variantId: 'variant-2', quantity: 1, price: 900 }),
    ]);
  });

  it('derives quantity and monetary totals from current state', () => {
    expect(
      calculateCartTotals([
        item({ quantity: 2, price: 1200 }),
        item({ id: 'variant-2', variantId: 'variant-2', quantity: 3, price: 900 }),
      ])
    ).toEqual({ totalItems: 5, cartTotal: 5100 });
  });
});
