import {
  assertOrderStatusTransition,
  deriveOrderStatusMutation,
  type OrderStatus,
} from '../../domain/orders/order-transition-policy';

export type OrderStatusUpdateTarget = {
  email?: string | null;
  order_number?: string | number | null;
  total?: number | null;
  currency_code?: string | null;
  status?: string | null;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  tracking_number?: string | null;
  metadata?: unknown;
};

export type OrderStatusUpdateInput = {
  status: OrderStatus;
  fulfillment_status: string;
  payment_status: string;
  metadata: unknown;
  updated_at: Date;
};

export type OrderStatusNotification = {
  email?: string | null;
  order_number?: string | number | null;
  total?: number | null;
  currency_code?: string | null;
  status: string;
  tracking_number?: string | null;
};

export async function updateOrderStatus<TUpdated>(
  id: string,
  newStatus: string,
  dependencies: {
    loadOrder: (id: string) => Promise<OrderStatusUpdateTarget | null>;
    getCurrentStatus: (order: OrderStatusUpdateTarget) => string;
    mergeWorkflowMetadata: (metadata: unknown, update: { workflow_status: OrderStatus }) => unknown;
    persistOrder: (id: string, input: OrderStatusUpdateInput) => Promise<TUpdated>;
    notify: (notification: OrderStatusNotification) => void;
    now?: () => Date;
  },
): Promise<TUpdated> {
  const existingOrder = await dependencies.loadOrder(id);
  if (!existingOrder) throw new Error('Order not found');

  const currentStatus = dependencies.getCurrentStatus(existingOrder);
  assertOrderStatusTransition(currentStatus, newStatus);

  const nextMetadata = dependencies.mergeWorkflowMetadata(existingOrder.metadata, {
    workflow_status: newStatus,
  });
  const { fulfillmentStatus, paymentStatus } = deriveOrderStatusMutation(
    newStatus,
    existingOrder.fulfillment_status ?? '',
    existingOrder.payment_status ?? '',
  );

  const updated = await dependencies.persistOrder(id, {
    status: newStatus,
    fulfillment_status: fulfillmentStatus,
    payment_status: paymentStatus,
    metadata: nextMetadata,
    updated_at: (dependencies.now || (() => new Date()))(),
  });

  dependencies.notify({
    email: existingOrder.email,
    order_number: existingOrder.order_number,
    total: existingOrder.total,
    currency_code: existingOrder.currency_code,
    status: newStatus,
    tracking_number: existingOrder.tracking_number,
  });

  return updated;
}
