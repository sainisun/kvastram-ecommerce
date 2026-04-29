import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createApiClient, formatResponse } from '../client.js';

export function registerTrustItemTools(server: McpServer) {

  server.tool('list_trust_items', 'List all "As Seen On" trust badge items', {}, async () => {
    const api = await createApiClient();
    const { data } = await api.get('/admin/trust-items');
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('create_trust_item', 'Create a new trust badge for the "As Seen On" strip', {
    label: z.string().describe('Main label text, e.g. "Handmade in India"'),
    sub: z.string().describe('Sub-label text, e.g. "Every stitch by hand"'),
    icon: z.string().optional().default('✦').describe('Icon character, default ✦'),
    is_active: z.boolean().optional().default(true),
    sort_order: z.number().optional().default(0),
  }, async (params) => {
    const api = await createApiClient();
    const { data } = await api.post('/admin/trust-items', params);
    return { content: [{ type: 'text', text: `Trust item created!\n\n${formatResponse(data)}` }] };
  });

  server.tool('update_trust_item', 'Update an existing trust badge', {
    id: z.string().describe('Trust item UUID'),
    label: z.string().optional(),
    sub: z.string().optional(),
    icon: z.string().optional(),
    is_active: z.boolean().optional(),
    sort_order: z.number().optional(),
  }, async ({ id, ...updates }) => {
    const api = await createApiClient();
    const { data } = await api.put(`/admin/trust-items/${id}`, updates);
    return { content: [{ type: 'text', text: `Trust item updated!\n\n${formatResponse(data)}` }] };
  });

  server.tool('delete_trust_item', 'Delete a trust badge', {
    id: z.string().describe('Trust item UUID'),
  }, async ({ id }) => {
    const api = await createApiClient();
    await api.delete(`/admin/trust-items/${id}`);
    return { content: [{ type: 'text', text: `Trust item ${id} deleted.` }] };
  });

  server.tool('toggle_trust_item', 'Toggle active/inactive status of a trust badge', {
    id: z.string().describe('Trust item UUID'),
  }, async ({ id }) => {
    const api = await createApiClient();
    const { data } = await api.patch(`/admin/trust-items/${id}/toggle`);
    return { content: [{ type: 'text', text: `Trust item toggled!\n\n${formatResponse(data)}` }] };
  });
}
