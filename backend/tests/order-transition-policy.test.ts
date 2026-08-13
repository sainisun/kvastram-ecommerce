import { describe, expect, it } from 'vitest';
import {
  ORDER_STATUS_TRANSITIONS,
  assertOrderStatusTransition,
  canTransitionOrderStatus,
  deriveOrderStatusMutation,
} from '../src/domain/orders/order-transition-policy';

describe('order transition policy', () => {
  it('accepts every declared transition and idempotent status update', () => {
    for (const [currentStatus, nextStatuses] of Object.entries(
      ORDER_STATUS_TRANSITIONS
    )) {
      expect(canTransitionOrderStatus(currentStatus, currentStatus)).toBe(true);
      for (const nextStatus of nextStatuses) {
        expect(canTransitionOrderStatus(currentStatus, nextStatus)).toBe(true);
        expect(() =>
          assertOrderStatusTransition(currentStatus, nextStatus)
        ).not.toThrow();
      }
    }
  });

  it('rejects backward, terminal, and unknown status transitions with the legacy error contract', () => {
    expect(canTransitionOrderStatus('shipped', 'processing')).toBe(false);
    expect(canTransitionOrderStatus('cancelled', 'processing')).toBe(false);
    expect(canTransitionOrderStatus('pending', 'unknown')).toBe(false);

    expect(() => assertOrderStatusTransition('shipped', 'processing')).toThrow(
      "Invalid status transition from 'shipped' to 'processing'"
    );
  });

  it('derives fulfillment and payment effects without coupling to persistence', () => {
    expect(deriveOrderStatusMutation('processing', 'pending', 'captured')).toEqual({
      fulfillmentStatus: 'not_fulfilled',
      paymentStatus: 'captured',
    });
    expect(deriveOrderStatusMutation('shipped', 'pending', 'captured')).toEqual({
      fulfillmentStatus: 'shipped',
      paymentStatus: 'captured',
    });
    expect(deriveOrderStatusMutation('delivered', 'shipped', 'captured')).toEqual({
      fulfillmentStatus: 'fulfilled',
      paymentStatus: 'captured',
    });
    expect(deriveOrderStatusMutation('refunded', 'fulfilled', 'captured')).toEqual({
      fulfillmentStatus: 'fulfilled',
      paymentStatus: 'refunded',
    });
  });
});
