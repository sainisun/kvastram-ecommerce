export type ProductCreationInput = {
  prices?: unknown;
  options?: unknown;
  images?: unknown;
  category_ids?: string[];
  tag_ids?: string[];
  inventory_quantity?: unknown;
  sku?: unknown;
  collection_id?: string | null;
};

export type ProductCreationDependencies<TInput extends ProductCreationInput, TProduct extends { id: string }, TVariant extends { id: string }, TImage> = {
  validateReferences(categoryIds: string[] | undefined, tagIds: string[] | undefined, collectionId: string | null | undefined): Promise<Array<{ field: string; message: string }>>;
  createBase(productData: Record<string, unknown>): Promise<TProduct>;
  createDefaultVariant(productId: string, data: TInput): Promise<TVariant>;
  assignPrices(variantId: string, prices: TInput['prices']): Promise<void>;
  assignOptions(productId: string, options: TInput['options']): Promise<void>;
  assignImages(productId: string, images: TInput['images']): Promise<TImage[]>;
  assignReferences(productId: string, categoryIds: string[] | undefined, tagIds: string[] | undefined, collectionId: string | null | undefined): Promise<void>;
  persistDiscoveryBaseline(product: TProduct, variant: TVariant, images: TImage[], data: TInput): Promise<void>;
};

export type ProductCreationOutcome<TProduct extends { id: string }> =
  | { kind: 'invalid_catalog_references'; errors: Array<{ field: string; message: string }> }
  | { kind: 'created'; product: TProduct & { default_variant_id: string } };

/**
 * Coordinates the established product-create persistence order through injected ports.
 * The transaction is owned by the caller so that database infrastructure remains outside
 * the application layer.
 */
export async function createProductCommand<
  TInput extends ProductCreationInput,
  TProduct extends { id: string },
  TVariant extends { id: string },
  TImage,
>(
  data: TInput,
  dependencies: ProductCreationDependencies<TInput, TProduct, TVariant, TImage>,
): Promise<ProductCreationOutcome<TProduct>> {
  const {
    prices,
    options,
    images,
    category_ids,
    tag_ids,
    inventory_quantity,
    sku,
    ...productData
  } = data;

  const errors = await dependencies.validateReferences(category_ids, tag_ids, productData.collection_id);
  if (errors.length > 0) return { kind: 'invalid_catalog_references', errors };

  const product = await dependencies.createBase(productData);
  const variant = await dependencies.createDefaultVariant(product.id, data);
  await dependencies.assignPrices(variant.id, prices);
  await dependencies.assignOptions(product.id, options);
  const createdImages = await dependencies.assignImages(product.id, images);
  await dependencies.assignReferences(product.id, category_ids, tag_ids, productData.collection_id);
  await dependencies.persistDiscoveryBaseline(product, variant, createdImages, data);

  return {
    kind: 'created',
    product: { ...product, default_variant_id: variant.id },
  };
}
