'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { storage } from '@/lib/storage';
import { useAuth } from './auth-context';
import { api } from '@/lib/api';

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
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    cartTotal: number;
    savedCartCount: number;
    recoverSavedCart: () => Promise<void>;
    dismissSavedCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [savedCartCount, setSavedCartCount] = useState(0);
    const { customer } = useAuth();

    // Load cart from localStorage on mount
    useEffect(() => {
        const stored = storage.get<CartItem[]>('kvastram_cart', []);
        if (stored && stored.length > 0) {
            const timer = setTimeout(() => {
                setItems(stored);
            }, 0);
            return () => clearTimeout(timer);
        }
        const loadTimer = setTimeout(() => {
            setIsLoaded(true);
        }, 0);
        return () => clearTimeout(loadTimer);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isLoaded) {
            storage.set('kvastram_cart', items);
        }
    }, [items, isLoaded]);

    // Save cart to backend when user is logged in and cart changes
    useEffect(() => {
        if (customer && isLoaded && items.length > 0) {
            const timeout = setTimeout(() => {
                api.saveCart(items).catch(console.error);
            }, 1000); // Debounce 1 second
            return () => clearTimeout(timeout);
        }
    }, [items, customer, isLoaded]);

    // Check for saved cart when user logs in
    useEffect(() => {
        if (customer && isLoaded) {
            api.getSavedCart()
                .then(data => {
                    if (data.items && data.items.length > 0) {
                        setSavedCartCount(data.items.length);
                    }
                })
                .catch(console.error);
        } else {
            setSavedCartCount(0);
        }
    }, [customer, isLoaded]);

    const recoverSavedCart = useCallback(async () => {
        try {
            const data = await api.getSavedCart();
            if (data.items && data.items.length > 0) {
                // Merge saved cart with current cart
                setItems(prev => {
                    const merged = [...prev];
                    data.items.forEach((savedItem: CartItem) => {
                        const existing = merged.find(i => i.variantId === savedItem.variantId);
                        if (existing) {
                            existing.quantity += savedItem.quantity;
                        } else {
                            merged.push(savedItem);
                        }
                    });
                    return merged;
                });
                setSavedCartCount(0);
                // Clear saved cart from backend after recovery
                await api.clearSavedCart();
            }
        } catch (error) {
            console.error('Failed to recover cart:', error);
        }
    }, []);

    const dismissSavedCart = useCallback(() => {
        setSavedCartCount(0);
        api.clearSavedCart().catch(console.error);
    }, []);

    const addItem = (newItem: CartItem) => {
        setItems(prev => {
            const existing = prev.find(i => i.variantId === newItem.variantId);
            if (existing) {
                return prev.map(i => i.variantId === newItem.variantId
                    ? { ...i, quantity: i.quantity + newItem.quantity }
                    : i
                );
            }
            return [...prev, newItem];
        });
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(i => i.variantId !== id));
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(id);
            return;
        }
        setItems(prev => prev.map(i => 
            i.variantId === id ? { ...i, quantity } : i
        ));
    };

    const clearCart = () => setItems([]);

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ 
            items, 
            addItem, 
            removeItem, 
            updateQuantity, 
            clearCart, 
            totalItems, 
            cartTotal,
            savedCartCount,
            recoverSavedCart,
            dismissSavedCart
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
};
