export type ProductListVariantStats = {
  product_id: string;
  variant_count: number;
  total_inventory: number;
};

export type ProductListImage = { product_id: string };

export type ProductListVariant = {
  id: string;
  title: string;
  sku: string | null;
  inventory_quantity: number;
  prices: Array<{ id: string; amount: number; currency_code: string }>;
};

export type ProductListAssemblySource = {
  id: unknown;
  title: unknown;
  handle: unknown;
  description: string | null;
  collection_id: string | null;
  size_guide: string | null;
  care_instructions: string | null;
  price_type: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: unknown;
  thumbnail: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

export type ProductListAssemblyResult<TImage extends ProductListImage, TVariant extends ProductListVariant> = {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  collection_id: string | null;
  size_guide: string | null;
  care_instructions: string | null;
  price_type: string;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  thumbnail: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  variant_count: number;
  total_inventory: number;
  images: TImage[];
  variants: TVariant[];
};

/**
 * Preserves the legacy product-list detail assembly after the query service has
 * loaded products, aggregate variant statistics, images, and detailed variants.
 */
export function assembleProductListDetails<
  TProduct extends ProductListAssemblySource,
  TImage extends ProductListImage,
  TVariant extends ProductListVariant,
>(
  products: TProduct[],
  variantStats: ProductListVariantStats[],
  images: TImage[],
  variantsByProduct: Record<string, TVariant[]> = {},
): Array<ProductListAssemblyResult<TImage, TVariant>> {
  return products.map((product) => {
    const productId = String(product.id);
    const stats = variantStats.find((variant) => variant.product_id === productId);
    return {
      id: productId,
      title: String(product.title),
      handle: String(product.handle),
      description: product.description,
      collection_id: product.collection_id,
      size_guide: product.size_guide,
      care_instructions: product.care_instructions,
      price_type: product.price_type || 'fixed',
      seo_title: product.seo_title,
      seo_description: product.seo_description,
      status: String(product.status),
      thumbnail: product.thumbnail,
      created_at: product.created_at,
      updated_at: product.updated_at,
      variant_count: stats?.variant_count || 0,
      total_inventory: stats?.total_inventory || 0,
      images: images.filter((image) => image.product_id === productId),
      variants: variantsByProduct[productId] || [],
    };
  });
}
