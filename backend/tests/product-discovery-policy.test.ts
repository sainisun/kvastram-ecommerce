import { describe, expect, it } from 'vitest';
import {
  buildProductDiscoveryDocument,
  buildProductMetaDescription,
  buildProductSeoTitle,
  inferProductAttributeSlugs,
  inferProductSearchIntents,
  inferProductSemanticEntities,
} from '../src/domain/products/product-discovery-policy';

const product = {
  title: 'Jaipur Block Print Cotton Tote Bag',
  subtitle: 'Handmade travel pouch gift',
  description: 'A floral blue cotton tote made by Jaipur artisans.',
  handle: 'jaipur-block-print-tote',
  material: 'Cotton',
  origin_country: 'IN',
};

describe('product discovery policy', () => {
  it('preserves branded SEO and fallback metadata behavior', () => {
    expect(buildProductSeoTitle(product)).toBe('Jaipur Block Print Cotton Tote Bag | Odhvica');
    expect(buildProductSeoTitle({ title: 'Odhvica Cotton Pouch' })).toBe('Odhvica Cotton Pouch');
    expect(buildProductMetaDescription({ ...product, seo_description: '  Explicit product metadata  ' })).toBe('Explicit product metadata');
  });

  it('derives normalized discovery content and matching attribute rules', () => {
    expect(buildProductDiscoveryDocument(product)).toContain('India Jaipur artisan handmade slow fashion');
    const attributes = inferProductAttributeSlugs(product).map(({ attribute, slug }) => `${attribute}:${slug}`);
    expect(attributes).toEqual(expect.arrayContaining([
      'fabric:cotton',
      'technique:block-print',
      'style:tote-bag',
      'pattern:floral',
      'color:blue',
      'region:jaipur',
    ]));
  });

  it('derives stable semantic entities and customer search intents', () => {
    expect(inferProductSemanticEntities(product)).toEqual(expect.arrayContaining(['Odhvica', 'Jaipur', 'block print', 'cotton']));
    expect(inferProductSearchIntents(product)).toEqual(expect.arrayContaining(['buy', 'gift', 'travel']));
  });
});
