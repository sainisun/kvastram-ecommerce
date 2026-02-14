'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '@/lib/storage';

export interface WishlistItem {
    id: string;
    productId: string;
    variantId?: string;
    title: string;
    price: number;
    currency: string;
    thumbnail?: string;
    handle: string;
    addedAt: number;
}

interface WishlistContextType {
    items: WishlistItem[];
    addItem: (item: Omit<WishlistItem, 'id' | 'addedAt'>) => void;
    removeItem: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    toggleItem: (item: Omit<WishlistItem, 'id' | 'addedAt'>) => void;
    clearWishlist: () => void;
    totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = storage.get<WishlistItem[]>('kvastram_wishlist', []);
        const timer = setTimeout(() => {
            if (stored && stored.length > 0) {
                setItems(stored);
            }
            setIsLoaded(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    // Save to localStorage when items change
    useEffect(() => {
        if (isLoaded) {
            storage.set('kvastram_wishlist', items);
        }
    }, [items, isLoaded]);

    const addItem = (newItem: Omit<WishlistItem, 'id' | 'addedAt'>) => {
        setItems(prev => {
            // Don't add if already exists
            if (prev.some(item => item.productId === newItem.productId)) {
                return prev;
            }
            const item: WishlistItem = {
                ...newItem,
                id: `wishlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                addedAt: Date.now()
            };
            return [...prev, item];
        });
    };

    const removeItem = (productId: string) => {
        setItems(prev => prev.filter(item => item.productId !== productId));
    };

    const isInWishlist = (productId: string) => {
        return items.some(item => item.productId === productId);
    };

    const toggleItem = (item: Omit<WishlistItem, 'id' | 'addedAt'>) => {
        if (isInWishlist(item.productId)) {
            removeItem(item.productId);
        } else {
            addItem(item);
        }
    };

    const clearWishlist = () => setItems([]);

    const totalItems = items.length;

    return (
        <WishlistContext.Provider value={{ 
            items, 
            addItem, 
            removeItem, 
            isInWishlist, 
            toggleItem,
            clearWishlist, 
            totalItems 
        }}>
            {children}
        </WishlistContext.Provider>
    );
}

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within WishlistProvider');
    }
    return context;
};
