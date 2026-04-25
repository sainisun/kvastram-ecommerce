import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createApiClient, formatResponse } from '../client.js';

export function registerMarketingTools(server: McpServer) {

  // ===== DISCOUNT CODES =====
  server.tool('list_discounts', 'List all discount/coupon codes', {}, async () => {
    const api = await createApiClient();
    const { data } = await api.get('/marketing/discounts');
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('create_discount', 'Create a new discount/coupon code', {
    code: z.string().describe('Discount code (e.g. "SAVE20", "FIRSTORDER")'),
    type: z.enum(['percentage', 'fixed']).describe('Discount type'),
    value: z.number().describe('Discount value (20 for 20% off, or 100 for ₹100 off)'),
    min_order_value: z.number().optional().describe('Minimum order amount to apply discount'),
    max_uses: z.number().optional().describe('Maximum total uses (null = unlimited)'),
    max_uses_per_user: z.number().optional().default(1),
    start_date: z.string().optional().describe('Start date (ISO format, e.g. 2026-05-01)'),
    end_date: z.string().optional().describe('Expiry date (ISO format, e.g. 2026-05-31)'),
    is_active: z.boolean().optional().default(true),
    description: z.string().optional(),
  }, async (params) => {
    const api = await createApiClient();
    const { data } = await api.post('/marketing/discounts', params);
    return { content: [{ type: 'text', text: `Discount code created!\n\n${formatResponse(data)}` }] };
  });

  server.tool('update_discount', 'Update a discount code', {
    id: z.string().describe('Discount UUID'),
    is_active: z.boolean().optional(),
    end_date: z.string().optional(),
    max_uses: z.number().optional(),
    value: z.number().optional(),
    description: z.string().optional(),
  }, async ({ id, ...updates }) => {
    const api = await createApiClient();
    const { data } = await api.put(`/marketing/discounts/${id}`, updates);
    return { content: [{ type: 'text', text: `Discount updated!\n\n${formatResponse(data)}` }] };
  });

  server.tool('delete_discount', 'Delete a discount code', {
    id: z.string().describe('Discount UUID'),
  }, async ({ id }) => {
    const api = await createApiClient();
    await api.delete(`/marketing/discounts/${id}`);
    return { content: [{ type: 'text', text: `Discount ${id} deleted.` }] };
  });

  // ===== CAMPAIGNS =====
  server.tool('list_campaigns', 'List all marketing campaigns', {}, async () => {
    const api = await createApiClient();
    const { data } = await api.get('/marketing/campaigns');
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('create_campaign', 'Create a new marketing campaign', {
    name: z.string().describe('Campaign name'),
    type: z.string().describe('Campaign type (e.g. "email", "banner", "sale")'),
    start_date: z.string().optional().describe('Start date (ISO format)'),
    end_date: z.string().optional().describe('End date (ISO format)'),
    is_active: z.boolean().optional().default(true),
    metadata: z.record(z.any()).optional().describe('Additional campaign data'),
  }, async (params) => {
    const api = await createApiClient();
    const { data } = await api.post('/marketing/campaigns', params);
    return { content: [{ type: 'text', text: `Campaign created!\n\n${formatResponse(data)}` }] };
  });

  // ===== ANALYTICS =====
  server.tool('get_analytics', 'Get store analytics and reports', {
    period: z.enum(['today', 'week', 'month', 'year']).optional().default('month'),
  }, async ({ period }) => {
    const api = await createApiClient();
    const { data } = await api.get('/analytics', { params: { period } });
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  // ===== TRENDING REELS =====
  server.tool('list_trending_reels', 'List trending reels/videos shown on storefront', {}, async () => {
    const api = await createApiClient();
    const { data } = await api.get('/admin/trending-reels');
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('create_trending_reel', 'Add a new trending reel/video', {
    title: z.string().describe('Reel title'),
    video_url: z.string().describe('Video URL'),
    thumbnail_url: z.string().optional().describe('Thumbnail image URL'),
    product_id: z.string().optional().describe('Linked product UUID'),
    is_active: z.boolean().optional().default(true),
    sort_order: z.number().optional().default(0),
  }, async (params) => {
    const api = await createApiClient();
    const { data } = await api.post('/admin/trending-reels', params);
    return { content: [{ type: 'text', text: `Trending reel added!\n\n${formatResponse(data)}` }] };
  });
}
