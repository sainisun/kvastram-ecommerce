export const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'refunded', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

export interface OrderStatusMutation {
  fulfillmentStatus: string;
  paymentStatus: string;
}

export function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

export function canTransitionOrderStatus(currentStatus: string, nextStatus: string): boolean {
  if (currentStatus === nextStatus) return true;
  if (!isOrderStatus(currentStatus) || !isOrderStatus(nextStatus)) return false;
  return ORDER_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function assertOrderStatusTransition(
  currentStatus: string,
  nextStatus: string
): asserts nextStatus is OrderStatus {
  if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
    throw new Error(
      `Invalid status transition from '${currentStatus}' to '${nextStatus}'`
    );
  }
}

export function deriveOrderStatusMutation(
  nextStatus: OrderStatus,
  currentFulfillmentStatus: string,
  currentPaymentStatus: string
): OrderStatusMutation {
  return {
    fulfillmentStatus:
      nextStatus === 'delivered'
        ? 'fulfilled'
        : nextStatus === 'shipped'
          ? 'shipped'
          : nextStatus === 'processing'
            ? 'not_fulfilled'
            : currentFulfillmentStatus,
    paymentStatus:
      nextStatus === 'refunded' ? 'refunded' : currentPaymentStatus,
  };
}
