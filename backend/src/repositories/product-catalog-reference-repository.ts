import { eq, inArray } from 'drizzle-orm';
import {
  categories,
  collection_products,
  product_categories,
  product_collections,
  product_tags,
  tags,
} from '../db/schema';

export type CatalogReferenceIssue = {
  field: 'category_ids' | 'tag_ids' | 'collection_id';
  message: string;
};

export function collectCatalogReferenceIssues(
  categoryIds: string[] | undefined,
  existingCategoryIds: string[],
  tagIds: string[] | undefined,
  existingTagIds: string[],
  collectionId: string | null | undefined,
  collectionExists: boolean
): CatalogReferenceIssue[] {
  const issues: CatalogReferenceIssue[] = [];
  const categorySet = new Set(existingCategoryIds);
  const missingCategories = (categoryIds || []).filter((id) => !categorySet.has(id));
  if (missingCategories.length > 0) issues.push({ field: 'category_ids', message: `Categories not found: ${missingCategories.join(', ')}` });

  const tagSet = new Set(existingTagIds);
  const missingTags = (tagIds || []).filter((id) => !tagSet.has(id));
  if (missingTags.length > 0) issues.push({ field: 'tag_ids', message: `Tags not found: ${missingTags.join(', ')}` });

  if (collectionId && !collectionExists) issues.push({ field: 'collection_id', message: `Collection not found: ${collectionId}` });
  return issues;
}

export class ProductCatalogReferenceRepository {
  async validate(tx: any, categoryIds: string[] | undefined, tagIds: string[] | undefined, collectionId?: string | null) {
    if (!categoryIds && !tagIds && !collectionId) return [];
    const [existingCategories, existingTags, existingCollections] = await Promise.all([
      categoryIds?.length ? tx.select({ id: categories.id }).from(categories).where(inArray(categories.id, categoryIds)) : [],
      tagIds?.length ? tx.select({ id: tags.id }).from(tags).where(inArray(tags.id, tagIds)) : [],
      collectionId ? tx.select({ id: product_collections.id }).from(product_collections).where(eq(product_collections.id, collectionId)) : [],
    ]);
    return collectCatalogReferenceIssues(
      categoryIds,
      existingCategories.map((row: { id: string }) => row.id),
      tagIds,
      existingTags.map((row: { id: string }) => row.id),
      collectionId,
      existingCollections.length > 0
    );
  }

  async assign(tx: any, productId: string, categoryIds: string[] | undefined, tagIds: string[] | undefined, collectionId: string | null | undefined) {
    if (categoryIds?.length) await tx.insert(product_categories).values(categoryIds.map((categoryId) => ({ product_id: productId, category_id: categoryId })));
    if (tagIds?.length) await tx.insert(product_tags).values(tagIds.map((tagId) => ({ product_id: productId, tag_id: tagId })));
    if (collectionId) await tx.insert(collection_products).values({ product_id: productId, collection_id: collectionId, position: 0 }).onConflictDoNothing();
  }

  async replaceCategories(tx: any, productId: string, categoryIds: string[]) {
    await tx.delete(product_categories).where(eq(product_categories.product_id, productId));
    if (categoryIds.length) await tx.insert(product_categories).values(categoryIds.map((categoryId) => ({ product_id: productId, category_id: categoryId })));
  }

  async replaceTags(tx: any, productId: string, tagIds: string[]) {
    await tx.delete(product_tags).where(eq(product_tags.product_id, productId));
    if (tagIds.length) await tx.insert(product_tags).values(tagIds.map((tagId) => ({ product_id: productId, tag_id: tagId })));
  }

  async replaceCollection(tx: any, productId: string, collectionId: string | null | undefined) {
    await tx.delete(collection_products).where(eq(collection_products.product_id, productId));
    if (collectionId) await tx.insert(collection_products).values({ product_id: productId, collection_id: collectionId, position: 0 }).onConflictDoNothing();
  }
}

export const productCatalogReferenceRepository = new ProductCatalogReferenceRepository();
