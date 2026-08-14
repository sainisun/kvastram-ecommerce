import { describe, expect, it } from 'vitest';
import {
  rankSemanticRelatedProductIds,
  selectRankedSemanticCandidates,
} from '../src/domain/products/product-semantic-related-policy';

describe('product semantic related policy', () => {
  it('aggregates value and raw matches before applying the eight-candidate query cap', () => {
    const valueMatches = Array.from({ length: 9 }, (_, index) => ({
      product_id: `product-${index + 1}`,
      matches: index + 1,
    }));
    const rawMatches = [
      { product_id: 'product-1', matches: 12 },
      { product_id: 'product-4', matches: 2 },
    ];

    expect(rankSemanticRelatedProductIds(valueMatches, rawMatches)).toEqual([
      'product-1',
      'product-9',
      'product-8',
      'product-7',
      'product-4',
      'product-6',
      'product-5',
      'product-3',
    ]);
  });

  it('restores score order after database filtering and applies the four-product storefront cap', () => {
    const candidates = [
      { id: 'product-2', title: 'Second' },
      { id: 'product-4', title: 'Fourth' },
      { id: 'product-5', title: 'Fifth' },
      { id: 'product-6', title: 'Sixth' },
      { id: 'product-7', title: 'Seventh' },
    ];

    expect(selectRankedSemanticCandidates(
      ['product-1', 'product-2', 'product-3', 'product-4', 'product-5', 'product-6', 'product-7'],
      candidates,
    ).map((candidate) => candidate.id)).toEqual([
      'product-2', 'product-4', 'product-5', 'product-6',
    ]);
  });
});
