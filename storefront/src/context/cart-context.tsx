'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '@/lib/storage';

export interface CartItem {
    id: string; // Helper ID (variantId)
    variantId: string;
    quantity: number;
    title: string;
    price: number; // Stored for display, but backend recalculates
    currency: string;
    thumbnail?: string;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
    totalItems: number;
    cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const stored = storage.get<CartItem[]>('kvastram_cart', []);
        if (stored && stored.length > 0) {
            // Use setTimeout to avoid synchronous setState warning
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

    useEffect(() => {
        if (isLoaded) {
            storage.set('kvastram_cart', items);
        }
    }, [items, isLoaded]);

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

    const clearCart = () => setItems([]);

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, clearCart, totalItems, cartTotal }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
};
