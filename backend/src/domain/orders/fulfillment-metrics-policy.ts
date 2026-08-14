export type FulfillmentMetricOrder = Record<string, any>;

export type FulfillmentMetricsDependencies = {
  resolveWorkflowStatus: (order: FulfillmentMetricOrder) => string;
  getWorkflowMetadata: (metadata: unknown) => Record<string, any>;
  buildWorkflowSummary: (order: FulfillmentMetricOrder) => {
    has_tracking: boolean;
    primary_package?: { no_tracking?: boolean } | null;
    packages?: Array<{ no_tracking?: boolean }>;
  };
  now?: Date;
};

/**
 * Calculates fulfillment dashboard metrics from selected order records.
 * Workflow interpretation is injected so the policy has no database or transport dependency.
 */
export function calculateFulfillmentMetrics(
  orderRows: FulfillmentMetricOrder[],
  dependencies: FulfillmentMetricsDependencies
) {
  const now = dependencies.now || new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  let dueToday = 0;
  let overdue = 0;
  let missingTracking = 0;
  let deliveredAwaitingFollowup = 0;
  let delayedOrders = 0;
  let packagingIncomplete = 0;
  let shippedOrDelivered = 0;
  let shippedOrDeliveredWithTracking = 0;
  let issueOrRefundOrders = 0;
  let dueSoon = 0;
  let shippedMissingTracking = 0;
  let onTimeShipped = 0;
  let shippedWithShipBy = 0;
  let processingTimeTotalMs = 0;
  let processingTimeCount = 0;
  let deliveredFollowupCount = 0;
  let repeatAfterFollowupCount = 0;
  const alerts: Array<{ key: string; label: string; count: number; severity: 'info' | 'warning' | 'danger' }> = [];

  for (const row of orderRows) {
    const workflowStatus = dependencies.resolveWorkflowStatus(row);
    const metadata = dependencies.getWorkflowMetadata(row.metadata);
    const shipBy = metadata.ship_by_date ? new Date(metadata.ship_by_date) : null;
    const hasValidShipBy = !!shipBy && !Number.isNaN(shipBy.getTime());
    const isActive = workflowStatus === 'pending' || workflowStatus === 'processing';

    if (hasValidShipBy && shipBy >= todayStart && shipBy <= todayEnd && isActive) dueToday += 1;
    if (hasValidShipBy && shipBy < todayStart && isActive) overdue += 1;
    if (hasValidShipBy && shipBy > now && shipBy.getTime() - now.getTime() <= 24 * 60 * 60 * 1000 && isActive) dueSoon += 1;

    const workflowSummary = dependencies.buildWorkflowSummary(row);
    const hasTracking = workflowSummary.has_tracking;
    const trackingExempt = workflowSummary.primary_package?.no_tracking === true || workflowSummary.packages?.some((pkg) => pkg.no_tracking === true) === true;

    if ((workflowStatus === 'processing' || workflowStatus === 'shipped') && !hasTracking && !trackingExempt) missingTracking += 1;
    if (workflowStatus === 'shipped' && !hasTracking && !trackingExempt) shippedMissingTracking += 1;

    const communications = metadata.communication_events || [];
    const hasDeliveryFollowup = communications.some((event: Record<string, any>) => event.template === 'delivered_followup');
    if (workflowStatus === 'delivered' && !hasDeliveryFollowup) deliveredAwaitingFollowup += 1;

    const followupEvents = communications.filter((event: Record<string, any>) => event.template === 'delivered_followup' && event.sent_at);
    if (followupEvents.length > 0) {
      deliveredFollowupCount += 1;
      const firstFollowupAt = followupEvents
        .map((event: Record<string, any>) => new Date(event.sent_at as string))
        .filter((date: Date) => !Number.isNaN(date.getTime()))
        .sort((a: Date, b: Date) => a.getTime() - b.getTime())[0];
      if (firstFollowupAt) {
        const rowCustomerKey = row.customer_id || row.email;
        const hasLaterOrder = orderRows.some((candidate) => {
          const candidateCustomerKey = candidate.customer_id || candidate.email;
          if (!rowCustomerKey || candidateCustomerKey !== rowCustomerKey) return false;
          if (candidate.id === row.id || !candidate.created_at) return false;
          const candidateCreatedAt = new Date(candidate.created_at);
          return !Number.isNaN(candidateCreatedAt.getTime()) && candidateCreatedAt > firstFollowupAt;
        });
        if (hasLaterOrder) repeatAfterFollowupCount += 1;
      }
    }

    const shippedAt = metadata.shipped_at ? new Date(metadata.shipped_at) : null;
    const deliveredAt = metadata.delivered_at ? new Date(metadata.delivered_at) : null;
    if (workflowStatus === 'shipped' && shippedAt && !Number.isNaN(shippedAt.getTime()) && now.getTime() - shippedAt.getTime() > 7 * 24 * 60 * 60 * 1000) delayedOrders += 1;

    const checklist = metadata.packaging_checklist || {};
    const checklistValues = [checklist.product_quality_checked, checklist.size_color_verified, checklist.care_card_included, checklist.thank_you_note_included, checklist.invoice_included];
    if (workflowStatus === 'processing' && checklistValues.some((value) => value !== true)) packagingIncomplete += 1;
    if (workflowStatus === 'cancelled' || workflowStatus === 'refunded') issueOrRefundOrders += 1;

    if (workflowStatus === 'shipped' || workflowStatus === 'delivered') {
      shippedOrDelivered += 1;
      if (hasTracking || trackingExempt) shippedOrDeliveredWithTracking += 1;
    }
    if (hasValidShipBy && shippedAt && !Number.isNaN(shippedAt.getTime())) {
      shippedWithShipBy += 1;
      if (shippedAt <= shipBy) onTimeShipped += 1;
    }
    if (row.created_at && shippedAt && !Number.isNaN(shippedAt.getTime())) {
      const createdAt = new Date(row.created_at);
      if (!Number.isNaN(createdAt.getTime()) && shippedAt >= createdAt) {
        processingTimeTotalMs += shippedAt.getTime() - createdAt.getTime();
        processingTimeCount += 1;
      }
    } else if (row.created_at && deliveredAt && !Number.isNaN(deliveredAt.getTime())) {
      const createdAt = new Date(row.created_at);
      if (!Number.isNaN(createdAt.getTime()) && deliveredAt >= createdAt) {
        processingTimeTotalMs += deliveredAt.getTime() - createdAt.getTime();
        processingTimeCount += 1;
      }
    }
  }

  const pushAlert = (key: string, label: string, count: number, severity: 'info' | 'warning' | 'danger') => {
    if (count > 0) alerts.push({ key, label, count, severity });
  };
  pushAlert('overdue', 'Orders past ship-by date', overdue, 'danger');
  pushAlert('due_soon', 'Orders due to ship in the next 24 hours', dueSoon, 'warning');
  pushAlert('missing_tracking', 'Active orders missing tracking', missingTracking, 'warning');
  pushAlert('shipped_missing_tracking', 'Shipped orders missing tracking', shippedMissingTracking, 'danger');
  pushAlert('delivered_followup', 'Delivered orders awaiting follow-up', deliveredAwaitingFollowup, 'info');
  pushAlert('packaging_incomplete', 'Processing orders with incomplete packaging checks', packagingIncomplete, 'warning');

  return {
    due_today: dueToday,
    overdue,
    missing_tracking: missingTracking,
    delivered_awaiting_followup: deliveredAwaitingFollowup,
    delayed_orders: delayedOrders,
    packaging_incomplete: packagingIncomplete,
    issue_refund_rate_percent: orderRows.length > 0 ? Math.round((issueOrRefundOrders / orderRows.length) * 100) : 0,
    repeat_after_followup_percent: deliveredFollowupCount > 0 ? Math.round((repeatAfterFollowupCount / deliveredFollowupCount) * 100) : 0,
    tracking_coverage_percent: shippedOrDelivered > 0 ? Math.round((shippedOrDeliveredWithTracking / shippedOrDelivered) * 100) : 0,
    on_time_shipping_percent: shippedWithShipBy > 0 ? Math.round((onTimeShipped / shippedWithShipBy) * 100) : 0,
    average_processing_hours: processingTimeCount > 0 ? Math.round(processingTimeTotalMs / processingTimeCount / 36_000) / 100 : 0,
    alerts,
  };
}
