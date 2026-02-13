'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';

interface Region {
    id: string;
    name: string;
    currency_code: string;
    tax_rate: number;
}

interface ShopContextType {
    currentRegion: Region | null;
    regions: Region[];
    setRegion: (region: Region) => void;
    isLoading: boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
    const [regions, setRegions] = useState<Region[]>([]);
    const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                const data = await api.getRegions();
                const regionList = data.regions || [];
                setRegions(regionList);

                // Check localStorage safely
                const stored = storage.get<Region | null>('kvastram_region', null);
                if (stored) {
                    const found = regionList.find((r: Region) => r.id === stored.id);
                    if (found) {
                        setCurrentRegion(found);
                    } else if (regionList.length > 0) {
                        setCurrentRegion(regionList[0]);
                    }
                } else if (regionList.length > 0) {
                    // Default to first (usually seeded US/Global)
                    // Or prioritize USD/US if exists
                    const us = regionList.find((r: Region) => r.currency_code === 'usd');
                    setCurrentRegion(us || regionList[0]);
                }
            } catch (err) {
                console.error('ShopProvider Init Error', err);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    const setRegion = (region: Region) => {
        setCurrentRegion(region);
        storage.set('kvastram_region', region);
    };

    return (
        <ShopContext.Provider value={{ currentRegion, regions, setRegion, isLoading }}>
            {children}
        </ShopContext.Provider>
    );
}

export const useShop = () => {
    const context = useContext(ShopContext);
    if (context === undefined) {
        throw new Error('useShop must be used within a ShopProvider');
    }
    return context;
};
