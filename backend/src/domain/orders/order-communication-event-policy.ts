export type OrderCommunicationEvent = {
  template: string;
  subject: string;
  message: string;
  channel?: string;
  status?: string;
  sent_at?: string;
};

/**
 * Appends a communication audit event while preserving the legacy metadata
 * shape and defaults used by order completion and fulfillment operations.
 */
export function appendOrderCommunicationEvent(
  metadata: Record<string, unknown> | null | undefined,
  event: OrderCommunicationEvent,
  now: () => string = () => new Date().toISOString(),
): Record<string, unknown> {
  const baseMetadata =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? metadata
      : {};
  const existingEvents = Array.isArray(baseMetadata.communication_events)
    ? baseMetadata.communication_events
    : [];

  return {
    ...baseMetadata,
    communication_events: [
      ...existingEvents,
      {
        template: event.template,
        subject: event.subject,
        message: event.message,
        sent_at: event.sent_at || now(),
        channel: event.channel || 'email',
        status: event.status || 'queued',
      },
    ],
  };
}
