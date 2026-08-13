export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  title: string;
  price: number;
  currency: string;
  thumbnail?: string;
  material?: string;
  origin?: string;
  sku?: string;
  description?: string;
  handle?: string;
}

export interface CartTotals {
  totalItems: number;
  cartTotal: number;
}

export function addCartItem(items: CartItem[], item: CartItem): CartItem[] {
  const existing = items.find((candidate) => candidate.variantId === item.variantId);
  if (!existing) return [...items, item];

  return items.map((candidate) =>
    candidate.variantId === item.variantId
      ? { ...candidate, quantity: candidate.quantity + item.quantity }
      : candidate
  );
}

export function removeCartItem(items: CartItem[], variantId: string): CartItem[] {
  return items.filter((item) => item.variantId !== variantId);
}

export function setCartItemQuantity(
  items: CartItem[],
  variantId: string,
  quantity: number
): CartItem[] {
  if (quantity <= 0) return removeCartItem(items, variantId);
  return items.map((item) =>
    item.variantId === variantId ? { ...item, quantity } : item
  );
}

export function mergeCartItems(
  currentItems: CartItem[],
  recoveredItems: CartItem[]
): CartItem[] {
  return recoveredItems.reduce(
    (mergedItems, item) => addCartItem(mergedItems, item),
    currentItems
  );
}

export function calculateCartTotals(items: CartItem[]): CartTotals {
  return items.reduce<CartTotals>(
    (totals, item) => ({
      totalItems: totals.totalItems + item.quantity,
      cartTotal: totals.cartTotal + item.price * item.quantity,
    }),
    { totalItems: 0, cartTotal: 0 }
  );
}
