export type WorkflowStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface WorkflowTimelineEvent {
  key: WorkflowStatus;
  label: string;
  happened_at: string | null;
  description?: string;
  completed: boolean;
  current: boolean;
}

export interface WorkflowMetadata {
  workflow_status?: WorkflowStatus;
  ship_by_date?: string | null;
  estimated_delivery_start?: string | null;
  estimated_delivery_end?: string | null;
  customer_note?: string | null;
  internal_note?: string | null;
  timeline?: Array<{
    key?: string;
    label?: string;
    happened_at?: string | null;
    description?: string;
  }>;
  processed_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
}

type OrderLike = {
  status?: string | null;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  tracking_number?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  metadata?: unknown;
};

const WORKFLOW_ORDER: WorkflowStatus[] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
];

const WORKFLOW_LABELS: Record<WorkflowStatus, string> = {
  pending: 'Order placed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

function toIso(value?: string | Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function normalizeWorkflowStatus(
  value?: string | null
): WorkflowStatus | null {
  const normalized = (value || '').toLowerCase();

  if (
    normalized === 'pending' ||
    normalized === 'processing' ||
    normalized === 'shipped' ||
    normalized === 'delivered' ||
    normalized === 'cancelled' ||
    normalized === 'refunded'
  ) {
    return normalized;
  }

  if (normalized === 'canceled') return 'cancelled';
  return null;
}

export function getWorkflowMetadata(metadata: unknown): WorkflowMetadata {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const source = metadata as Record<string, unknown>;

  return {
    workflow_status: normalizeWorkflowStatus(
      typeof source.workflow_status === 'string' ? source.workflow_status : null
    ) || undefined,
    ship_by_date:
      typeof source.ship_by_date === 'string' ? source.ship_by_date : null,
    estimated_delivery_start:
      typeof source.estimated_delivery_start === 'string'
        ? source.estimated_delivery_start
        : null,
    estimated_delivery_end:
      typeof source.estimated_delivery_end === 'string'
        ? source.estimated_delivery_end
        : null,
    customer_note:
      typeof source.customer_note === 'string' ? source.customer_note : null,
    internal_note:
      typeof source.internal_note === 'string' ? source.internal_note : null,
    timeline: Array.isArray(source.timeline)
      ? source.timeline
          .filter(
            (entry): entry is Record<string, unknown> =>
              !!entry && typeof entry === 'object' && !Array.isArray(entry)
          )
          .map((entry) => ({
            key: typeof entry.key === 'string' ? entry.key : undefined,
            label: typeof entry.label === 'string' ? entry.label : undefined,
            happened_at:
              typeof entry.happened_at === 'string' ? entry.happened_at : null,
            description:
              typeof entry.description === 'string'
                ? entry.description
                : undefined,
          }))
      : undefined,
    processed_at:
      typeof source.processed_at === 'string' ? source.processed_at : null,
    shipped_at:
      typeof source.shipped_at === 'string' ? source.shipped_at : null,
    delivered_at:
      typeof source.delivered_at === 'string' ? source.delivered_at : null,
  };
}

export function deriveWorkflowStatus(order: OrderLike): WorkflowStatus {
  const metadata = getWorkflowMetadata(order.metadata);

  if (metadata.workflow_status) {
    return metadata.workflow_status;
  }

  const rawStatus = normalizeWorkflowStatus(order.status);
  if (rawStatus) {
    return rawStatus;
  }

  const commercialStatus = (order.status || '').toLowerCase();
  const paymentStatus = (order.payment_status || '').toLowerCase();
  const fulfillmentStatus = (order.fulfillment_status || '').toLowerCase();

  if (commercialStatus === 'canceled' || commercialStatus === 'cancelled') {
    return 'cancelled';
  }
  if (commercialStatus === 'refunded' || paymentStatus === 'refunded') {
    return 'refunded';
  }
  if (metadata.delivered_at || fulfillmentStatus === 'delivered') {
    return 'delivered';
  }
  if (
    metadata.shipped_at ||
    !!order.tracking_number ||
    fulfillmentStatus === 'shipped' ||
    fulfillmentStatus === 'fulfilled'
  ) {
    return 'shipped';
  }
  if (
    metadata.processed_at ||
    commercialStatus === 'completed' ||
    paymentStatus === 'captured' ||
    paymentStatus === 'paid'
  ) {
    return 'processing';
  }

  return 'pending';
}

function statusIndex(status: WorkflowStatus): number {
  return WORKFLOW_ORDER.indexOf(status);
}

export function buildWorkflowTimeline(order: OrderLike): WorkflowTimelineEvent[] {
  const metadata = getWorkflowMetadata(order.metadata);
  const workflowStatus = deriveWorkflowStatus(order);

  const generatedTimeline = WORKFLOW_ORDER.map((key, index) => {
    let happenedAt: string | null = null;

    if (key === 'pending') happenedAt = toIso(order.created_at);
    if (key === 'processing') happenedAt = metadata.processed_at || null;
    if (key === 'shipped') happenedAt = metadata.shipped_at || null;
    if (key === 'delivered') happenedAt = metadata.delivered_at || null;

    const currentIndex = statusIndex(workflowStatus);
    const completed =
      currentIndex >= 0 && index < currentIndex && workflowStatus !== 'cancelled' && workflowStatus !== 'refunded';
    const current =
      workflowStatus !== 'cancelled' &&
      workflowStatus !== 'refunded' &&
      index === currentIndex;

    return {
      key,
      label: WORKFLOW_LABELS[key],
      happened_at: happenedAt,
      completed,
      current,
    };
  });

  if (workflowStatus === 'cancelled' || workflowStatus === 'refunded') {
    return [
      ...generatedTimeline.map((event, index) => ({
        ...event,
        completed: index === 0 ? true : !!event.happened_at,
        current: false,
      })),
      {
        key: workflowStatus,
        label: WORKFLOW_LABELS[workflowStatus],
        happened_at: toIso(order.updated_at),
        completed: false,
        current: true,
      },
    ];
  }

  return generatedTimeline;
}

export function mergeWorkflowMetadata(
  existingMetadata: unknown,
  updates: Partial<WorkflowMetadata>
): Record<string, unknown> {
  const existing = getWorkflowMetadata(existingMetadata);
  const merged: Record<string, unknown> = {
    ...(existingMetadata &&
    typeof existingMetadata === 'object' &&
    !Array.isArray(existingMetadata)
      ? (existingMetadata as Record<string, unknown>)
      : {}),
  };

  const nextStatus = updates.workflow_status || existing.workflow_status;
  if (nextStatus) {
    merged.workflow_status = nextStatus;
  }

  const processedAt =
    updates.processed_at ||
    existing.processed_at ||
    (nextStatus === 'processing' ? new Date().toISOString() : null);
  const shippedAt =
    updates.shipped_at ||
    existing.shipped_at ||
    (nextStatus === 'shipped' ? new Date().toISOString() : null);
  const deliveredAt =
    updates.delivered_at ||
    existing.delivered_at ||
    (nextStatus === 'delivered' ? new Date().toISOString() : null);

  merged.processed_at = processedAt;
  merged.shipped_at = shippedAt;
  merged.delivered_at = deliveredAt;
  merged.ship_by_date = updates.ship_by_date ?? existing.ship_by_date ?? null;
  merged.estimated_delivery_start =
    updates.estimated_delivery_start ??
    existing.estimated_delivery_start ??
    null;
  merged.estimated_delivery_end =
    updates.estimated_delivery_end ?? existing.estimated_delivery_end ?? null;
  merged.customer_note =
    updates.customer_note ?? existing.customer_note ?? null;
  merged.internal_note =
    updates.internal_note ?? existing.internal_note ?? null;

  const timelineSource = Array.isArray(existing.timeline) ? existing.timeline : [];
  const filteredTimeline = timelineSource.filter(
    (entry) =>
      entry &&
      entry.key &&
      normalizeWorkflowStatus(entry.key) !== nextStatus
  );

  if (nextStatus) {
    filteredTimeline.push({
      key: nextStatus,
      label: WORKFLOW_LABELS[nextStatus],
      happened_at:
        nextStatus === 'processing'
          ? processedAt
          : nextStatus === 'shipped'
            ? shippedAt
            : nextStatus === 'delivered'
              ? deliveredAt
              : new Date().toISOString(),
    });
  }

  merged.timeline = filteredTimeline;

  return merged;
}

export function buildWorkflowSummary(order: OrderLike) {
  const metadata = getWorkflowMetadata(order.metadata);
  const workflowStatus = deriveWorkflowStatus(order);
  const shipByDate = metadata.ship_by_date || null;
  const now = new Date();
  const shipBy = shipByDate ? new Date(shipByDate) : null;
  const overdueShipBy =
    !!shipBy &&
    !Number.isNaN(shipBy.getTime()) &&
    shipBy < now &&
    (workflowStatus === 'pending' || workflowStatus === 'processing');
  const overdueTracking =
    workflowStatus === 'processing' &&
    overdueShipBy &&
    !order.tracking_number;

  return {
    status: workflowStatus,
    status_label: WORKFLOW_LABELS[workflowStatus],
    ship_by_date: shipByDate,
    estimated_delivery_start: metadata.estimated_delivery_start || null,
    estimated_delivery_end: metadata.estimated_delivery_end || null,
    customer_note: metadata.customer_note || null,
    internal_note: metadata.internal_note || null,
    has_tracking: !!order.tracking_number,
    needs_attention: overdueShipBy || workflowStatus === 'cancelled' || workflowStatus === 'refunded',
    overdue_ship_by: overdueShipBy,
    overdue_tracking: overdueTracking,
    timeline: buildWorkflowTimeline(order),
  };
}
