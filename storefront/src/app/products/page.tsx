import CatalogClient from '@/components/products/CatalogClient';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function CatalogPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const category_id = searchParams.category_id as string;
    const tag_id = searchParams.tag_id as string;
    const sort = searchParams.sort as string;

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
