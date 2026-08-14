import { describe, expect, it } from 'vitest';
import { collectCatalogReferenceIssues } from '../src/repositories/product-catalog-reference-repository';

describe('collectCatalogReferenceIssues', () => {
  it('preserves precise missing reference diagnostics', () => {
    expect(collectCatalogReferenceIssues(
      ['category-1', 'category-missing'],
      ['category-1'],
      ['tag-missing'],
      [],
      'collection-missing',
      false
    )).toEqual([
      { field: 'category_ids', message: 'Categories not found: category-missing' },
      { field: 'tag_ids', message: 'Tags not found: tag-missing' },
      { field: 'collection_id', message: 'Collection not found: collection-missing' },
    ]);
  });

  it('returns no errors when all requested references exist or are absent', () => {
    expect(collectCatalogReferenceIssues(['category-1'], ['category-1'], ['tag-1'], ['tag-1'], 'collection-1', true)).toEqual([]);
    expect(collectCatalogReferenceIssues(undefined, [], undefined, [], undefined, false)).toEqual([]);
  });
});
