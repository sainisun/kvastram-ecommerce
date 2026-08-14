export type OrderStatsRow = {
  status?: string | null;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  tracking_number?: string | null;
  metadata?: unknown;
  total?: number | string | null;
};

export type WorkflowStatusResolver = (order: OrderStatsRow) => string;

/**
 * Computes the order-dashboard statistics from already-selected order rows.
 * Persistence and workflow interpretation are injected by the application layer.
 */
export function calculateOrderStatsOverview(
  orderRows: OrderStatsRow[],
  resolveWorkflowStatus: WorkflowStatusResolver
) {
  const countByStatus: Record<string, number> = {};
  let totalRevenueNum = 0;

  for (const row of orderRows) {
    const workflowStatus = resolveWorkflowStatus(row);
    countByStatus[workflowStatus] = (countByStatus[workflowStatus] || 0) + 1;

    if (workflowStatus === 'delivered') {
      totalRevenueNum += Number(row.total || 0);
    }
  }

  const totalOrdersNum = orderRows.length;

  return {
    total_orders: totalOrdersNum,
    total_revenue: totalRevenueNum,
    pending_orders: countByStatus.pending || 0,
    processing_orders: countByStatus.processing || 0,
    shipped_orders: countByStatus.shipped || 0,
    delivered_orders: countByStatus.delivered || 0,
    cancelled_orders: countByStatus.cancelled || 0,
    refunded_orders: countByStatus.refunded || 0,
    avg_order_value: totalOrdersNum > 0 ? Math.round(totalRevenueNum / totalOrdersNum) : 0,
  };
}
