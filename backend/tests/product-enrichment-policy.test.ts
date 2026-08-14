import { describe, expect, it } from 'vitest';
import { enrichProductDetails } from '../src/domain/products/product-enrichment-policy';

describe('enrichProductDetails', () => {
  it('preserves the enriched product response shape and fallback precedence', () => {
    const products = [{
      id: 'product-1',
      collection_id: null,
      images: [
        { id: 'image-1', alt_text: 'Original alt text', url: 'https://example.com/image.jpg' },
        { id: 'image-2', alt_text: 'Secondary image', url: 'https://example.com/second.jpg' },
      ],
      variants: [{ id: 'variant-1', title: 'Default Variant' }],
    }];

    const result = enrichProductDetails(products, {
      seoByProduct: new Map([['product-1', { seo_title: 'SEO title' }]]),
      discoveryByProduct: new Map([['product-1', { primary_keyword: 'kantha jacket' }]]),
      attributesByProduct: new Map([['product-1', [{ attribute_code: 'material', value_slug: 'cotton' }]]]),
      merchantByVariant: new Map([['variant-1', { item_group_id: 'product-1' }]]),
      mediaByImage: new Map([['image-1', { alt_text: 'SEO alt text', image_role: 'primary' }]]),
      artisanByProduct: new Map([['product-1', { name: 'Asha' }]]),
      collectionByProduct: new Map([['product-1', 'collection-1']]),
      relatedByProduct: new Map([['product-1', [{ id: 'product-2' }]]]),
    });

    expect(result).toEqual([{
      id: 'product-1',
      collection_id: 'collection-1',
      seo: { seo_title: 'SEO title' },
      discovery: { primary_keyword: 'kantha jacket' },
      attributes: [{ attribute_code: 'material', value_slug: 'cotton' }],
      media_seo: [{ alt_text: 'SEO alt text', image_role: 'primary' }],
      artisan: { name: 'Asha' },
      semantic_related_products: [{ id: 'product-2' }],
      images: [
        {
          id: 'image-1',
          alt_text: 'SEO alt text',
          url: 'https://example.com/image.jpg',
          media_seo: { alt_text: 'SEO alt text', image_role: 'primary' },
        },
        { id: 'image-2', alt_text: 'Secondary image', url: 'https://example.com/second.jpg' },
      ],
      variants: [{ id: 'variant-1', title: 'Default Variant', merchant: { item_group_id: 'product-1' } }],
    }]);
  });

  it('preserves explicit product collection and defaults missing enrichments', () => {
    const result = enrichProductDetails([{
      id: 'product-1',
      collection_id: 'explicit-collection',
    }], {
      seoByProduct: new Map(),
      discoveryByProduct: new Map(),
      attributesByProduct: new Map(),
      merchantByVariant: new Map(),
      mediaByImage: new Map(),
      artisanByProduct: new Map(),
      collectionByProduct: new Map([['product-1', 'fallback-collection']]),
      relatedByProduct: new Map(),
    });

    expect(result[0]).toMatchObject({
      collection_id: 'explicit-collection',
      seo: null,
      discovery: null,
      attributes: [],
      media_seo: [],
      artisan: null,
      semantic_related_products: [],
    });
  });
});
