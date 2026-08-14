import { createHash } from 'node:crypto';
import {
  attribute_values,
  product_attribute_values,
  product_attributes,
  product_discovery,
  product_embeddings,
  product_media_seo,
  product_seo,
  product_variant_merchant,
} from '../db/schema';
import {
  buildProductDiscoveryDocument,
  buildProductMetaDescription,
  buildProductSeoTitle,
  inferProductAttributeSlugs,
  inferProductSearchIntents,
  inferProductSemanticEntities,
} from '../domain/products/product-discovery-policy';

type BaselineProduct = {
  id: string;
  title?: string | null;
  handle: string;
  status?: string | null;
  thumbnail?: string | null;
};

type BaselineVariant = { id: string };
type BaselineImage = { id: string; url?: string | null; alt_text?: string | null; is_thumbnail?: boolean | null; metadata?: unknown };
type BaselineInput = { title: string; material?: string | null; subtitle?: string | null; description?: string | null };

export function buildDiscoveryBaselineMetadata(product: BaselineProduct, data: BaselineInput) {
  const seoTitle = buildProductSeoTitle(data);
  const metaDescription = buildProductMetaDescription(data);
  const document = buildProductDiscoveryDocument(data);
  const documentHash = createHash('sha256').update(document || product.id).digest('hex');
  return { seoTitle, metaDescription, document, documentHash };
}

export class ProductDiscoveryBaselineRepository {
  async persist(tx: any, product: BaselineProduct, variant: BaselineVariant, images: BaselineImage[], data: BaselineInput) {
    const { seoTitle, metaDescription, document, documentHash } = buildDiscoveryBaselineMetadata(product, data);
    const thumbnailImage = images.find((image) => image.is_thumbnail) || images[0];

    await tx.insert(product_seo).values({
      product_id: product.id,
      seo_title: seoTitle,
      meta_description: metaDescription,
      canonical_url: `/products/${product.handle}`,
      robots_index: product.status !== 'draft',
      robots_follow: true,
      og_title: seoTitle,
      og_description: metaDescription,
      og_image_url: thumbnailImage?.url || product.thumbnail,
      twitter_card: 'summary_large_image',
      schema_overrides: {},
      localized_metadata: {},
      seo_score: 0,
    }).onConflictDoNothing();

    await tx.insert(product_discovery).values({
      product_id: product.id,
      primary_keyword: data.title,
      secondary_keywords: [data.material, data.subtitle].filter(Boolean),
      long_tail_keywords: [
        data.title,
        data.material ? `${data.material} handmade product` : undefined,
        /gift/i.test(data.title || '') ? `${data.title} gift` : undefined,
      ].filter(Boolean),
      search_intents: inferProductSearchIntents(data),
      semantic_entities: inferProductSemanticEntities(data),
      negative_keywords: [],
      product_document: document,
      document_hash: documentHash,
      metadata: { source: 'auto_create_baseline' },
    }).onConflictDoNothing();

    const inferred = inferProductAttributeSlugs(data);
    if (inferred.length > 0) {
      const attrRows: any[] = await tx.select().from(product_attributes);
      const valueRows: any[] = await tx.select().from(attribute_values);
      const attrByCode = new Map<string, any>(attrRows.map((attr) => [attr.code, attr]));
      const valuesByKey = new Map<string, any>(valueRows.map((value) => [`${value.attribute_id}:${value.slug}`, value]));
      const assignments = inferred.map((item) => {
        const attr = attrByCode.get(item.attribute);
        if (!attr) return null;
        const value = valuesByKey.get(`${attr.id}:${item.slug}`);
        if (!value) return null;
        return {
          product_id: product.id,
          attribute_id: attr.id,
          value_id: value.id,
          raw_value: value.label,
          source: 'auto_create_baseline',
          confidence: 82,
          metadata: { inferred_from: 'title_description_material' },
        };
      }).filter(Boolean);
      if (assignments.length > 0) await tx.insert(product_attribute_values).values(assignments).onConflictDoNothing();
    }

    if (images.length > 0) {
      await tx.insert(product_media_seo).values(images.map((image, index) => ({
        image_id: image.id,
        alt_text: image.alt_text || `${product.title} ${index === 0 ? 'product image' : `view ${index + 1}`}`,
        cloudinary_public_id: (image.metadata as any)?.cloudinary_public_id || null,
        image_role: index === 0 ? 'primary' : 'gallery',
        view_type: index === 0 ? 'front' : null,
        color: null,
        seo_filename: product.handle,
        metadata: { source: 'auto_create_baseline' },
      }))).onConflictDoNothing();
    }

    await tx.insert(product_variant_merchant).values({
      variant_id: variant.id,
      item_group_id: product.id,
      material: data.material || null,
      condition: 'new',
      feed_enabled: false,
      metadata: { source: 'auto_create_baseline' },
    }).onConflictDoNothing();

    if (document && process.env.ENABLE_PRODUCT_EMBEDDINGS === 'true') {
      await tx.insert(product_embeddings).values({
        product_id: product.id,
        locale: 'en',
        source_hash: documentHash,
        document,
        metadata: { source: 'auto_create_baseline', provider: 'pending' },
        updated_at: new Date(),
      }).onConflictDoNothing();
    }
  }
}

export const productDiscoveryBaselineRepository = new ProductDiscoveryBaselineRepository();
