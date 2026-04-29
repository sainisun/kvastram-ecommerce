import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createApiClient, formatResponse, getAuthToken } from '../client.js';

export function registerProductTools(server: McpServer) {

  server.tool('list_products', 'List all products with optional filters', {
    limit: z.number().optional().default(20).describe('Products per page (max 100)'),
    offset: z.number().optional().default(0).describe('Skip N products'),
    search: z.string().optional().describe('Search by name or description'),
    status: z.string().optional().describe('Filter: published, draft, archived'),
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
    price: z.number().describe('Price in INR rupees (e.g. 599 for ₹599)'),
    compare_at_price: z.number().optional().describe('Original/MRP price in rupees for showing discount'),
    status: z.enum(['published', 'draft']).optional().default('draft').describe('Product status'),
    category_ids: z.array(z.string()).optional().describe('Array of category UUIDs'),
    tag_ids: z.array(z.string()).optional().describe('Array of tag UUIDs to attach to this product'),
    images: z.array(z.string()).optional().describe('Array of Cloudinary image URLs'),
    weight: z.number().optional().describe('Weight in grams'),
    sku: z.string().optional().describe('Stock Keeping Unit code'),
    inventory_quantity: z.number().optional().default(0).describe('Stock count'),
    seo_title: z.string().optional().describe('SEO meta title'),
    seo_description: z.string().optional().describe('SEO meta description'),
  }, async ({ title, price, compare_at_price, status, ...rest }) => {
    const api = await createApiClient();
    const INDIA_REGION_ID = 'dc27dc4d-e976-4cc8-9748-6323a1c69d4c';

    const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 200);
    const prices = [{ amount: Math.round(price * 100), currency_code: 'inr', region_id: INDIA_REGION_ID }];
    const compare = compare_at_price ? [{ amount: Math.round(compare_at_price * 100), currency_code: 'inr', region_id: INDIA_REGION_ID }] : undefined;

    const payload: Record<string, unknown> = {
      title,
      handle,
      status: status ?? 'draft',
      prices,
      ...(compare && { compare_at_prices: compare }),
      ...rest,
    };

    const { data } = await api.post('/products', payload);
    return { content: [{ type: 'text', text: `Product created successfully!\n\n${formatResponse(data)}` }] };
  });

  server.tool('bulk_create_products', 'Create multiple products in one call (max 50)', {
    products: z.array(z.object({
      title: z.string().describe('Product name/title'),
      description: z.string().optional(),
      price: z.number().describe('Price in INR rupees'),
      compare_at_price: z.number().optional().describe('MRP/original price in rupees'),
      status: z.enum(['published', 'draft']).optional().default('draft'),
      category_ids: z.array(z.string()).optional(),
      tag_ids: z.array(z.string()).optional(),
      images: z.array(z.string()).optional().describe('Array of Cloudinary image URLs'),
      weight: z.number().optional().describe('Weight in grams'),
      sku: z.string().optional(),
      inventory_quantity: z.number().optional().default(0),
      seo_title: z.string().optional(),
      seo_description: z.string().optional(),
    })).min(1).max(50),
  }, async ({ products }) => {
    const api = await createApiClient();
    const INDIA_REGION_ID = 'dc27dc4d-e976-4cc8-9748-6323a1c69d4c';

    const formattedProducts = products.map(({ title, price, compare_at_price, status, ...rest }) => ({
      title,
      handle: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 200),
      status: status ?? 'draft',
      prices: [{ amount: Math.round(price * 100), currency_code: 'inr', region_id: INDIA_REGION_ID }],
      ...(compare_at_price && { compare_at_prices: [{ amount: Math.round(compare_at_price * 100), currency_code: 'inr', region_id: INDIA_REGION_ID }] }),
      ...rest,
    }));

    const { data } = await api.post('/products/bulk-create', { products: formattedProducts });
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('update_product', 'Update an existing product', {
    id: z.string().describe('Product UUID to update'),
    title: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional().describe('New price in INR rupees'),
    compare_at_price: z.number().optional().describe('Original/MRP price in rupees for showing discount'),
    status: z.enum(['published', 'draft', 'archived']).optional(),
    images: z.array(z.string()).optional(),
    inventory_quantity: z.number().optional(),
    weight: z.number().optional(),
    sku: z.string().optional(),
    seo_title: z.string().optional().describe('SEO meta title (shown in Google search results)'),
    seo_description: z.string().optional().describe('SEO meta description (shown in Google search results)'),
  }, async ({ id, price, compare_at_price, ...updates }) => {
    const api = await createApiClient();
    const payload: Record<string, unknown> = { ...updates };
    const INDIA_REGION_ID = 'dc27dc4d-e976-4cc8-9748-6323a1c69d4c';
    if (price !== undefined) {
      payload.prices = [{ amount: Math.round(price * 100), currency_code: 'inr', region_id: INDIA_REGION_ID }];
    }
    if (compare_at_price !== undefined) {
      payload.compare_at_prices = [{ amount: Math.round(compare_at_price * 100), currency_code: 'inr', region_id: INDIA_REGION_ID }];
    }
    const { data } = await api.put(`/products/${id}`, payload);
    return { content: [{ type: 'text', text: `Product updated!\n\n${formatResponse(data)}` }] };
  });

  server.tool('bulk_update_products', 'Update status or price for multiple products at once', {
    product_ids: z.array(z.string()).describe('Array of product UUIDs to update'),
    status: z.enum(['published', 'draft', 'archived']).optional().describe('New status to set on all products'),
    price: z.number().optional().describe('New price in INR rupees to set on all product variants'),
    collection_id: z.string().optional().describe('Assign all products to this collection UUID'),
  }, async ({ product_ids, status, price, collection_id }) => {
    const api = await createApiClient();
    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (collection_id !== undefined) updates.collection_id = collection_id;
    if (price !== undefined) updates.price = Math.round(price * 100); // paise
    const { data } = await api.post('/products/bulk-update', { product_ids, updates });
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('bulk_delete_products', 'Permanently delete multiple products', {
    product_ids: z.array(z.string()).describe('Array of product UUIDs to delete'),
  }, async ({ product_ids }) => {
    const api = await createApiClient();
    const { data } = await api.post('/products/bulk-delete', { product_ids });
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('delete_product', 'Delete a product permanently', {
    id: z.string().describe('Product UUID to delete'),
  }, async ({ id }) => {
    const api = await createApiClient();
    await api.delete(`/products/${id}`);
    return { content: [{ type: 'text', text: `Product ${id} deleted successfully.` }] };
  });

  server.tool('upload_product_image', 'Upload an image from a URL to Cloudinary for use in products', {
    image_url: z.string().url().describe('Public URL of the image to upload (JPG, PNG, WebP, max 10MB)'),
    filename: z.string().optional().describe('Optional filename hint (e.g. "silk-saree-red.jpg")'),
  }, async ({ image_url, filename }) => {
    const token = await getAuthToken();

    // Fetch image from source URL and re-upload to Cloudinary via backend
    const imgRes = await fetch(image_url);
    if (!imgRes.ok) throw new Error(`Failed to fetch image from URL: ${imgRes.status}`);
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await imgRes.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: contentType });

    const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg';
    const name = filename || `upload-${Date.now()}.${ext}`;

    const form = new FormData();
    form.append('file', blob, name);

    const baseUrl = process.env.KVASTRAM_API_URL || 'https://api.kvastram.com';
    const uploadRes = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    const result = await uploadRes.json() as Record<string, unknown>;
    if (!uploadRes.ok) throw new Error(`Upload failed: ${JSON.stringify(result)}`);

    return { content: [{ type: 'text', text: `Image uploaded successfully!\n\nCloudinary URL: ${(result as any).url || (result as any).secure_url}\n\nFull response:\n${JSON.stringify(result, null, 2)}` }] };
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
