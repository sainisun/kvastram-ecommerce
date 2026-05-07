import { describe, expect, it } from 'vitest';
import {
  buildWorkflowSummary,
  mergeWorkflowMetadata,
} from '../src/utils/order-workflow';

describe('order workflow metadata', () => {
  it('hydrates workflow dates and notes from order metadata', () => {
    const summary = buildWorkflowSummary({
      status: 'processing',
      created_at: '2026-05-01T10:00:00.000Z',
      metadata: {
        workflow_status: 'processing',
        ship_by_date: '2026-05-09',
        estimated_delivery_start: '2026-05-11',
        estimated_delivery_end: '2026-05-14',
        customer_note: 'Packed with care.',
        internal_note: 'Add care card.',
      },
    });

    expect(summary.status).toBe('processing');
    expect(summary.ship_by_date).toBe('2026-05-09');
    expect(summary.estimated_delivery_start).toBe('2026-05-11');
    expect(summary.estimated_delivery_end).toBe('2026-05-14');
    expect(summary.customer_note).toBe('Packed with care.');
    expect(summary.internal_note).toBe('Add care card.');
  });

  it('clears workflow fields when nullable updates are sent', () => {
    const metadata = mergeWorkflowMetadata(
      {
        ship_by_date: '2026-05-09',
        estimated_delivery_start: '2026-05-11',
        estimated_delivery_end: '2026-05-14',
        customer_note: 'Buyer-facing note',
        internal_note: 'Admin-only note',
      },
      {
        ship_by_date: null,
        estimated_delivery_start: null,
        estimated_delivery_end: null,
        customer_note: null,
        internal_note: null,
      }
    );

    expect(metadata.ship_by_date).toBeNull();
    expect(metadata.estimated_delivery_start).toBeNull();
    expect(metadata.estimated_delivery_end).toBeNull();
    expect(metadata.customer_note).toBeNull();
    expect(metadata.internal_note).toBeNull();
  });

  it('keeps existing workflow fields when omitted from updates', () => {
    const metadata = mergeWorkflowMetadata(
      {
        ship_by_date: '2026-05-09',
        customer_note: 'Buyer-facing note',
      },
      {
        internal_note: 'Updated internal note',
      }
    );

    expect(metadata.ship_by_date).toBe('2026-05-09');
    expect(metadata.customer_note).toBe('Buyer-facing note');
    expect(metadata.internal_note).toBe('Updated internal note');
  });
});
