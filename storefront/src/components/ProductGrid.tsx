
'use client';

import { useState } from 'react';
import { useShop } from '@/context/shop-context';
import { useCart } from '@/context/cart-context';
import { useNotification } from '@/context/notification-context';
import Image from 'next/image';
import Link from 'next/link';
import type { Product, MoneyAmount } from '@/types';
import WishlistButton from '@/components/ui/WishlistButton';
import { Eye } from 'lucide-react';


interface ProductGridProps {
    initialProducts?: Product[];
    loading?: boolean;
}

export default function ProductGrid({ initialProducts = [], loading: externalLoading }: ProductGridProps) {
    const { currentRegion } = useShop();
    const { addItem } = useCart();
    const { showNotification } = useNotification();
    const [addedId, setAddedId] = useState<string | null>(null);
    const products = initialProducts;
    const loading = externalLoading || initialProducts.length === 0;

    const handleAddToCart = (e: React.MouseEvent, product: Product) => {
        e.preventDefault(); // Prevent navigation
        if (!product.variants || product.variants.length === 0) {
            showNotification('error', 'Product unavailable');
            return;
        }
        const variant = product.variants[0];

        const prices = variant.prices || [];
        const priceObj = prices.find((p: MoneyAmount) => p.currency_code === (currentRegion?.currency_code || 'usd').toLowerCase()) || prices[0];

        if (!priceObj) {
            showNotification('error', 'Price unavailable for this region');
            return;
        }

        addItem({
            id: variant.id,
            variantId: variant.id,
            quantity: 1,
            title: product.title,
            price: priceObj.amount,
            currency: priceObj.currency_code,
            thumbnail: product.thumbnail || undefined,
            material: product.material || undefined,
            origin: product.origin_country || undefined,
            sku: variant.sku || undefined,
            description: product.description || undefined
        });

        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 1000);
    };

    const getPrice = (product: Product) => {
        const prices = product.variants?.[0]?.prices || [];
        const currencyCode = currentRegion?.currency_code || 'usd';
        const price = prices.find((p: MoneyAmount) => p.currency_code === currencyCode.toLowerCase()) || prices[0];

        if (price) {
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: price.currency_code.toUpperCase()
            }).format(price.amount / 100);
        }

        return 'Contact for price';
    };

    if (loading) return <div className="py-20 text-center text-stone-500 font-light">Loading Collection...</div>;

    if (products.length === 0) {
        return <div className="py-20 text-center text-stone-500 font-light">No products found.</div>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {products.map((product) => (
                <Link href={`/products/${product.handle || product.id}`} key={product.id} className="group block">
                    <div className="aspect-[3/4] bg-stone-100 relative overflow-hidden mb-4 rounded-sm">
                        {product.thumbnail ? (
                            <Image
                                src={product.thumbnail}
                                alt={product.title}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-100 font-serif italic">
                                No Image
                            </div>
                        )}

                        {/* Quick Actions Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2">
                            <button
                                id={`btn-${product.id}`}
                                onClick={(e) => handleAddToCart(e, product)}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors shadow-lg ${addedId === product.id
                                    ? 'bg-green-600 text-white'
                                    : 'bg-white text-stone-900 hover:bg-stone-900 hover:text-white'
                                    }`}
                            >
                                {addedId === product.id ? 'Added' : 'Add to Cart'}
                            </button>
                        </div>

                        {/* Wishlist Button */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <WishlistButton
                                productId={product.id}
                                title={product.title}
                                price={product.variants?.[0]?.prices?.[0]?.amount || 0}
                                currency={currentRegion?.currency_code?.toUpperCase() || 'USD'}
                                thumbnail={product.thumbnail || undefined}
                                handle={product.handle || product.id}
                                variantId={product.variants?.[0]?.id}
                                size="sm"
                            />
                        </div>

                        {/* Quick View Button - Links to product page */}
                        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Link
                                href={`/products/${product.handle || product.id}`}
                                className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                                aria-label="Quick View"
                            >
                                <Eye size={18} className="text-stone-700" />
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-1 text-center">
                        <h3 className="font-serif text-lg text-stone-900 leading-tight group-hover:text-stone-600 transition-colors">{product.title}</h3>
                        <p className="text-xs text-stone-500 font-light tracking-wide uppercase">{product.subtitle || product.collection?.title || 'Kvastram Collection'}</p>
                        <p className="text-sm font-medium text-stone-900 pt-1">
                            {getPrice(product)}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    );
}
