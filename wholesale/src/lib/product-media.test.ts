import { describe, expect, it } from 'vitest';
import { optimizeCloudinaryUrl, isCloudinaryUrl, cloudinaryImageLoader } from './media';
import { getProductDisplayTitle } from './product-title';

describe('wholesale product title utility', () => {
  it('removes marketing descriptors and keeps the canonical title segment', () => {
    expect(getProductDisplayTitle('Handcrafted Odhvica Silk Saree | Blue')).toBe('Silk Saree');
  });

  it('returns an empty string for missing titles and preserves a trimmed fallback', () => {
    expect(getProductDisplayTitle(undefined)).toBe('');
    expect(getProductDisplayTitle('   Artisan   ')).toBe('Artisan');
  });
});

describe('wholesale Cloudinary media utility', () => {
  const cloudinaryUrl = 'https://res.cloudinary.com/odhvica/image/upload/sample.heic';

  it('accepts only HTTPS Cloudinary URLs', () => {
    expect(isCloudinaryUrl(cloudinaryUrl)).toBe(true);
    expect(isCloudinaryUrl('http://res.cloudinary.com/odhvica/image/upload/sample.jpg')).toBe(false);
    expect(isCloudinaryUrl('https://example.com/sample.jpg')).toBe(false);
    expect(isCloudinaryUrl(null)).toBe(false);
  });

  it('normalizes SEO-safe extensions and adds automatic delivery transforms', () => {
    expect(optimizeCloudinaryUrl(cloudinaryUrl)).toBe(
      'https://res.cloudinary.com/odhvica/image/upload/f_auto,q_auto/sample.jpg'
    );
    expect(cloudinaryImageLoader({ src: cloudinaryUrl, width: 640 })).toBe(
      'https://res.cloudinary.com/odhvica/image/upload/f_auto,q_auto,w_640,c_limit/sample.jpg'
    );
  });

  it('leaves non-Cloudinary sources unchanged', () => {
    const source = '/images/fallback.jpg';
    expect(optimizeCloudinaryUrl(source)).toBe(source);
    expect(cloudinaryImageLoader({ src: source, width: 640 })).toBe(source);
  });
});
