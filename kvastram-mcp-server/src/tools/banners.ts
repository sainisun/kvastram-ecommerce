import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createApiClient, formatResponse } from '../client.js';

export function registerBannerTools(server: McpServer) {

  // ===== HOMEPAGE BANNERS =====
  server.tool('list_homepage_banners', 'List all homepage banners (carousel banners)', {}, async () => {
    const api = await createApiClient();
    const { data } = await api.get('/admin/homepage-banners');
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('create_homepage_banner', 'Create a new homepage banner. NOTE: Image must be a Cloudinary URL already uploaded.', {
    image_url: z.string().describe('Cloudinary image URL (upload via upload tool first)'),
    headline: z.string().optional().describe('Banner headline text'),
    button_label: z.string().optional().describe('CTA button text (e.g. "Shop Now")'),
    button_url: z.string().optional().describe('CTA button link URL'),
    is_active: z.boolean().optional().default(true),
    sort_order: z.number().optional().default(0).describe('Display order (lower = first)'),
  }, async (params) => {
    const api = await createApiClient();
    // Backend expects multipart form for banners, so we send JSON to the admin endpoint
    const formData = new URLSearchParams();
    if (params.image_url) formData.append('image_url', params.image_url);
    if (params.headline) formData.append('headline', params.headline);
    if (params.button_label) formData.append('button_label', params.button_label);
    if (params.button_url) formData.append('button_url', params.button_url);
    formData.append('is_active', String(params.is_active ?? true));
    formData.append('sort_order', String(params.sort_order ?? 0));

    const { data } = await api.post('/admin/homepage-banners', formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return { content: [{ type: 'text', text: `Homepage banner created!\n\n${formatResponse(data)}` }] };
  });

  server.tool('update_homepage_banner', 'Update a homepage banner', {
    id: z.string().describe('Banner UUID'),
    headline: z.string().optional(),
    button_label: z.string().optional(),
    button_url: z.string().optional(),
    is_active: z.boolean().optional(),
    sort_order: z.number().optional(),
  }, async ({ id, ...updates }) => {
    const api = await createApiClient();
    const formData = new URLSearchParams();
    Object.entries(updates).forEach(([k, v]) => {
      if (v !== undefined) formData.append(k, String(v));
    });
    const { data } = await api.patch(`/admin/homepage-banners/${id}`, formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return { content: [{ type: 'text', text: `Banner updated!\n\n${formatResponse(data)}` }] };
  });

  server.tool('delete_homepage_banner', 'Delete a homepage banner', {
    id: z.string().describe('Banner UUID'),
  }, async ({ id }) => {
    const api = await createApiClient();
    await api.delete(`/admin/homepage-banners/${id}`);
    return { content: [{ type: 'text', text: `Homepage banner ${id} deleted.` }] };
  });

  // ===== HERO BANNERS =====
  server.tool('list_hero_banners', 'List all hero banners (full-width top banners)', {}, async () => {
    const api = await createApiClient();
    const { data } = await api.get('/admin/hero-banners');
    return { content: [{ type: 'text', text: formatResponse(data) }] };
  });

  server.tool('create_hero_banner', 'Create a new hero banner', {
    image_url: z.string().describe('Cloudinary image URL'),
    title: z.string().optional().describe('Hero banner title'),
    subtitle: z.string().optional(),
    button_text: z.string().optional().describe('CTA button text'),
    button_link: z.string().optional().describe('CTA button URL'),
    is_active: z.boolean().optional().default(true),
    sort_order: z.number().optional().default(0),
  }, async (params) => {
    const api = await createApiClient();
    const formData = new URLSearchParams();
    if (params.image_url) formData.append('image_url', params.image_url);
    if (params.title) formData.append('title', params.title);
    if (params.subtitle) formData.append('subtitle', params.subtitle);
    if (params.button_text) formData.append('button_text', params.button_text);
    if (params.button_link) formData.append('button_link', params.button_link);
    formData.append('is_active', String(params.is_active ?? true));
    formData.append('sort_order', String(params.sort_order ?? 0));
    const { data } = await api.post('/admin/hero-banners', formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return { content: [{ type: 'text', text: `Hero banner created!\n\n${formatResponse(data)}` }] };
  });

  server.tool('delete_hero_banner', 'Delete a hero banner', {
    id: z.string().describe('Banner UUID'),
  }, async ({ id }) => {
    const api = await createApiClient();
    await api.delete(`/admin/hero-banners/${id}`);
    return { content: [{ type: 'text', text: `Hero banner ${id} deleted.` }] };
  });
}
