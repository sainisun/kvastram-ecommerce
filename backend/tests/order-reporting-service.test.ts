import { describe, expect, it } from 'vitest';
import { escapeOrderExportSearch } from '../src/services/order-reporting-service';

describe('escapeOrderExportSearch', () => {
  it('preserves legacy escaping for SQL LIKE wildcard characters', () => {
    expect(escapeOrderExportSearch('ORD_100%')).toBe('ORD\\_100\\%');
  });

  it('leaves ordinary search text unchanged', () => {
    expect(escapeOrderExportSearch('customer@example.com')).toBe('customer@example.com');
  });
});
