export type OrderWorkflowUpdateRequest = {
  ship_by_date?: string | null;
  estimated_delivery_start?: string | null;
  estimated_delivery_end?: string | null;
  customer_note?: string | null;
  internal_note?: string | null;
};

export type OrderWorkflowUpdateTarget = {
  id: string;
  metadata?: unknown;
};

export type OrderWorkflowUpdatePersistenceInput = {
  metadata: unknown;
  updated_at: Date;
};

/**
 * Applies the existing partial workflow metadata patch without altering order
 * status or fulfillment fields.
 */
export async function updateOrderWorkflow<TUpdated>(
  id: string,
  data: OrderWorkflowUpdateRequest,
  dependencies: {
    loadOrder: (id: string) => Promise<OrderWorkflowUpdateTarget | null>;
    mergeWorkflowMetadata: (metadata: unknown, update: OrderWorkflowUpdateRequest) => unknown;
    persistOrder: (id: string, input: OrderWorkflowUpdatePersistenceInput) => Promise<TUpdated>;
    now?: () => Date;
  },
): Promise<TUpdated> {
  const existingOrder = await dependencies.loadOrder(id);
  if (!existingOrder) throw new Error('Order not found');

  return dependencies.persistOrder(id, {
    metadata: dependencies.mergeWorkflowMetadata(existingOrder.metadata, data),
    updated_at: (dependencies.now || (() => new Date()))(),
  });
}
