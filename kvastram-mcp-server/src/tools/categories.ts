import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createApiClient, formatResponse } from '../client.js';

export function registerCategoryTools(server: McpServer) {

  server.tool('list_categories', 'List all product categories', {}, async () => {
    const api = await createApiClient();
    const { data } = await api.get('/categories');
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('create_category', 'Create a new product category', {
    name: z.string().describe('Category name'),
    slug: z.string().describe('URL slug (e.g. "sarees", "mens-wear")'),
    description: z.string().optional(),
    image: z.string().optional().describe('Category image URL'),
    parent_id: z.string().optional().describe('Parent category UUID for subcategories'),
    is_active: z.boolean().optional().default(true),
    show_in_header: z.boolean().optional().default(true),
    display_order: z.number().optional().default(0),
    emoji: z.string().optional().describe('Emoji for category display'),
  }, async (params) => {
    const api = await createApiClient();
    const { data } = await api.post('/categories', params);
    return { content: [{ type: 'text', text: `Category created!\n\n${formatResponse(data)}` }] };
  });

  server.tool('update_category', 'Update an existing category', {
    id: z.string().describe('Category UUID'),
    name: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    is_active: z.boolean().optional(),
    show_in_header: z.boolean().optional(),
    display_order: z.number().optional(),
    emoji: z.string().optional(),
  }, async ({ id, ...updates }) => {
    const api = await createApiClient();
    const { data } = await api.put(`/categories/${id}`, updates);
    return { content: [{ type: 'text', text: `Category updated!\n\n${formatResponse(data)}` }] };
  });

  server.tool('delete_category', 'Delete a category', {
    id: z.string().describe('Category UUID'),
  }, async ({ id }) => {
    const api = await createApiClient();
    await api.delete(`/categories/${id}`);
    return { content: [{ type: 'text', text: `Category ${id} deleted.` }] };
  });

  server.tool('assign_products_to_category', 'Assign products to a category', {
    category_id: z.string().describe('Category UUID'),
    product_ids: z.array(z.string()).describe('Array of product UUIDs to assign'),
  }, async ({ category_id, product_ids }) => {
    const api = await createApiClient();
    const { data } = await api.put(`/categories/${category_id}/products`, { product_ids });
    return { content: [{ type: 'text', text: `Products assigned to category!\n\n${formatResponse(data)}` }] };
  });

  // Homepage Category Circles
  server.tool('list_homepage_categories', 'List homepage category circles (shown on homepage)', {}, async () => {
    const api = await createApiClient();
    const { data } = await api.get('/admin/homepage-categories');
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('create_homepage_category', 'Add a category circle to the homepage', {
    category_id: z.string().describe('Category UUID to show on homepage'),
    display_order: z.number().optional().default(0),
    is_active: z.boolean().optional().default(true),
    custom_label: z.string().optional().describe('Override label text'),
    custom_image: z.string().optional().describe('Override image URL'),
  }, async (params) => {
    const api = await createApiClient();
    const { data } = await api.post('/admin/homepage-categories', params);
    return { content: [{ type: 'text', text: `Homepage category added!\n\n${formatResponse(data)}` }] };
  });
}
