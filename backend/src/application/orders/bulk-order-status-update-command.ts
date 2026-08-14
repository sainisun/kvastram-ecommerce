import {
  canTransitionOrderStatus,
  deriveOrderStatusMutation,
  type OrderStatus,
} from '../../domain/orders/order-transition-policy';
import type {
  OrderStatusNotification,
  OrderStatusUpdateInput,
  OrderStatusUpdateTarget,
} from './order-status-update-command';

export type BulkOrderStatusUpdateTarget = OrderStatusUpdateTarget & { id: string };

/**
 * Preserves the legacy bulk update contract: validate every fetched target
 * before any persistence occurs, then update and notify one order at a time.
 */
export async function bulkUpdateOrderStatus(
  orderIds: string[],
  newStatus: string,
  dependencies: {
    loadOrders: (ids: string[]) => Promise<BulkOrderStatusUpdateTarget[]>;
    getCurrentStatus: (order: BulkOrderStatusUpdateTarget) => string;
    mergeWorkflowMetadata: (metadata: unknown, update: { workflow_status: OrderStatus }) => unknown;
    persistOrder: (id: string, input: OrderStatusUpdateInput) => Promise<void>;
    notify: (notification: OrderStatusNotification) => void;
    now?: () => Date;
  },
): Promise<number> {
  const targets = await dependencies.loadOrders(orderIds);
  if (targets.length === 0) throw new Error('No valid orders found');

  const invalidIds = targets
    .filter((order) => !canTransitionOrderStatus(dependencies.getCurrentStatus(order), newStatus))
    .map((order) => order.id);

  if (invalidIds.length > 0) {
    throw new Error(`Cannot update ${invalidIds.length} orders. Invalid status transition.`);
  }

  for (const order of targets) {
    const { fulfillmentStatus, paymentStatus } = deriveOrderStatusMutation(
      newStatus as OrderStatus,
      order.fulfillment_status ?? '',
      order.payment_status ?? '',
    );

    await dependencies.persistOrder(order.id, {
      status: newStatus as OrderStatus,
      fulfillment_status: fulfillmentStatus,
      payment_status: paymentStatus,
      metadata: dependencies.mergeWorkflowMetadata(order.metadata, {
        workflow_status: newStatus as OrderStatus,
      }),
      updated_at: (dependencies.now || (() => new Date()))(),
    });

    dependencies.notify({
      email: order.email,
      order_number: order.order_number,
      total: order.total,
      currency_code: order.currency_code,
      status: newStatus,
      tracking_number: order.tracking_number,
    });
  }

  return targets.length;
}
