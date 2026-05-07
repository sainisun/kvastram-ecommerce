export type WorkflowStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type LabelStatus = 'draft' | 'created' | 'printed' | 'voided' | 'refunded';

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
  label_status?: LabelStatus;
  label_url?: string | null;
  label_file_name?: string | null;
  label_cost?: number | null;
  label_currency?: string | null;
  package_weight_grams?: number | null;
  package_length_cm?: number | null;
  package_width_cm?: number | null;
  package_height_cm?: number | null;
  carrier_service?: string | null;
  label_created_at?: string | null;
  label_printed_at?: string | null;
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

const LABEL_STATUS_LABELS: Record<LabelStatus, string> = {
  draft: 'Draft',
  created: 'Label created',
  printed: 'Printed',
  voided: 'Voided',
  refunded: 'Refunded',
};

function toIso(value?: string | Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
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

export function normalizeLabelStatus(value?: string | null): LabelStatus | null {
  const normalized = (value || '').toLowerCase();

  if (
    normalized === 'draft' ||
    normalized === 'created' ||
    normalized === 'printed' ||
    normalized === 'voided' ||
    normalized === 'refunded'
  ) {
    return normalized;
  }

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
    label_status: normalizeLabelStatus(
      typeof source.label_status === 'string' ? source.label_status : null
    ) || undefined,
    label_url:
      typeof source.label_url === 'string' ? source.label_url : null,
    label_file_name:
      typeof source.label_file_name === 'string'
        ? source.label_file_name
        : null,
    label_cost: numberOrNull(source.label_cost),
    label_currency:
      typeof source.label_currency === 'string' ? source.label_currency : null,
    package_weight_grams: numberOrNull(source.package_weight_grams),
    package_length_cm: numberOrNull(source.package_length_cm),
    package_width_cm: numberOrNull(source.package_width_cm),
    package_height_cm: numberOrNull(source.package_height_cm),
    carrier_service:
      typeof source.carrier_service === 'string' ? source.carrier_service : null,
    label_created_at:
      typeof source.label_created_at === 'string'
        ? source.label_created_at
        : null,
    label_printed_at:
      typeof source.label_printed_at === 'string'
        ? source.label_printed_at
        : null,
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
  const hasUpdate = (key: keyof WorkflowMetadata) =>
    Object.prototype.hasOwnProperty.call(updates, key);

  merged.ship_by_date = hasUpdate('ship_by_date')
    ? updates.ship_by_date ?? null
    : existing.ship_by_date ?? null;
  merged.estimated_delivery_start = hasUpdate('estimated_delivery_start')
    ? updates.estimated_delivery_start ?? null
    : existing.estimated_delivery_start ?? null;
  merged.estimated_delivery_end = hasUpdate('estimated_delivery_end')
    ? updates.estimated_delivery_end ?? null
    : existing.estimated_delivery_end ?? null;
  merged.customer_note = hasUpdate('customer_note')
    ? updates.customer_note ?? null
    : existing.customer_note ?? null;
  merged.internal_note = hasUpdate('internal_note')
    ? updates.internal_note ?? null
    : existing.internal_note ?? null;

  merged.label_status = hasUpdate('label_status')
    ? updates.label_status ?? existing.label_status ?? 'draft'
    : existing.label_status ?? 'draft';
  merged.label_url = hasUpdate('label_url')
    ? updates.label_url ?? null
    : existing.label_url ?? null;
  merged.label_file_name = hasUpdate('label_file_name')
    ? updates.label_file_name ?? null
    : existing.label_file_name ?? null;
  merged.label_cost = hasUpdate('label_cost')
    ? updates.label_cost ?? null
    : existing.label_cost ?? null;
  merged.label_currency = hasUpdate('label_currency')
    ? updates.label_currency ?? null
    : existing.label_currency ?? null;
  merged.package_weight_grams = hasUpdate('package_weight_grams')
    ? updates.package_weight_grams ?? null
    : existing.package_weight_grams ?? null;
  merged.package_length_cm = hasUpdate('package_length_cm')
    ? updates.package_length_cm ?? null
    : existing.package_length_cm ?? null;
  merged.package_width_cm = hasUpdate('package_width_cm')
    ? updates.package_width_cm ?? null
    : existing.package_width_cm ?? null;
  merged.package_height_cm = hasUpdate('package_height_cm')
    ? updates.package_height_cm ?? null
    : existing.package_height_cm ?? null;
  merged.carrier_service = hasUpdate('carrier_service')
    ? updates.carrier_service ?? null
    : existing.carrier_service ?? null;
  merged.label_created_at = hasUpdate('label_created_at')
    ? updates.label_created_at ?? null
    : existing.label_created_at ?? null;
  merged.label_printed_at = hasUpdate('label_printed_at')
    ? updates.label_printed_at ?? null
    : existing.label_printed_at ?? null;

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
    label: {
      status: metadata.label_status || 'draft',
      status_label: LABEL_STATUS_LABELS[metadata.label_status || 'draft'],
      url: metadata.label_url || null,
      file_name: metadata.label_file_name || null,
      cost: metadata.label_cost ?? null,
      currency: metadata.label_currency || null,
      package_weight_grams: metadata.package_weight_grams ?? null,
      package_length_cm: metadata.package_length_cm ?? null,
      package_width_cm: metadata.package_width_cm ?? null,
      package_height_cm: metadata.package_height_cm ?? null,
      carrier_service: metadata.carrier_service || null,
      created_at: metadata.label_created_at || null,
      printed_at: metadata.label_printed_at || null,
    },
    timeline: buildWorkflowTimeline(order),
  };
}
