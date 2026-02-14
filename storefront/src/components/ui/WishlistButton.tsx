'use client';

import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/wishlist-context';
import { useShop } from '@/context/shop-context';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
    productId: string;
    title: string;
    price: number;
    currency?: string;
    thumbnail?: string;
    handle: string;
    variantId?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export default function WishlistButton({
    productId,
    title,
    price,
    currency = 'USD',
    thumbnail,
    handle,
    variantId,
    className = '',
    size = 'md',
    showLabel = false
}: WishlistButtonProps) {
    const { isInWishlist, toggleItem, addItem, removeItem } = useWishlist();
    const { currentRegion } = useShop();
    
    const isWishlisted = isInWishlist(productId);
    
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const item = {
            productId,
            variantId,
            title,
            price,
            currency: currentRegion?.currency_code?.toUpperCase() || currency,
            thumbnail,
            handle
        };
        
        toggleItem(item);
    };

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12'
    };

    const iconSizes = {
        sm: 14,
        md: 18,
        lg: 22
    };

    return (
        <button
            onClick={handleClick}
            className={cn(
                'flex items-center justify-center rounded-full transition-all duration-200',
                isWishlisted 
                    ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                    : 'bg-white/90 text-stone-400 hover:text-red-500 hover:bg-white',
                sizeClasses[size],
                className
            )}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
            <Heart 
                size={iconSizes[size]} 
                strokeWidth={isWishlisted ? 2.5 : 1.5}
                className={cn(
                    'transition-transform duration-200',
                    isWishlisted ? 'fill-current' : 'hover:scale-110'
                )} 
            />
            {showLabel && (
                <span className={cn(
                    'ml-2 font-medium',
                    isWishlisted ? 'text-red-500' : 'text-stone-600'
                )}>
                    {isWishlisted ? 'Saved' : 'Save'}
                </span>
            )}
        </button>
    );
}
