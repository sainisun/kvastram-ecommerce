export type DefaultVariantSource = {
  sku?: string | null;
  handle?: string | null;
  inventory_quantity?: number | null;
  hs_code?: string | null;
  origin_country?: string | null;
  material?: string | null;
  weight?: number | null;
  length?: number | null;
  height?: number | null;
  width?: number | null;
};

export type ProductImageSource = {
  url?: string | null;
  alt_text?: string | null;
  position?: number | null;
  is_thumbnail?: boolean | null;
  metadata?: unknown;
};

export function compactUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

export function buildDefaultVariantInput(productId: string, data: DefaultVariantSource) {
  return {
    product_id: productId,
    title: 'Default Variant',
    sku: data.sku || `${data.handle}-default`,
    inventory_quantity: data.inventory_quantity || 0,
    manage_inventory: true,
    hs_code: data.hs_code,
    origin_country: data.origin_country,
    material: data.material,
    weight: data.weight,
    length: data.length,
    height: data.height,
    width: data.width,
  };
}

export function buildProductImageInputs(productId: string, images: ProductImageSource[] | undefined) {
  return (images || [])
    .filter((image) => image.url)
    .map((image) => ({
      product_id: productId,
      url: image.url as string,
      alt_text: image.alt_text,
      position: image.position ?? 0,
      is_thumbnail: image.is_thumbnail ?? false,
      metadata: image.metadata ?? null,
    }));
}
