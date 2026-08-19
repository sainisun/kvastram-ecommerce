import { describe, expect, it } from 'vitest';

import { sanitizeProductRichText } from '@/lib/sanitize-product-rich-text';

describe('sanitizeProductRichText', () => {
  it('preserves supported formatting while removing executable markup', () => {
    const result = sanitizeProductRichText(
      '<p>Handwoven <strong>cotton</strong></p><script>alert(1)</script><img src=x onerror=alert(2) />'
    );

    expect(result).toContain('<p>Handwoven <strong>cotton</strong></p>');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('<img');
  });

  it('allows safe links and removes unsafe protocols', () => {
    const result = sanitizeProductRichText(
      '<a href="https://odhvica.com/care">Care guide</a><a href="javascript:alert(1)">Unsafe</a>'
    );

    expect(result).toContain('href="https://odhvica.com/care"');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="nofollow noopener noreferrer"');
    expect(result).not.toContain('javascript:');
  });

  it('drops dangerous attributes, embeds, and data URLs', () => {
    const result = sanitizeProductRichText(
      '<p style="color:red" onclick="alert(1)">Text</p><iframe src="https://evil.example"></iframe><a href="data:text/html,attack">Data</a>'
    );

    expect(result).toContain('<p>Text</p>');
    expect(result).not.toContain('style=');
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('data:text/html');
  });

  it('returns an empty string for empty content', () => {
    expect(sanitizeProductRichText(undefined)).toBe('');
    expect(sanitizeProductRichText(null)).toBe('');
    expect(sanitizeProductRichText('')).toBe('');
  });
});
