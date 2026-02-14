import CatalogClient from '@/components/products/CatalogClient';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function CatalogPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const category_id = params.category_id as string;
    const tag_id = params.tag_id as string;
    const sort = params.sort as string;

    const [productsData, categoriesData, tagsData] = await Promise.all([
        api.getProducts({
            limit: 50,
            category_id,
            tag_id,
            sort
        }),
        api.getCategories(),
        api.getTags()
    ]);

    const products = productsData.products || [];
    const categories = categoriesData.categories || [];
    const tags = tagsData.tags || [];

    return <CatalogClient initialProducts={products} categories={categories} tags={tags} />;
}
