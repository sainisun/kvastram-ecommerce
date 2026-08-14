import { describe, expect, it } from 'vitest';
import { appendOrderCommunicationEvent } from '../src/domain/orders/order-communication-event-policy';

describe('appendOrderCommunicationEvent', () => {
  it('preserves metadata and existing audit events while appending a normalized event', () => {
    const result = appendOrderCommunicationEvent(
      {
        workflow_status: 'shipped',
        communication_events: [{ template: 'created', subject: 'Created', message: 'Order created' }],
      },
      {
        template: 'shipped',
        subject: 'Your order is on its way',
        message: 'Tracking details are available.',
      },
      () => '2026-08-14T00:00:00.000Z',
    );

    expect(result).toEqual({
      workflow_status: 'shipped',
      communication_events: [
        { template: 'created', subject: 'Created', message: 'Order created' },
        {
          template: 'shipped',
          subject: 'Your order is on its way',
          message: 'Tracking details are available.',
          sent_at: '2026-08-14T00:00:00.000Z',
          channel: 'email',
          status: 'queued',
        },
      ],
    });
  });

  it('starts from an empty record for non-object metadata and keeps explicit event fields', () => {
    expect(appendOrderCommunicationEvent(
      ['invalid metadata'] as unknown as Record<string, unknown>,
      {
        template: 'order_update',
        subject: 'Delivered',
        message: 'Your order has been delivered.',
        channel: 'sms',
        status: 'sent',
        sent_at: '2026-08-15T00:00:00.000Z',
      },
    )).toEqual({
      communication_events: [{
        template: 'order_update',
        subject: 'Delivered',
        message: 'Your order has been delivered.',
        sent_at: '2026-08-15T00:00:00.000Z',
        channel: 'sms',
        status: 'sent',
      }],
    });
  });
});
