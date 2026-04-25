import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createApiClient, formatResponse } from '../client.js';

export function registerOrderTools(server: McpServer) {

  server.tool('list_orders', 'List all orders with optional filters', {
    page: z.number().optional().default(1),
    limit: z.number().optional().default(20),
    search: z.string().optional().describe('Search by order ID or customer name/email'),
    status: z.string().optional().describe('Filter by status: pending, processing, shipped, delivered, cancelled'),
    date_from: z.string().optional().describe('Start date filter (YYYY-MM-DD)'),
    date_to: z.string().optional().describe('End date filter (YYYY-MM-DD)'),
    sort_by: z.string().optional().describe('Sort field: created_at, total'),
    sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
  }, async (params) => {
    const api = await createApiClient();
    const { data } = await api.get('/orders', { params });
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('get_order', 'Get a single order by ID', {
    id: z.string().describe('Order UUID'),
  }, async ({ id }) => {
    const api = await createApiClient();
    const { data } = await api.get(`/orders/${id}`);
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('update_order_status', 'Update order status (e.g. mark as shipped, delivered)', {
    id: z.string().describe('Order UUID'),
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).describe('New order status'),
    tracking_number: z.string().optional().describe('Shipping tracking number'),
    tracking_url: z.string().optional().describe('Tracking URL'),
    notes: z.string().optional().describe('Internal notes'),
  }, async ({ id, ...updates }) => {
    const api = await createApiClient();
    const { data } = await api.put(`/orders/${id}/status`, updates);
    return { content: [{ type: 'text', text: `Order status updated!\n\n${formatResponse(data)}` }] };
  });

  server.tool('get_order_stats', 'Get order statistics overview (revenue, counts, etc.)', {}, async () => {
    const api = await createApiClient();
    const { data } = await api.get('/orders/stats/overview');
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('list_customers', 'List all customers', {
    page: z.number().optional().default(1),
    limit: z.number().optional().default(20),
    search: z.string().optional().describe('Search by name or email'),
  }, async (params) => {
    const api = await createApiClient();
    const { data } = await api.get('/customers', { params });
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('get_customer', 'Get customer details by ID', {
    id: z.string().describe('Customer UUID'),
  }, async ({ id }) => {
    const api = await createApiClient();
    const { data } = await api.get(`/customers/${id}`);
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });
}
