export type ProductPublishReadinessSnapshot = {
  product: {
    title: string | null;
    handle: string | null;
    thumbnail: string | null;
    collection_id: string | null;
    price_type: string | null;
    material: string | null;
    seo_title: string | null;
    seo_description: string | null;
  } | null;
  seo: {
    seo_title: string | null;
    meta_description: string | null;
  } | null;
  imageCount: number;
  categoryCount: number;
  attributeCount: number;
  prices: Array<{ amount: number | string | null }>;
};

export type ProductPublishReadinessUpdate = {
  title?: string;
  handle?: string;
  thumbnail?: string | null;
  images?: Array<{ url?: string | null }>;
  price_type?: string | null;
  prices?: Array<{ amount: number | string | null }>;
  category_ids?: string[];
  collection_id?: string | null;
  material?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
};

export type ProductPublishReadinessIssue = { field: string; message: string };

export type ProductPublishReadinessDependencies = {
  loadSnapshot(productId: string): Promise<ProductPublishReadinessSnapshot>;
  getNewProductIssues(data: ProductPublishReadinessUpdate): ProductPublishReadinessIssue[];
};

export async function getProductPublishReadinessIssues(
  productId: string,
  data: ProductPublishReadinessUpdate,
  dependencies: ProductPublishReadinessDependencies,
): Promise<ProductPublishReadinessIssue[]> {
  const snapshot = await dependencies.loadSnapshot(productId);
  const existing = snapshot.product;
  if (!existing) throw new Error(`Product with id ${productId} not found`);

  const hasImages = data.images
    ? data.images.some((image) => Boolean(image.url))
    : snapshot.imageCount > 0 || Boolean(data.thumbnail || existing.thumbnail);
  const hasCategories = data.category_ids ? data.category_ids.length > 0 : snapshot.categoryCount > 0;
  const hasAttributes = snapshot.attributeCount > 0 || Boolean(data.material || existing.material);
  const hasSeoTitle = Boolean(data.seo_title || snapshot.seo?.seo_title || existing.seo_title);
  const hasMetaDescription = Boolean(data.seo_description || snapshot.seo?.meta_description || existing.seo_description);
  const hasFixedPrice = (data.price_type || existing.price_type || 'fixed') === 'fixed';
  const hasSellablePrice =
    Boolean(data.prices?.some((price) => Number(price.amount) > 0)) ||
    snapshot.prices.some((price) => Number(price.amount) > 0);
  const hasPrice = hasFixedPrice && hasSellablePrice;

  const newProductIssues = dependencies.getNewProductIssues({
    title: data.title || existing.title || undefined,
    handle: data.handle || existing.handle || undefined,
    thumbnail: data.thumbnail || existing.thumbnail || undefined,
    images: data.images,
    price_type: (data.price_type || existing.price_type || 'fixed') as 'fixed' | 'on_request',
    prices: data.prices,
    category_ids: data.category_ids,
    collection_id: data.collection_id ?? existing.collection_id,
  });

  return [
    { field: 'title', message: 'Published products need a title.' },
    { field: 'handle', message: 'Published products need an editable URL slug.' },
    { field: 'prices', message: 'Published products need fixed pricing with at least one positive price.' },
    { field: 'images', message: 'Published products need at least one product image.' },
    { field: 'category_ids', message: 'Published products need at least one category or collection.' },
    { field: 'attributes', message: 'Published products need at least one structured attribute or legacy material.' },
    { field: 'seo_title', message: 'Published products need an SEO title.' },
    { field: 'seo_description', message: 'Published products need a meta description.' },
  ].filter((issue) => {
    if (issue.field === 'title') return newProductIssues.some((newIssue) => newIssue.field === 'title');
    if (issue.field === 'handle') return !Boolean(data.handle || existing.handle);
    if (issue.field === 'prices') return !hasPrice;
    if (issue.field === 'images') return !hasImages;
    if (issue.field === 'category_ids') return !hasCategories && !Boolean(data.collection_id ?? existing.collection_id);
    if (issue.field === 'attributes') return !hasAttributes;
    if (issue.field === 'seo_title') return !hasSeoTitle;
    if (issue.field === 'seo_description') return !hasMetaDescription;
    return false;
  });
}
