import { describe, expect, it } from 'vitest';
import { calculateFulfillmentMetrics } from '../src/domain/orders/fulfillment-metrics-policy';

const now = new Date('2026-08-14T12:00:00.000Z');

const dependencies = {
  resolveWorkflowStatus: (order: Record<string, any>) => String(order.status),
  getWorkflowMetadata: (metadata: unknown) => (metadata || {}) as Record<string, any>,
  buildWorkflowSummary: (order: Record<string, any>) => ({
    has_tracking: Boolean(order.tracking_number),
    primary_package: null,
    packages: [],
  }),
  now,
};

describe('calculateFulfillmentMetrics', () => {
  it('calculates ship-by, tracking, packaging, and follow-up alerts deterministically', () => {
    const result = calculateFulfillmentMetrics(
      [
        {
          id: 'processing-1',
          status: 'processing',
          created_at: '2026-08-13T12:00:00.000Z',
          metadata: {
            ship_by_date: '2026-08-14T17:00:00.000Z',
            packaging_checklist: { product_quality_checked: true },
          },
        },
        {
          id: 'shipped-1',
          status: 'shipped',
          created_at: '2026-08-01T12:00:00.000Z',
          metadata: { ship_by_date: '2026-08-13T12:00:00.000Z', shipped_at: '2026-08-02T12:00:00.000Z' },
        },
        { id: 'delivered-1', status: 'delivered', metadata: {} },
      ],
      dependencies
    );

    expect(result.due_today).toBe(1);
    expect(result.missing_tracking).toBe(2);
    expect(result.packaging_incomplete).toBe(1);
    expect(result.delivered_awaiting_followup).toBe(1);
    expect(result.overdue).toBe(0);
    expect(result.delayed_orders).toBe(1);
    expect(result.tracking_coverage_percent).toBe(0);
    expect(result.alerts.map((alert) => alert.key)).toEqual(expect.arrayContaining([
      'missing_tracking',
      'shipped_missing_tracking',
      'delivered_followup',
      'packaging_incomplete',
    ]));
  });

  it('honors no-tracking package exemptions through injected workflow summaries', () => {
    const result = calculateFulfillmentMetrics(
      [{ id: 'shipped-exempt', status: 'shipped', metadata: {} }],
      {
        ...dependencies,
        buildWorkflowSummary: () => ({ has_tracking: false, primary_package: { no_tracking: true }, packages: [] }),
      }
    );

    expect(result.missing_tracking).toBe(0);
    expect(result.tracking_coverage_percent).toBe(100);
  });
});
