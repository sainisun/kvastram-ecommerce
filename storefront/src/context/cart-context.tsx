'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { storage } from '@/lib/storage';
import { useAuth } from './auth-context';
import { api } from '@/lib/api';
import { getCanonicalProductHandle } from '@/lib/product-links';
import {
  addCartItem,
  calculateCartTotals,
  mergeCartItems,
  removeCartItem,
  setCartItemQuantity,
  type CartItem,
} from '@/lib/cart-state';

export type { CartItem } from '@/lib/cart-state';

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  cartTotal: number;
  savedCartCount: number;
  cartError: string | null;
  recoverSavedCart: () => Promise<void>;
  dismissSavedCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function sanitizeCartItem(item: CartItem): CartItem {
  return {
    ...item,
    handle: getCanonicalProductHandle(item.handle),
  };
}

function sanitizeCartItems(items: CartItem[] | null | undefined): CartItem[] {
  if (!Array.isArray(items)) return [];
  return items.map(sanitizeCartItem);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [savedCartCount, setSavedCartCount] = useState(0);
  const [recoveryOffered, setRecoveryOffered] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const { customer } = useAuth();

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = sanitizeCartItems(
        storage.get<CartItem[]>('odhvica_cart', [])
      );
      const timer = setTimeout(() => {
        if (stored && stored.length > 0) {
          setItems(stored);
        }
        setIsLoaded(true);
      }, 0);
      return () => clearTimeout(timer);
    } catch {
      setTimeout(() => {
        setCartError('Unable to load your cart. Please refresh the page.');
        setIsLoaded(true);
      }, 0);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      storage.set('odhvica_cart', items);
    }
  }, [items, isLoaded]);

  // Save cart to backend when user is logged in and cart changes
  useEffect(() => {
    if (!customer || !isLoaded) return;

    const timeout = setTimeout(() => {
      if (items.length === 0) {
        // Clear saved cart only when we know there's no saved cart to recover
        // or when recovery has already been offered/dismissed
        if (savedCartCount === 0 || !recoveryOffered) {
          api.clearSavedCart().catch(console.error);
        }
      } else {
        api.saveCart(items).catch(console.error);
      }
    }, 1000); // Debounce 1 second
    return () => clearTimeout(timeout);
  }, [items, customer, isLoaded, savedCartCount, recoveryOffered]);

  // Check for saved cart when user logs in
  useEffect(() => {
    if (customer && isLoaded) {
      api
        .getSavedCart()
        .then((data) => {
          if (data.items && data.items.length > 0) {
            setSavedCartCount(data.items.length);
            setRecoveryOffered(true);
          } else {
            setSavedCartCount(0);
          }
        })
        .catch(() => {
          setSavedCartCount(0);
          setCartError('Unable to load your cart. Please refresh the page.');
        });
    }
  }, [customer, isLoaded]);

  // Clear saved cart count when user logs out
  useEffect(() => {
    if (!customer && isLoaded) {
      const timer = setTimeout(() => {
        setSavedCartCount(0);
        setRecoveryOffered(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [customer, isLoaded]);

  const recoverSavedCart = useCallback(async () => {
    try {
      const data = await api.getSavedCart();
      if (data.items && data.items.length > 0) {
        setItems((previousItems) =>
          mergeCartItems(previousItems, sanitizeCartItems(data.items))
        );
        setSavedCartCount(0);
        setRecoveryOffered(false);
        // Clear saved cart from backend after recovery
        await api.clearSavedCart();
      }
    } catch (error) {
      console.error('Failed to recover cart:', error);
    }
  }, []);

  const dismissSavedCart = useCallback(() => {
    setSavedCartCount(0);
    setRecoveryOffered(false);
    api.clearSavedCart().catch(console.error);
  }, []);

  const addItem = (newItem: CartItem) => {
    setItems((previousItems) =>
      addCartItem(previousItems, sanitizeCartItem(newItem))
    );
  };

  const removeItem = (id: string) => {
    setItems((previousItems) => removeCartItem(previousItems, id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((previousItems) =>
      setCartItemQuantity(previousItems, id, quantity)
    );
  };

  const clearCart = () => setItems([]);

  const { totalItems, cartTotal } = calculateCartTotals(items);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        cartTotal,
        savedCartCount,
        cartError,
        recoverSavedCart,
        dismissSavedCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
