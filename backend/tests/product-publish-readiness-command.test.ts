import { describe, expect, it } from 'vitest';
import {
  getProductPublishReadinessIssues,
  type ProductPublishReadinessSnapshot,
} from '../src/application/products/product-publish-readiness-command';

const readySnapshot: ProductPublishReadinessSnapshot = {
  product: {
    title: 'Handwoven Kantha Jacket',
    handle: 'handwoven-kantha-jacket',
    thumbnail: 'https://example.com/jacket.jpg',
    collection_id: null,
    price_type: 'fixed',
    material: 'Cotton',
    seo_title: 'Handwoven Kantha Jacket',
    seo_description: 'A handwoven jacket.',
  },
  seo: null,
  imageCount: 1,
  categoryCount: 1,
  attributeCount: 1,
  prices: [{ amount: 249900 }],
};

const getNewProductIssues = () => [];

describe('getProductPublishReadinessIssues', () => {
  it('accepts a previously complete product when publishing an update', async () => {
    await expect(
      getProductPublishReadinessIssues('product-1', { status: 'published' }, {
        loadSnapshot: async () => readySnapshot,
        getNewProductIssues,
      }),
    ).resolves.toEqual([]);
  });

  it('preserves the legacy update validation failures and messages', async () => {
    const snapshot: ProductPublishReadinessSnapshot = {
      ...readySnapshot,
      product: {
        ...readySnapshot.product!,
        handle: null,
        thumbnail: null,
        collection_id: null,
        price_type: 'on_request',
        material: null,
        seo_title: null,
        seo_description: null,
      },
      imageCount: 0,
      categoryCount: 0,
      attributeCount: 0,
      prices: [],
    };

    await expect(
      getProductPublishReadinessIssues('product-2', { status: 'published' }, {
        loadSnapshot: async () => snapshot,
        getNewProductIssues: () => [{ field: 'title', message: 'placeholder title' }],
      }),
    ).resolves.toEqual([
      { field: 'title', message: 'Published products need a title.' },
      { field: 'handle', message: 'Published products need an editable URL slug.' },
      { field: 'prices', message: 'Published products need fixed pricing with at least one positive price.' },
      { field: 'images', message: 'Published products need at least one product image.' },
      { field: 'category_ids', message: 'Published products need at least one category or collection.' },
      { field: 'attributes', message: 'Published products need at least one structured attribute or legacy material.' },
      { field: 'seo_title', message: 'Published products need an SEO title.' },
      { field: 'seo_description', message: 'Published products need a meta description.' },
    ]);
  });

  it('retains the product-not-found error contract', async () => {
    await expect(
      getProductPublishReadinessIssues('missing-product', { status: 'published' }, {
        loadSnapshot: async () => ({
          ...readySnapshot,
          product: null,
        }),
        getNewProductIssues,
      }),
    ).rejects.toThrow('Product with id missing-product not found');
  });
});
