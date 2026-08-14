import { describe, expect, it } from 'vitest';
import { buildDiscoveryBaselineMetadata } from '../src/repositories/product-discovery-baseline-repository';

describe('buildDiscoveryBaselineMetadata', () => {
  it('builds stable SEO and discovery metadata for a product baseline', () => {
    const metadata = buildDiscoveryBaselineMetadata(
      { id: 'product-1', title: 'Cotton Tote', handle: 'cotton-tote', status: 'published' },
      { title: 'Cotton Tote', material: 'Cotton', subtitle: 'Handcrafted carry bag', description: 'A practical daily tote.' }
    );

    expect(metadata.seoTitle).toContain('Cotton Tote');
    expect(metadata.metaDescription).toContain('Cotton Tote');
    expect(metadata.document).toContain('Cotton Tote');
    expect(metadata.documentHash).toHaveLength(64);
  });

  it('falls back to the product id when the discovery document is empty', () => {
    const metadata = buildDiscoveryBaselineMetadata(
      { id: 'product-empty', handle: 'empty', status: 'draft' },
      { title: '' }
    );
    expect(metadata.documentHash).toHaveLength(64);
    expect(metadata.documentHash).not.toBe('');
  });
});
