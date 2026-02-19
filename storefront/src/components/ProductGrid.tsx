'use client';

import { useState } from 'react';
import { useShop } from '@/context/shop-context';
import { useCart } from '@/context/cart-context';
import { useNotification } from '@/context/notification-context';
import { useWholesale } from '@/context/wholesale-context';
import Image from 'next/image';
import Link from 'next/link';
import type { Product, MoneyAmount } from '@/types';
import WishlistButton from '@/components/ui/WishlistButton';
import { Eye, ShoppingBag, Tag } from 'lucide-react';
import { QuickViewModal } from '@/components/product/QuickViewModal';


interface ProductGridProps {
    initialProducts?: Product[];
    loading?: boolean;
}

export default function ProductGrid({ initialProducts = [], loading: externalLoading }: ProductGridProps) {
    const { currentRegion } = useShop();
    const { addItem } = useCart();
    const { showNotification } = useNotification();
    const { wholesaleInfo, getPrice: getWholesalePrice, fetchPrices } = useWholesale();
    const [addedId, setAddedId] = useState<string | null>(null);
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
    const products = initialProducts;
    const loading = externalLoading || initialProducts.length === 0;

    // Fetch wholesale prices when products load
    useState(() => {
        if (wholesaleInfo?.hasWholesaleAccess && products.length > 0) {
            const variantIds = products
                .map(p => p.variants?.[0]?.id)
                .filter(Boolean) as string[];
            fetchPrices(variantIds);
        }
    });

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

        // Show feedback on button
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 1000);
    };

    const getPrice = (product: Product) => {
        const prices = product.variants?.[0]?.prices || [];
        const currencyCode = currentRegion?.currency_code || 'usd';
        const price = prices.find((p: MoneyAmount) => p.currency_code === currencyCode.toLowerCase()) || prices[0];

        if (!price) {
            return { price: 'Contact for price', isWholesale: false, savings: 0 };
        }

        const retailPrice = price.amount;
        const variantId = product.variants?.[0]?.id;

        // Check for wholesale pricing
        if (variantId && wholesaleInfo?.hasWholesaleAccess) {
            const wholesale = getWholesalePrice(variantId, retailPrice);
            if (wholesale.isWholesale) {
                return {
                    price: new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: price.currency_code?.toUpperCase() || 'USD'
                    }).format(wholesale.price / 100),
                    isWholesale: true,
                    savings: wholesale.savings,
                    discountPercent: wholesaleInfo.discountPercent,
                };
            }
        }

        return {
            price: new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: price.currency_code.toUpperCase()
            }).format(price.amount / 100),
            isWholesale: false,
            savings: 0,
        };
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="aspect-[3/4] bg-stone-100 mb-4 rounded-sm"></div>
                        <div className="h-4 bg-stone-100 w-2/3 mb-2 mx-auto"></div>
                        <div className="h-4 bg-stone-100 w-1/3 mx-auto"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return <div className="py-20 text-center text-stone-500 font-light italic">No products found in this collection.</div>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {products.map((product) => (
                <div key={product.id} className="group flex flex-col">
                    <Link href={`/products/${product.handle || product.id}`} className="block relative aspect-[3/4] bg-stone-100 overflow-hidden mb-6 rounded-sm shadow-sm hover:shadow-xl transition-shadow duration-500">
                        {product.thumbnail ? (
                            <Image
                                src={product.thumbnail}
                                alt={product.title}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-100 font-serif italic">
                                No Image
                            </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-x-0 bottom-0 top-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        {/* Quick Actions Bar - Slide Up */}
                        <div className="absolute inset-x-0 bottom-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 flex gap-2 justify-center pb-6">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setQuickViewProduct(product);
                                }}
                                className="py-3 px-4 bg-white/90 backdrop-blur-sm text-stone-900 hover:bg-stone-900 hover:text-white transition-all shadow-lg"
                                aria-label="Quick view"
                            >
                                <Eye size={18} />
                            </button>
                            <button
                                onClick={(e) => handleAddToCart(e, product)}
                                className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-widest transition-all shadow-lg ${addedId === product.id
                                    ? 'bg-green-600 text-white border-green-600'
                                    : 'bg-white text-stone-900 hover:bg-stone-900 hover:text-white border border-white hover:border-stone-900'
                                    }`}
                            >
                                {addedId === product.id ? 'Added' : 'Add to Cart'}
                            </button>
                        </div>

                        {/* Top Right Icons */}
                        <div className="absolute top-4 right-4 flex flex-col gap-3 translate-x-12 group-hover:translate-x-0 transition-transform duration-300 z-20">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white shadow-sm hover:shadow-md transition-all text-stone-600 hover:text-red-500">
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
                           
                        </div>
                    </Link>

                    {/* Product Info */}
                    <Link href={`/products/${product.handle || product.id}`} className="space-y-2 text-center mt-auto">
                        <p className="text-[10px] text-stone-500 font-bold tracking-[0.2em] uppercase">{product.subtitle || product.collection?.title || 'Kvastram Collection'}</p>
                        <h3 className="font-serif text-lg text-stone-900 leading-tight group-hover:text-stone-600 transition-colors">{product.title}</h3>
                        {(() => {
                            const priceInfo = getPrice(product);
                            if (priceInfo.isWholesale) {
                                return (
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-green-600 flex items-center">
                                                <Tag className="w-3 h-3 mr-1" />
                                                Wholesale
                                            </span>
                                            <p className="text-sm font-bold text-green-700">
                                                {priceInfo.price}
                                            </p>
                                        </div>
                                        {priceInfo.savings > 0 && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="text-stone-400 line-through">
                                                    {new Intl.NumberFormat(undefined, {
                                                        style: 'currency',
                                                        currency: 'USD'
                                                    }).format((product.variants?.[0]?.prices?.[0]?.amount || 0) / 100)}
                                                </span>
                                                <span className="text-green-600 font-medium">
                                                    Save {priceInfo.discountPercent}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            return (
                                <p className="text-sm font-medium text-stone-900">
                                    {priceInfo.price}
                                </p>
                            );
                        })()}
                    </Link>
                </div>
            ))}
            
            {/* Quick View Modal */}
            <QuickViewModal
                product={quickViewProduct || ({} as Product)}
                isOpen={!!quickViewProduct}
                onClose={() => setQuickViewProduct(null)}
            />
        </div>
    );
}
