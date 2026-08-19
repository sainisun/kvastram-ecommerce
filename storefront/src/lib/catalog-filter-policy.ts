export const CATALOG_FILTER_QUERY_KEYS = [
  'category_id',
  'tag_id',
  'collection_id',
  'attribute_code',
  'attribute_value',
  'min_price',
  'max_price',
  'page',
] as const;

type CatalogFilterValues = {
  category_id?: string;
  tag_id?: string;
  collection_id?: string;
  attribute_code?: string;
  attribute_value?: string;
  min_price?: string;
  max_price?: string;
};

export function applyCatalogFilterQuery(
  params: URLSearchParams,
  filters: CatalogFilterValues,
): URLSearchParams {
  CATALOG_FILTER_QUERY_KEYS.forEach((key) => params.delete(key));

  Object.entries(filters).forEach(([key, value]) => {
    if (value?.trim()) params.set(key, value.trim());
  });

  return params;
}

export function clearCatalogFilterQuery(
  params: URLSearchParams,
  keys: readonly string[] = CATALOG_FILTER_QUERY_KEYS,
): URLSearchParams {
  keys.forEach((key) => params.delete(key));
  return params;
}

export function formatCatalogPriceFilter(minPrice?: string | null, maxPrice?: string | null): string | null {
  const min = minPrice ? `₹${Math.round(Number(minPrice) / 100).toLocaleString('en-IN')}+` : null;
  const max = maxPrice ? `up to ₹${Math.round(Number(maxPrice) / 100).toLocaleString('en-IN')}` : null;
  const value = [min, max].filter(Boolean).join(' · ');
  return value || null;
}
