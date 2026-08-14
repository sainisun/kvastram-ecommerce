export type OrderListingFilters = {
  page?: number;
  limit?: number;
  status?: string;
  queue?: 'open' | 'completed' | 'issues' | 'all';
  workflow_filter?: 'new' | 'processing' | 'due_today' | 'ready_to_ship' | 'missing_tracking' | 'all';
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

export type WorkflowListedOrder = Record<string, any>;

function toTimestamp(value: string | number | Date | null | undefined) {
  if (!value) return 0;
  return new Date(value).getTime();
}

/**
 * Applies the legacy in-memory workflow filters, sorting, and pagination to
 * already-selected and workflow-normalized order rows.
 */
export function selectListedOrders(
  orders: WorkflowListedOrder[],
  filters: OrderListingFilters,
  now = new Date()
) {
  const {
    page = 1,
    limit = 20,
    status = '',
    queue = 'all',
    workflow_filter = 'all',
    sort_by = 'created_at',
    sort_order = 'desc',
  } = filters;
  const offset = (page - 1) * limit;

  const queueFilteredOrders = orders.filter((order) => {
    if (queue === 'all') return true;
    if (queue === 'open') return order.status === 'pending' || order.status === 'processing';
    if (queue === 'completed') return order.status === 'shipped' || order.status === 'delivered';
    if (queue === 'issues') {
      return order.status === 'cancelled' || order.status === 'refunded' || order.workflow?.needs_attention === true || order.workflow?.overdue_tracking === true;
    }
    return true;
  });

  const workflowFilteredOrders = queueFilteredOrders.filter((order) => {
    if (workflow_filter === 'all') return true;
    const shipByDate = order.workflow?.ship_by_date ? new Date(order.workflow.ship_by_date) : null;
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    switch (workflow_filter) {
      case 'new': return order.status === 'pending';
      case 'processing': return order.status === 'processing';
      case 'due_today': return order.status !== 'shipped' && order.status !== 'delivered' && !!shipByDate && !Number.isNaN(shipByDate.getTime()) && shipByDate >= todayStart && shipByDate <= todayEnd;
      case 'ready_to_ship': return order.status === 'processing';
      case 'missing_tracking': return (order.status === 'processing' || order.status === 'shipped') && !order.workflow?.has_tracking && order.workflow?.primary_package?.no_tracking !== true;
      default: return true;
    }
  });

  const statusFilteredOrders = status && status !== 'all'
    ? workflowFilteredOrders.filter((order) => order.status === status)
    : workflowFilteredOrders;

  const sortedOrders = [...statusFilteredOrders].sort((left, right) => {
    if (sort_by === 'ship_by') {
      const leftTime = left.workflow?.ship_by_date ? new Date(left.workflow.ship_by_date).getTime() : Number.MAX_SAFE_INTEGER;
      const rightTime = right.workflow?.ship_by_date ? new Date(right.workflow.ship_by_date).getTime() : Number.MAX_SAFE_INTEGER;
      return sort_order === 'asc' ? leftTime - rightTime : rightTime - leftTime;
    }
    if (sort_by === 'destination') {
      const leftDestination = [left.shipping_country_code, left.shipping_city, left.shipping_postal_code].filter(Boolean).join(' ');
      const rightDestination = [right.shipping_country_code, right.shipping_city, right.shipping_postal_code].filter(Boolean).join(' ');
      return sort_order === 'asc' ? leftDestination.localeCompare(rightDestination) : rightDestination.localeCompare(leftDestination);
    }
    if (sort_by === 'oldest') return toTimestamp(left.created_at) - toTimestamp(right.created_at);
    if (sort_by === 'newest') return toTimestamp(right.created_at) - toTimestamp(left.created_at);
    if (sort_by === 'order_number') return sort_order === 'asc' ? Number(left.order_number) - Number(right.order_number) : Number(right.order_number) - Number(left.order_number);
    return sort_order === 'asc' ? toTimestamp(left.created_at) - toTimestamp(right.created_at) : toTimestamp(right.created_at) - toTimestamp(left.created_at);
  });

  return {
    orders: sortedOrders.slice(offset, offset + limit),
    pagination: {
      page,
      limit,
      total: sortedOrders.length,
      total_pages: Math.ceil(sortedOrders.length / limit),
    },
  };
}
