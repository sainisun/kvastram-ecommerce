export type ProductUpdateCommandInput = {
  category_ids?: string[];
  tag_ids?: string[];
  collection_id?: string | null;
  prices?: unknown;
  images?: unknown;
};

export type ProductUpdateCommandDependencies<TInput extends ProductUpdateCommandInput, TProduct> = {
  validateReferences(categoryIds: string[] | undefined, tagIds: string[] | undefined, collectionId: string | null | undefined): Promise<Array<{ field: string; message: string }>>;
  updateBase(data: TInput): Promise<TProduct | null>;
  updateDefaultVariant(data: TInput): Promise<string | null>;
  replacePrices(variantId: string, prices: TInput['prices']): Promise<void>;
  replaceImages(images: TInput['images']): Promise<void>;
  replaceCategories(categoryIds: string[]): Promise<void>;
  replaceTags(tagIds: string[]): Promise<void>;
  replaceCollection(collectionId: string | null): Promise<void>;
};

export type ProductUpdateOutcome<TProduct> =
  | { kind: 'invalid_catalog_references'; errors: Array<{ field: string; message: string }> }
  | { kind: 'product_not_found' }
  | { kind: 'updated'; product: TProduct };

/**
 * Coordinates the legacy product-update persistence order through injected ports.
 * Transaction ownership and post-commit side effects deliberately remain with the caller.
 */
export async function updateProductCommand<TInput extends ProductUpdateCommandInput, TProduct>(
  data: TInput,
  dependencies: ProductUpdateCommandDependencies<TInput, TProduct>,
): Promise<ProductUpdateOutcome<TProduct>> {
  const referenceErrors = await dependencies.validateReferences(data.category_ids, data.tag_ids, data.collection_id);
  if (referenceErrors.length > 0) {
    return { kind: 'invalid_catalog_references', errors: referenceErrors };
  }

  const product = await dependencies.updateBase(data);
  if (!product) return { kind: 'product_not_found' };

  const defaultVariantId = await dependencies.updateDefaultVariant(data);
  if (defaultVariantId && data.prices) {
    await dependencies.replacePrices(defaultVariantId, data.prices);
  }
  if (data.images) {
    await dependencies.replaceImages(data.images);
  }
  if (data.category_ids) {
    await dependencies.replaceCategories(data.category_ids);
  }
  if (data.tag_ids) {
    await dependencies.replaceTags(data.tag_ids);
  }
  if (data.collection_id !== undefined) {
    await dependencies.replaceCollection(data.collection_id);
  }

  return { kind: 'updated', product };
}
