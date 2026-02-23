/**
 * Product Validator Schemas
 * Zod schemas for product input validation
 */

import { z } from 'zod';

// --- Price Schema ---
export const PriceSchema = z.object({
  region_id: z.string().uuid(),
  amount: z.number().int().min(0), // stored in cents
  currency_code: z.string().length(3),
});

// --- Image Schema ---
export const ImageSchema = z.object({
  url: z.string().url(),
  alt_text: z.string().optional(),
  is_thumbnail: z.boolean().default(false),
  position: z.number().int().default(0),
});

// --- Create Product Schema ---
export const CreateProductSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  handle: z.string().min(1),
  status: z
    .enum(['draft', 'published', 'proposed', 'rejected'])
    .default('draft'),
  is_giftcard: z.boolean().default(false),
  discountable: z.boolean().default(true),
  weight: z.number().int().optional(),
  length: z.number().int().optional(),
  height: z.number().int().optional(),
  width: z.number().int().optional(),
  hs_code: z.string().optional(),
  origin_country: z.string().optional(),
  mid_code: z.string().optional(),
  material: z.string().optional(),
  inventory_quantity: z.number().int().optional().default(0),
  thumbnail: z.string().url().optional(),
  sku: z.string().optional(),
  collection_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  options: z
    .array(
      z.object({
        title: z.string(),
      })
    )
    .optional(),
  prices: z.array(PriceSchema).optional(),
  images: z.array(ImageSchema).optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});

// --- Update Product Schema ---
export const UpdateProductSchema = CreateProductSchema.partial();

// --- Filter Options Schema ---
export const ProductFilterSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  status: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  sort: z.string().optional().default('created_at'),
});

// --- Search Options Schema ---
export const ProductSearchSchema = z.object({
  query: z.string().optional().default(''),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  status: z.string().optional(),
  sortBy: z
    .enum(['relevance', 'price_asc', 'price_desc', 'newest'])
    .optional()
    .default('relevance'),
  categoryId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
});

// --- Bulk Update Schema ---
export const ProductBulkUpdateSchema = z.object({
  status: z.enum(['draft', 'published', 'proposed', 'rejected']).optional(),
});

// --- Type Exports ---
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductFilter = z.infer<typeof ProductFilterSchema>;
export type ProductSearch = z.infer<typeof ProductSearchSchema>;
export type ProductBulkUpdate = z.infer<typeof ProductBulkUpdateSchema>;
