import { eq, inArray } from 'drizzle-orm';
import { product_images, product_media_seo, products } from '../db/schema';
import { buildProductImageInputs, type ProductImageSource } from '../domain/products/product-write-input-policy';

export type ProductMediaSeoImage = {
  id: string;
  alt_text?: string | null;
  metadata?: Record<string, unknown> | null;
};

export function buildProductMediaSeoRows(
  product: { title?: string | null; handle?: string | null } | undefined,
  images: ProductMediaSeoImage[],
  source: 'auto_create_baseline' | 'auto_sync_images'
) {
  return images.map((image, index) => ({
    image_id: image.id,
    alt_text: image.alt_text || `${product?.title || 'product'} ${index === 0 ? 'product image' : `view ${index + 1}`}`,
    cloudinary_public_id: image.metadata?.cloudinary_public_id || null,
    image_role: index === 0 ? 'primary' : 'gallery',
    view_type: index === 0 ? 'front' : null,
    color: null,
    seo_filename: product?.handle || 'product',
    metadata: { source },
  }));
}

export class ProductMediaRepository {
  async assign(tx: any, productId: string, images: ProductImageSource[] | undefined) {
    const imageValues = buildProductImageInputs(productId, images);
    if (!imageValues.length) return [];
    return tx.insert(product_images).values(imageValues).returning();
  }

  async replace(tx: any, productId: string, images: ProductImageSource[]) {
    const existingImages = await tx
      .select({ id: product_images.id })
      .from(product_images)
      .where(eq(product_images.product_id, productId));
    const existingImageIds = existingImages.map((image: { id: string }) => image.id);

    if (existingImageIds.length) await tx.delete(product_media_seo).where(inArray(product_media_seo.image_id, existingImageIds));
    await tx.delete(product_images).where(eq(product_images.product_id, productId));

    const imageValues = buildProductImageInputs(productId, images);
    if (!imageValues.length) return [];

    const newImages = await tx.insert(product_images).values(imageValues).returning();
    const [product] = await tx
      .select({ title: products.title, handle: products.handle })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    await tx
      .insert(product_media_seo)
      .values(buildProductMediaSeoRows(product, newImages, 'auto_sync_images'))
      .onConflictDoNothing();
    return newImages;
  }
}

export const productMediaRepository = new ProductMediaRepository();
