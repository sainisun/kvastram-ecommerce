import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createApiClient, formatResponse } from '../client.js';

export function registerProductTools(server: McpServer) {

  server.tool('list_products', 'List all products with optional filters', {
    limit: z.number().optional().default(20).describe('Products per page (max 100)'),
    offset: z.number().optional().default(0).describe('Skip N products'),
    search: z.string().optional().describe('Search by name or description'),
    status: z.string().optional().describe('Filter: active, draft, archived'),
    category_id: z.string().optional().describe('Filter by category UUID'),
    collection_id: z.string().optional().describe('Filter by collection UUID'),
    sort: z.enum(['newest', 'price_asc', 'price_desc']).optional().describe('Sort order'),
  }, async (params) => {
    const api = await createApiClient();
    const { data } = await api.get('/products', { params });
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('get_product', 'Get a single product by ID', {
    id: z.string().describe('Product UUID'),
  }, async ({ id }) => {
    const api = await createApiClient();
    const { data } = await api.get(`/products/${id}`);
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('create_product', 'Create a new product', {
    title: z.string().describe('Product name/title'),
    description: z.string().optional().describe('Product description (supports HTML)'),
    price: z.number().describe('Price in INR (paise — multiply by 100, e.g. 59900 = ₹599)'),
    compare_at_price: z.number().optional().describe('Original/MRP price in paise for showing discount'),
    status: z.enum(['active', 'draft']).optional().default('draft').describe('Product status'),
    category_ids: z.array(z.string()).optional().describe('Array of category UUIDs'),
    collection_ids: z.array(z.string()).optional().describe('Array of collection UUIDs'),
    images: z.array(z.string()).optional().describe('Array of image URLs'),
    tags: z.array(z.string()).optional().describe('Array of tag names'),
    weight: z.number().optional().describe('Weight in grams'),
    sku: z.string().optional().describe('Stock Keeping Unit code'),
    inventory_quantity: z.number().optional().describe('Stock count'),
  }, async (params) => {
    const api = await createApiClient();
    const { data } = await api.post('/products', params);
    return { content: [{ type: 'text', text: `Product created successfully!\n\n${formatResponse(data)}` }] };
  });

  server.tool('update_product', 'Update an existing product', {
    id: z.string().describe('Product UUID to update'),
    title: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional().describe('Price in paise'),
    compare_at_price: z.number().optional(),
    status: z.enum(['active', 'draft', 'archived']).optional(),
    images: z.array(z.string()).optional(),
    inventory_quantity: z.number().optional(),
    weight: z.number().optional(),
    sku: z.string().optional(),
  }, async ({ id, ...updates }) => {
    const api = await createApiClient();
    const { data } = await api.put(`/products/${id}`, updates);
    return { content: [{ type: 'text', text: `Product updated!\n\n${formatResponse(data)}` }] };
  });

  server.tool('delete_product', 'Delete a product permanently', {
    id: z.string().describe('Product UUID to delete'),
  }, async ({ id }) => {
    const api = await createApiClient();
    await api.delete(`/products/${id}`);
    return { content: [{ type: 'text', text: `Product ${id} deleted successfully.` }] };
  });

  server.tool('update_product_inventory', 'Update stock/inventory for a product', {
    id: z.string().describe('Product UUID'),
    inventory_quantity: z.number().describe('New stock count'),
  }, async ({ id, inventory_quantity }) => {
    const api = await createApiClient();
    const { data } = await api.put(`/products/${id}`, { inventory_quantity });
    return { content: [{ type: 'text', text: `Inventory updated to ${inventory_quantity}.\n\n${formatResponse(data)}` }] };
  });
}
