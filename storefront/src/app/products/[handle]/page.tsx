import { api } from '@/lib/api';
import { notFound } from 'next/navigation';
import ProductView from '@/components/product/ProductView';
import { RecentlyViewedSection as RecentlyViewed } from '@/components/product/RecentlyViewed';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import ProductGrid from '@/components/ProductGrid';
import { Product } from '@/types/backend';

type Props = {
    params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { handle } = await params;
    try {
        const product = await api.getProduct(handle);
        if (!product || !product.title) return { title: 'Product Not Found' };

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            description: product.description,
            image: product.thumbnail ? [product.thumbnail] : [],
            sku: product.variants?.[0]?.sku,
            brand: {
                '@type': 'Brand',
                name: 'Kvastram'
            },
            offers: {
                '@type': 'Offer',
                url: `${process.env.NEXT_PUBLIC_STORE_URL}/products/${handle}`,
                priceCurrency: product.variants?.[0]?.prices?.[0]?.currency_code?.toUpperCase() || 'USD',
                price: (product.variants?.[0]?.prices?.[0]?.amount || 0) / 100,
                availability: (product.variants?.[0]?.inventory_quantity || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
            }
        };

        const breadcrumbJsonLd = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": process.env.NEXT_PUBLIC_STORE_URL
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Products",
                    "item": `${process.env.NEXT_PUBLIC_STORE_URL}/products`
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": product.title,
                    "item": `${process.env.NEXT_PUBLIC_STORE_URL}/products/${handle}`
                }
            ]
        };

        return {
            title: `${product.title} | Kvastram`,
            description: product.description,
            openGraph: {
                images: product.thumbnail ? [product.thumbnail] : [],
            },
            other: {
                'script:ld+json': JSON.stringify([jsonLd, breadcrumbJsonLd]),
            },
        };
    } catch (_e) {
        return {
            title: 'Product Not Found',
        };
    }
}

export default async function ProductPage({ params }: Props) {
    const { handle } = await params;
    let product;
    try {
        product = await api.getProduct(handle);
        if (!product || !product.id) notFound();
    } catch (_e) {
        notFound();
    }

    // JSON-LD for Product
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.description,
        image: product.thumbnail ? [product.thumbnail] : [],
        sku: product.variants?.[0]?.sku,
        brand: {
            '@type': 'Brand',
            name: 'Kvastram'
        },
        offers: {
            '@type': 'Offer',
            url: `${process.env.NEXT_PUBLIC_STORE_URL}/products/${handle}`,
            priceCurrency: product.variants?.[0]?.prices?.[0]?.currency_code?.toUpperCase() || 'USD',
            price: (product.variants?.[0]?.prices?.[0]?.amount || 0) / 100,
            availability: (product.variants?.[0]?.inventory_quantity || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
        }
    };

    // BreadcrumbList JSON-LD
    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": process.env.NEXT_PUBLIC_STORE_URL
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Products",
                "item": `${process.env.NEXT_PUBLIC_STORE_URL}/products`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": product.title,
                "item": `${process.env.NEXT_PUBLIC_STORE_URL}/products/${handle}`
            }
        ]
    };

    return (
        <>
            <ProductView product={product} />

            {/* Related Products */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-stone-100">
                <h2 className="text-2xl font-serif text-stone-900 mb-8 text-center">You May Also Like</h2>
                <Suspense fallback={<div>Loading...</div>}>
                    <RelatedProducts categoryIds={product.categories?.map((c: { category_id: string }) => c.category_id) || []} currentId={product.id} />
                </Suspense>
            </div>

            {/* Recently Viewed */}
            <RecentlyViewed />
        </>
    );
}


async function RelatedProducts({ categoryIds, currentId }: { categoryIds: string[], currentId: string }) {
    if (categoryIds.length === 0) return null;

    // Fetch related products based on first category for now
    // In future, can improve algorithm
    const data = await api.getProducts({
        category_id: categoryIds[0],
        limit: 5 // Fetch 5 to have buffer if we filter one out, though backend pagination might return exact limit
    });

    const related = (data.products || [])
        .filter((p: Product) => p.id !== currentId)
        .slice(0, 4);

    if (related.length === 0) return null;

    return <ProductGrid initialProducts={related} />;
}
