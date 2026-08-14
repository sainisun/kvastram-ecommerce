import { API_BASE_URL, fetchWithTimeout, handleApiError } from './api-client-core';

export const adminOrdersApi = {
  getOrders: async (limit = 20, offset = 0, search?: string, status?: string, queue?: 'all' | 'open' | 'completed' | 'issues', workflowFilter?: 'all' | 'new' | 'processing' | 'due_today' | 'ready_to_ship' | 'missing_tracking', sortBy?: 'newest' | 'oldest' | 'ship_by' | 'destination') => {
    const page = Math.floor(offset / limit) + 1;
    let url = `${API_BASE_URL}/orders?limit=${limit}&page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status && status !== 'all') url += `&status=${status}`;
    if (queue && queue !== 'all') url += `&queue=${queue}`;
    if (workflowFilter && workflowFilter !== 'all') url += `&workflow_filter=${workflowFilter}`;
    if (sortBy) url += `&sort_by=${sortBy}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return handleApiError(res, 'Failed to fetch orders');
    const response = await res.json();
    return { orders: response.data || [], pagination: response.pagination };
  },
  getOrder: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/orders/${id}`);
    if (!res.ok) return handleApiError(res, 'Failed to fetch order details');
    return (await res.json()).data;
  },
  completeOrder: async (id: string, data: { ship_date?: string | null; shipping_carrier?: string | null; shipping_service?: string | null; tracking_number?: string | null; tracking_link?: string | null; no_tracking?: boolean; no_tracking_reason?: string | null; customer_note?: string | null; internal_note?: string | null; notify_buyer?: boolean; send_admin_copy?: boolean }) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/orders/${id}/complete-order`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) return handleApiError(res, 'Failed to complete order');
    return res.json();
  },
  updateOrderStatus: async (id: string, status: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/orders/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (!res.ok) return handleApiError(res, 'Failed to update status');
    return res.json();
  },
  getOrderStats: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/orders/stats/overview`);
    if (!res.ok) return handleApiError(res, 'Failed to fetch order stats');
    return (await res.json()).data;
  },
};
