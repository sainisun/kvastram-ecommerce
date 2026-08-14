import { describe, expect, it, vi } from 'vitest';
import { updateOrderWorkflow } from '../src/application/orders/order-workflow-update-command';

describe('updateOrderWorkflow', () => {
  it('throws before persistence when the order is absent', async () => {
    const persistOrder = vi.fn();

    await expect(updateOrderWorkflow('missing', { customer_note: 'Note' }, {
      loadOrder: async () => null,
      mergeWorkflowMetadata: () => ({}),
      persistOrder,
    })).rejects.toThrow('Order not found');

    expect(persistOrder).not.toHaveBeenCalled();
  });

  it('forwards the complete partial patch to metadata merge and persists only metadata with the supplied timestamp', async () => {
    const now = new Date('2026-08-14T00:00:00.000Z');
    const mergeWorkflowMetadata = vi.fn((metadata, update) => ({ ...metadata as object, ...update }));
    const persistOrder = vi.fn(async (_id, input) => ({ id: 'order-1', ...input }));
    const patch = {
      ship_by_date: '2026-08-20T00:00:00.000Z',
      estimated_delivery_start: null,
      estimated_delivery_end: '2026-08-23T00:00:00.000Z',
      customer_note: 'Leave at reception',
      internal_note: null,
    };

    const result = await updateOrderWorkflow('order-1', patch, {
      loadOrder: async () => ({ id: 'order-1', metadata: { workflow_status: 'processing' } }),
      mergeWorkflowMetadata,
      persistOrder,
      now: () => now,
    });

    expect(mergeWorkflowMetadata).toHaveBeenCalledWith(
      { workflow_status: 'processing' },
      patch,
    );
    expect(persistOrder).toHaveBeenCalledWith('order-1', {
      metadata: {
        workflow_status: 'processing',
        ...patch,
      },
      updated_at: now,
    });
    expect(result).toMatchObject({ id: 'order-1' });
  });
});
