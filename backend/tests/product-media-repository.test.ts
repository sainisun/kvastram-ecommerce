import { describe, expect, it } from 'vitest';
import { buildProductMediaSeoRows } from '../src/repositories/product-media-repository';

describe('buildProductMediaSeoRows', () => {
  it('preserves primary and gallery media SEO roles with fallback text', () => {
    expect(buildProductMediaSeoRows(
      { title: 'Cotton Tote', handle: 'cotton-tote' },
      [
        { id: 'image-1', metadata: { cloudinary_public_id: 'cdn/first' } },
        { id: 'image-2', alt_text: 'Side view' },
      ],
      'auto_sync_images'
    )).toEqual([
      {
        image_id: 'image-1',
        alt_text: 'Cotton Tote product image',
        cloudinary_public_id: 'cdn/first',
        image_role: 'primary',
        view_type: 'front',
        color: null,
        seo_filename: 'cotton-tote',
        metadata: { source: 'auto_sync_images' },
      },
      {
        image_id: 'image-2',
        alt_text: 'Side view',
        cloudinary_public_id: null,
        image_role: 'gallery',
        view_type: null,
        color: null,
        seo_filename: 'cotton-tote',
        metadata: { source: 'auto_sync_images' },
      },
    ]);
  });

  it('preserves generic fallback values when product fields are unavailable', () => {
    expect(buildProductMediaSeoRows(undefined, [{ id: 'image-1' }], 'auto_create_baseline')[0]).toMatchObject({
      alt_text: 'product product image',
      seo_filename: 'product',
      metadata: { source: 'auto_create_baseline' },
    });
  });
});
