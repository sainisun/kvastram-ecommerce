export type ProductSearchPrice = { amount: number | null | undefined };
export type ProductSearchVariant = { prices?: ProductSearchPrice[] | null };
export type ProductSearchCandidate = {
  variants?: ProductSearchVariant[] | null;
  created_at?: Date | string | null;
};

export type ProductSearchSort = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | undefined;

export type PricedProductSearchCandidate<T extends ProductSearchCandidate> = T & { price: number };

export function getProductMinimumSearchPrice(product: ProductSearchCandidate): number {
  const prices = product.variants?.flatMap((variant) => variant.prices?.map((price) => price.amount) || []) || [];
  return prices.length > 0 ? Math.min(...prices.map((price) => Number(price))) : 0;
}

/**
 * Applies the legacy in-memory product-search price range and sort behavior.
 * The database query has already applied text and taxonomy conditions.
 */
export function selectProductSearchResults<T extends ProductSearchCandidate>(
  products: T[],
  options: { minPrice?: number; maxPrice?: number; sortBy?: ProductSearchSort },
): PricedProductSearchCandidate<T>[] {
  let results = products.map((product) => ({
    ...product,
    price: getProductMinimumSearchPrice(product),
  }));

  if (options.minPrice !== undefined) {
    results = results.filter((product) => product.price >= options.minPrice!);
  }
  if (options.maxPrice !== undefined) {
    results = results.filter((product) => product.price <= options.maxPrice!);
  }

  if (options.sortBy === 'price_asc') {
    results.sort((left, right) => left.price - right.price);
  } else if (options.sortBy === 'price_desc') {
    results.sort((left, right) => right.price - left.price);
  } else if (options.sortBy === 'newest') {
    results.sort(
      (left, right) =>
        new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime(),
    );
  }

  return results;
}
