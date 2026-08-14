export type ProductEnrichmentImage = {
  id: string;
  alt_text?: string | null;
  [key: string]: unknown;
};

export type ProductEnrichmentVariant = {
  id: string;
  [key: string]: unknown;
};

export type ProductEnrichmentBase = {
  id: string;
  collection_id?: string | null;
  images?: ProductEnrichmentImage[];
  variants?: ProductEnrichmentVariant[];
};

export type ProductEnrichmentIndexes = {
  seoByProduct: ReadonlyMap<string, unknown>;
  discoveryByProduct: ReadonlyMap<string, unknown>;
  attributesByProduct: ReadonlyMap<string, unknown[]>;
  merchantByVariant: ReadonlyMap<string, unknown>;
  mediaByImage: ReadonlyMap<string, { alt_text?: string | null; [key: string]: unknown }>;
  artisanByProduct: ReadonlyMap<string, unknown>;
  collectionByProduct: ReadonlyMap<string, string>;
  relatedByProduct: ReadonlyMap<string, unknown[]>;
};

/**
 * Preserves the legacy enriched product response shape after related persistence
 * records have been loaded and indexed by the query service.
 */
export function enrichProductDetails<T extends ProductEnrichmentBase>(
  products: T[],
  indexes: ProductEnrichmentIndexes,
): T[] {
  return products.map((product) => ({
    ...product,
    collection_id: product.collection_id || indexes.collectionByProduct.get(product.id) || null,
    seo: indexes.seoByProduct.get(product.id) || null,
    discovery: indexes.discoveryByProduct.get(product.id) || null,
    attributes: indexes.attributesByProduct.get(product.id) || [],
    media_seo: product.images?.map((image) => indexes.mediaByImage.get(image.id)).filter(Boolean) || [],
    artisan: indexes.artisanByProduct.get(product.id) || null,
    semantic_related_products: indexes.relatedByProduct.get(product.id) || [],
    images: product.images?.map((image) => {
      const mediaSeo = indexes.mediaByImage.get(image.id);
      return mediaSeo
        ? {
            ...image,
            alt_text: mediaSeo.alt_text || image.alt_text,
            media_seo: mediaSeo,
          }
        : image;
    }),
    variants: product.variants?.map((variant) => ({
      ...variant,
      merchant: indexes.merchantByVariant.get(variant.id) || null,
    })),
  })) as T[];
}
