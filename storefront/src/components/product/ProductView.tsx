'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCart } from '@/context/cart-context';
import { useShop } from '@/context/shop-context';
import { Plus, Minus, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { SizeGuide } from '@/components/product/SizeGuide';
import { Reviews } from '@/components/product/Reviews';
import ProductGallery from './ProductGallery';
import type { Product, ProductVariant, ProductOption, MoneyAmount, ProductImage } from '@/types';

export default function ProductView({ product }: { product: Product }) {
    const { currentRegion } = useShop();
    const { addItem } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [showSizeGuide, setShowSizeGuide] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);

    const [deliveryDate, setDeliveryDate] = useState<string>('');

    // Calculate delivery date on mount
    useEffect(() => {
        const estimatedDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDeliveryDate(estimatedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
    }, []);

    // Check if product has structured options (Size, Color, etc.)
    const hasStructuredOptions = product.options && product.options.length > 0;

    // Initialize selected options from product options
    const defaultOptions = useMemo(() => {
        if (!hasStructuredOptions) return {};
        const defaults: Record<string, string> = {};
        product.options?.forEach((opt: ProductOption) => {
            if (opt.values && opt.values.length > 0) {
                defaults[opt.title] = opt.values[0].value;
            }
        });
        return defaults;
    }, [product, hasStructuredOptions]);

    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(defaultOptions);

    // Initialize selected variant ID
    const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
        if (product.variants?.length > 0) {
            return product.variants[0].id;
        }
        return '';
    });

    // Find the selected variant based on options or direct selection
    const selectedVariant = useMemo(() => {
        if (!product.variants || product.variants.length === 0) return null;
        if (product.variants.length === 1) return product.variants[0];

        if (hasStructuredOptions && Object.keys(selectedOptions).length > 0) {
            // Match variant by selected options
            return product.variants.find((v: ProductVariant) => {
                const variantOptions = v.title.split(' / ').map((t: string) => t.trim());
                return product.options?.every((opt: ProductOption, index: number) => {
                    return variantOptions[index] === selectedOptions[opt.title];
                });
            }) || product.variants[0];
        } else {
            // Simple variant selection by ID
            return product.variants.find((v: ProductVariant) => v.id === selectedVariantId) || product.variants[0];
        }
    }, [product.variants, product.options, selectedOptions, selectedVariantId, hasStructuredOptions]);

    const prices = selectedVariant?.prices || [];
    const priceObj = prices.find((p: MoneyAmount) => p.currency_code === (currentRegion?.currency_code || 'usd').toLowerCase()) || prices[0];

    // Fallback price logic if region not matched or prices missing
    const currency = priceObj?.currency_code || 'USD';
    const amount = priceObj?.amount || 0;

    const formattedPrice = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency.toUpperCase()
    }).format(amount / 100);

    const handleAddToCart = () => {
        if (!selectedVariant) return;
        addItem({
            id: selectedVariant.id,
            variantId: selectedVariant.id,
            quantity: quantity,
            title: product.title + (selectedVariant.title !== 'Default Variant' ? ` - ${selectedVariant.title}` : ''),
            price: amount,
            currency: currency,
            thumbnail: product.thumbnail || undefined
        });
        // React state-based feedback
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const images = product.images && product.images.length > 0
        ? product.images
            .sort((a: ProductImage, b: ProductImage) => (a.position || 0) - (b.position || 0))
            .map((img: ProductImage) => img.url)
        : (product.thumbnail ? [product.thumbnail] : []);

    return (
        <div className="bg-white min-h-screen pt-24 pb-24">
            <div className="max-w-7xl mx-auto px-6">
                {/* Breadcrumb (Visual) */}
                <div className="text-xs text-stone-500 mb-8 uppercase tracking-widest">
                    Home / Products / <span className="text-stone-900">{product.title}</span>
                </div>

                <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
                    {/* Left: Image Gallery */}
                    <div className="sticky top-24 self-start">
                        <ProductGallery images={images} title={product.title} />
                    </div>

                    {/* Right: Details */}
                    <div className="flex flex-col h-full">
                        <div className="mb-8 border-b border-stone-100 pb-8">
                            <span className="text-xs font-bold tracking-[0.2em] text-stone-500 uppercase block mb-3">
                                {product.collection?.title || 'Kvastram Collection'}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 leading-tight mb-4">
                                {product.title}
                            </h1>
                            <p className="text-2xl font-light text-stone-900">
                                {formattedPrice}
                            </p>
                        </div>

                        <div className="prose prose-stone prose-sm font-light text-stone-600 mb-10 max-w-none">
                            <p>{product.description}</p>
                        </div>

                        {/* Variant Selector - Structured Options */}
                        {hasStructuredOptions && product.options?.map((option: ProductOption) => (
                            <div key={option.title} className="mb-6 border-b border-stone-100 pb-6">
                                <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">
                                    {option.title}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {option.values.map((value: { value: string }) => {
                                        const isSelected = selectedOptions[option.title] === value.value;
                                        return (
                                            <button
                                                key={value.value}
                                                onClick={() => setSelectedOptions(prev => ({
                                                    ...prev,
                                                    [option.title]: value.value
                                                }))}
                                                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-all ${isSelected
                                                    ? 'border-stone-900 bg-stone-900 text-white'
                                                    : 'border-stone-200 text-stone-600 hover:border-stone-900'
                                                    }`}
                                                aria-label={`Select ${value.value} for ${option.title}`}
                                                aria-pressed={isSelected}
                                            >
                                                {value.value}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Variant Selector - Simple List */}
                        {!hasStructuredOptions && product.variants && product.variants.length > 1 && (
                            <div className="mb-8 border-b border-stone-100 pb-8 space-y-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">Select Option</p>
                                <div className="flex flex-wrap gap-3">
                                    {product.variants.map((v: ProductVariant) => {
                                        const isSelected = selectedVariant?.id === v.id;
                                        return (
                                            <button
                                                key={v.id}
                                                onClick={() => setSelectedVariantId(v.id)}
                                                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-all ${isSelected
                                                    ? 'border-stone-900 bg-stone-900 text-white'
                                                    : 'border-stone-200 text-stone-600 hover:border-stone-900'
                                                    }`}
                                                aria-label={`Select ${v.title}`}
                                                aria-pressed={isSelected}
                                            >
                                                {v.title}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Quantity & Add */}
                        <div className="space-y-6 mb-10">
                            <div className="flex items-center gap-2 text-red-700 text-xs font-medium animate-pulse">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                3 people are viewing this right now
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center border border-stone-200 w-32 justify-between px-4 py-3">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="text-stone-400 hover:text-stone-900"
                                        aria-label="Decrease quantity"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="font-medium text-stone-900" aria-live="polite">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="text-stone-400 hover:text-stone-900"
                                        aria-label="Increase quantity"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <button
                                    id="add-to-cart-btn"
                                    onClick={handleAddToCart}
                                    disabled={!selectedVariant || addedToCart}
                                    className={`flex-1 py-3.5 font-bold uppercase tracking-widest text-xs transition-colors ${addedToCart
                                        ? 'bg-green-600 text-white'
                                        : 'bg-stone-900 text-white hover:bg-stone-800'
                                        } disabled:opacity-70`}
                                >
                                    {addedToCart ? 'Added!' : 'Add to Cart'}
                                </button>
                            </div>

                            <div className="flex items-center justify-between text-xs text-stone-500 border-b border-stone-100 pb-6">
                                <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div> In Stock, Ready to Ship
                                </span>
                                <button
                                    onClick={() => setShowSizeGuide(true)}
                                    className="underline hover:text-stone-900 transition-colors cursor-pointer"
                                >
                                    Size Guide
                                </button>
                            </div>

                            <div className="bg-stone-50 p-4 text-xs space-y-2">
                                <p className="font-bold text-stone-900">Estimated Delivery</p>
                                <p className="text-stone-600">
                                    Order within <span className="font-medium text-stone-900">4 hrs 20 mins</span> to receive by{' '}
                                    <span className="font-medium text-stone-900">
                                        {deliveryDate}
                                    </span>.
                                </p>
                            </div>
                        </div>

                        {/* Accordions / Info */}
                        <div className="space-y-0 border-t border-stone-100">
                            <div className="py-4 border-b border-stone-100 flex gap-3 text-stone-600 text-sm">
                                <Truck size={18} />
                                <span>Free worldwide shipping on orders over $250</span>
                            </div>
                            <div className="py-4 border-b border-stone-100 flex gap-3 text-stone-600 text-sm">
                                <ShieldCheck size={18} />
                                <span>Authenticity Guarantee</span>
                            </div>
                            <div className="py-4 border-b border-stone-100 flex gap-3 text-stone-600 text-sm">
                                <RotateCcw size={18} />
                                <span>14-day complimentary returns</span>
                            </div>
                        </div>

                        <div className="mt-auto pt-8 text-xs text-stone-400 uppercase tracking-widest space-y-2">
                            <p>SKU: {selectedVariant?.sku || 'N/A'}</p>
                            <p>Material: {product.material || 'N/A'}</p>
                            <p>Origin: {product.origin_country || 'Imported'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <Reviews productId={product.id} />
            <SizeGuide isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} />
        </div>
    );
}
