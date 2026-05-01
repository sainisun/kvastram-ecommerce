import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createApiClient, formatResponse } from '../client.js';

export function registerCollectionTools(server: McpServer) {

  server.tool('list_collections', 'List all product collections', {}, async () => {
    const api = await createApiClient();
    const { data } = await api.get('/collections');
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('create_collection', 'Create a new product collection', {
    title: z.string().describe('Collection title (e.g. "Summer Picks 2026")'),
    handle: z.string().describe('URL handle (e.g. "summer-picks-2026")'),
    image: z.string().optional().describe('Collection banner image URL'),
    metadata: z.record(z.any()).optional().describe('Extra metadata as JSON object'),
  }, async (params) => {
    const api = await createApiClient();
    const { data } = await api.post('/collections', params);
    return { content: [{ type: 'text', text: `Collection created!\n\n${formatResponse(data)}` }] };
  });

  server.tool('update_collection', 'Update an existing collection', {
    id: z.string().describe('Collection UUID'),
    title: z.string().optional(),
    handle: z.string().optional(),
    image: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }, async ({ id, ...updates }) => {
    const api = await createApiClient();
    const { data } = await api.put(`/collections/${id}`, updates);
    return { content: [{ type: 'text', text: `Collection updated!\n\n${formatResponse(data)}` }] };
  });

  server.tool('delete_collection', 'Delete a collection', {
    id: z.string().describe('Collection UUID'),
  }, async ({ id }) => {
    const api = await createApiClient();
    await api.delete(`/collections/${id}`);
    return { content: [{ type: 'text', text: `Collection ${id} deleted.` }] };
  });

  server.tool('assign_products_to_collection', 'Assign products to a collection', {
    collection_id: z.string().describe('Collection UUID'),
    product_ids: z.array(z.string()).describe('Array of product UUIDs'),
  }, async ({ collection_id, product_ids }) => {
    const api = await createApiClient();
    const { data } = await api.put(`/collections/${collection_id}/products`, { product_ids });
    return { content: [{ type: 'text', text: `Products assigned to collection!\n\n${formatResponse(data)}` }] };
  });
}
