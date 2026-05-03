import type { Metadata } from 'next';

import type { Product } from '@/types';

export const SITE_NAME = 'Kvastram';
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://kvastram.com';
export const DEFAULT_OG_IMAGE = '/images/home/hero-main.jpg';

export function getProductPath(product: Pick<Product, 'handle' | 'id'>): string {
  return `/products/${product.handle || product.id}`;
}

export type TaxonomyNode = {
  id: string;
  name?: string;
  title?: string;
  slug?: string;
  handle?: string;
  description?: string | null;
  image?: string | null;
  header_image_url?: string | null;
  metadata?: Record<string, unknown> | null;
  children?: TaxonomyNode[];
};

export type BreadcrumbItem = {
  name: string;
  path: string;
};

type MetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  keywords?: string[];
  type?: 'website' | 'article';
  noindex?: boolean;
};

type CollectionMetadataOptions = {
  name: string;
  path: string;
  description: string;
  image?: string | null;
  kind: 'category' | 'collection';
  keywords?: string[];
};

type ProductPriceInfo = {
  amount: number;
  currencyCode: string;
  amountInMajor: number;
  display: string;
};

const COLOR_KEYWORDS = [
  'black',
  'blue',
  'brown',
  'green',
  'grey',
  'gray',
  'ivory',
  'lavender',
  'maroon',
  'mustard',
  'navy',
  'off white',
  'olive',
  'peach',
  'pink',
  'purple',
  'red',
  'rust',
  'teal',
  'white',
  'yellow',
];

const CATEGORY_KEYWORD_MAP: Record<
  string,
  { primary: string; secondary: string[]; label: string }
> = {
  kurti: {
    primary: 'handmade Indian block print top',
    secondary: [
      'kantha embroidery tunic',
      'Indian artisan blouse',
      'fair trade Indian top',
    ],
    label: 'Artisan Tops',
  },
  shawl: {
    primary: 'handmade Indian scarf wrap',
    secondary: [
      'kantha stitch stole',
      'block print scarf',
      'Indian artisan wrap',
    ],
    label: 'Scarves & Wraps',
  },
  saree: {
    primary: 'handwoven Indian textile',
    secondary: ['kantha fabric', 'block print cotton', 'artisan Indian cloth'],
    label: 'Indian Textiles',
  },
  default: {
    primary: 'handmade Indian clothing',
    secondary: [
      'kantha handmade clothing',
      'artisan Indian bags',
      'fair trade Indian textiles',
    ],
    label: 'Handmade Indian Goods',
  },
};

export function stripMarkdown(value: string | null | undefined): string {
  if (!value) return '';

  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[`*_>#-]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;

  const truncated = value.slice(0, maxLength - 1);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  if (lastSpaceIndex > maxLength * 0.65) {
    return `${truncated.slice(0, lastSpaceIndex).trim()}...`;
  }

  return `${truncated.trim()}...`;
}

export function toAbsoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return new URL(path, SITE_URL).toString();
}

export function titleFromHandle(handle: string): string {
  return handle
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function flattenCategories(
  categories: TaxonomyNode[],
  parent?: TaxonomyNode
): Array<TaxonomyNode & { parent?: TaxonomyNode }> {
  return categories.flatMap((category) => [
    { ...category, parent },
    ...flattenCategories(category.children || [], category),
  ]);
}

export function findCategoryById(
  categories: TaxonomyNode[],
  id: string
): (TaxonomyNode & { parent?: TaxonomyNode }) | undefined {
  return flattenCategories(categories).find((category) => category.id === id);
}

export function findCategoryBySlug(
  categories: TaxonomyNode[],
  slug: string
): (TaxonomyNode & { parent?: TaxonomyNode }) | undefined {
  return flattenCategories(categories).find(
    (category) => category.slug === slug || category.handle === slug
  );
}

export function getCategoryPath(category: {
  slug?: string;
  handle?: string;
}): string | null {
  const slug = category.slug || category.handle;
  return slug ? `/categories/${slug}` : null;
}

function getCategoryKeywordBundle(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes('kurti') || normalized.includes('top')) {
    return CATEGORY_KEYWORD_MAP.kurti;
  }

  if (
    normalized.includes('shawl') ||
    normalized.includes('wrap') ||
    normalized.includes('stole')
  ) {
    return CATEGORY_KEYWORD_MAP.shawl;
  }

  if (normalized.includes('saree') || normalized.includes('sari')) {
    return CATEGORY_KEYWORD_MAP.saree;
  }

  return CATEGORY_KEYWORD_MAP.default;
}

export function getPrimaryCategory(product: Product) {
  return product.categories?.[0];
}

export function getPrimaryCollectionOrCategoryLabel(product: Product): string {
  return (
    getPrimaryCategory(product)?.name ||
    product.collection?.title ||
    'Handmade Indian Goods'
  );
}

export function getProductCategoryLabel(product: Product): string {
  const directCategory = getPrimaryCategory(product)?.name;
  if (directCategory) return directCategory;

  const title = product.title.toLowerCase();

  if (title.includes('kurti')) return 'Kurti';
  if (title.includes('shawl')) return 'Shawl';
  if (title.includes('wrap')) return 'Wrap';
  if (title.includes('saree') || title.includes('sari')) return 'Saree';
  if (title.includes('dupatta') || title.includes('stole')) return 'Artisan Scarf';

  return 'Handmade Goods';
}

export function getProductMaterial(product: Product): string {
  return (
    product.material ||
    product.variants?.find((variant) => variant.title)?.title ||
    'Premium Fabric'
  );
}

export function getProductPrice(product: Product): ProductPriceInfo | null {
  const prices = product.variants?.flatMap((variant) => variant.prices || []);
  if (!prices || prices.length === 0) return null;

  const preferredPrice =
    prices.find((price) => price.currency_code.toLowerCase() === 'inr') ||
    prices[0];

  const currencyCode = preferredPrice.currency_code.toUpperCase();
  const amountInMajor = preferredPrice.amount / 100;

  return {
    amount: preferredPrice.amount,
    currencyCode,
    amountInMajor,
    display: new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amountInMajor),
  };
}

export function getProductColor(product: Product): string | null {
  const title = product.title.toLowerCase();
  return (
    COLOR_KEYWORDS.find((color) => title.includes(color))?.replace(
      /\b\w/g,
      (match) => match.toUpperCase()
    ) || null
  );
}

export function buildProductPrimaryKeyword(product: Product): string {
  const handlePhrase = titleFromHandle(product.handle);
  if (handlePhrase) return handlePhrase;

  const color = getProductColor(product);
  const material = getProductMaterial(product);
  const category = getProductCategoryLabel(product);
  return [color, material, category].filter(Boolean).join(' ');
}

export function buildProductImageAlt(
  product: Product,
  index: number,
  explicitAlt?: string | null
): string {
  if (explicitAlt?.trim()) return explicitAlt.trim();

  const color = getProductColor(product);
  const material = getProductMaterial(product);
  const category = getProductCategoryLabel(product);
  const view =
    index === 0
      ? 'front view'
      : index === 1
        ? 'detail view'
        : `view ${index + 1}`;

  return [color, material, category, 'for Women', 'Kvastram', view]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildProductSeoTitle(product: Product): string {
  const customTitle = product.seo_title?.trim();
  if (customTitle) {
    return truncateAtWord(customTitle, 60);
  }

  const material = getProductMaterial(product);
  const category = getProductCategoryLabel(product);
  return truncateAtWord(
    `${product.title} | ${material} ${category} - ${SITE_NAME}`,
    60
  );
}

export function buildProductMetaDescription(product: Product): string {
  const customDescription = product.seo_description?.trim();
  if (customDescription) {
    return truncateAtWord(customDescription, 155);
  }

  const price = getProductPrice(product);
  const material = getProductMaterial(product);
  const category = getProductCategoryLabel(product);
  const sourceDescription = stripMarkdown(product.description);
  const highlight =
    sourceDescription.split('. ').find(Boolean) ||
    `Handcrafted ${category.toLowerCase()} with premium detailing.`;
  const variantSummary = product.options
    ?.map((option) => option.title)
    .filter(Boolean)
    .join(', ');

  return truncateAtWord(
    `${product.title} — handmade in Jaipur, India. ${highlight} ${
      variantSummary ? `Available in ${variantSummary}. ` : ''
    }${price ? `From ${price.display}. ` : ''}Free worldwide shipping on orders over $75. Ships in tracked packaging.`,
    155
  );
}

export function buildProductKeywords(product: Product): string[] {
  const categoryLabel = getProductCategoryLabel(product);
  const keywordBundle = getCategoryKeywordBundle(categoryLabel);

  return [
    buildProductPrimaryKeyword(product),
    ...keywordBundle.secondary,
    `${categoryLabel.toLowerCase()} online`,
  ];
}

export function buildCollectionTitle({
  name,
  kind,
}: {
  name: string;
  kind: 'category' | 'collection';
}): string {
  if (kind === 'category') {
    return truncateAtWord(`Handmade ${name} from India | ${SITE_NAME}`, 60);
  }

  return truncateAtWord(`${name} — Handmade in Jaipur | ${SITE_NAME}`, 60);
}

export function buildCollectionDescription({
  name,
  description,
  productCount,
}: {
  name: string;
  description?: string | null;
  productCount?: number;
}): string {
  const source = stripMarkdown(description);
  const summary =
    source || `Handmade by artisan women in Jaipur, India using traditional Kantha and block-print techniques.`;
  const countPart = productCount ? ` Shop ${productCount}+ styles.` : '';

  return truncateAtWord(
    `Explore ${SITE_NAME}'s ${name} collection - ${summary}${countPart} New arrivals added weekly.`,
    155
  );
}

export function createMetadata({
  title,
  description,
  path,
  image,
  keywords = [],
  type = 'website',
  noindex = false,
}: MetadataOptions): Metadata {
  const canonical = toAbsoluteUrl(path);
  const imageUrl = toAbsoluteUrl(image || DEFAULT_OG_IMAGE);
  const trimmedTitle = truncateAtWord(title, 60);
  const trimmedDescription = truncateAtWord(description, 155);

  return {
    title: trimmedTitle,
    description: trimmedDescription,
    keywords,
    alternates: {
      canonical,
    },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      type,
      url: canonical,
      title: trimmedTitle,
      description: trimmedDescription,
      siteName: SITE_NAME,
      locale: 'en_IN',
      images: [
        {
          url: imageUrl,
          alt: trimmedTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: trimmedTitle,
      description: trimmedDescription,
      images: [imageUrl],
    },
  };
}

export function buildHomepageMetadata(): Metadata {
  return createMetadata({
    title: 'Handmade Kantha Quilts, Bags & Clothing from India | Kvastram',
    description:
      'Kvastram — handmade kantha quilts, block-print clothing and artisan bags made by skilled women in Jaipur, India. Ships to USA, UK, EU, Australia and 50+ countries.',
    path: '/',
    image: DEFAULT_OG_IMAGE,
    keywords: [
      'kantha quilt handmade India',
      'artisan Indian bags',
      'block print clothing India',
      'fair trade handmade Indian textiles',
    ],
  });
}

export function buildCatalogMetadata(): Metadata {
  return createMetadata({
    title: 'Shop Handmade Kantha Quilts, Bags & Clothing | Kvastram',
    description:
      'Browse handmade kantha quilts, block-print clothing, artisan bags and scarves — each piece hand-stitched by skilled women in Jaipur, India. Ships worldwide.',
    path: '/products',
    image: DEFAULT_OG_IMAGE,
    keywords: [
      'kantha quilt buy online',
      'handmade Indian clothing',
      'artisan Indian bags',
      'block print clothing',
    ],
  });
}

export function buildCollectionMetadata({
  name,
  path,
  description,
  image,
  kind,
  keywords = [],
}: CollectionMetadataOptions): Metadata {
  const keywordBundle = getCategoryKeywordBundle(name);

  return createMetadata({
    title: buildCollectionTitle({ name, kind }),
    description,
    path,
    image,
    keywords: keywords.length > 0 ? keywords : [keywordBundle.primary, ...keywordBundle.secondary],
  });
}

export function buildBasicPageMetadata({
  title,
  description,
  path,
  image,
  keywords = [],
}: Omit<MetadataOptions, 'type' | 'noindex'>): Metadata {
  return createMetadata({
    title,
    description,
    path,
    image,
    keywords,
  });
}

export function buildArticleMetadata({
  title,
  description,
  path,
  image,
  keywords = [],
}: Omit<MetadataOptions, 'type' | 'noindex'>): Metadata {
  return createMetadata({
    title,
    description,
    path,
    image,
    keywords,
    type: 'article',
  });
}

export function buildProductMetadata(product: Product): Metadata {
  return createMetadata({
    title: buildProductSeoTitle(product),
    description: buildProductMetaDescription(product),
    path: getProductPath(product),
    image: product.thumbnail || product.images?.[0]?.url || DEFAULT_OG_IMAGE,
    keywords: buildProductKeywords(product),
  });
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: toAbsoluteUrl('/favicon.ico'),
    sameAs: [
      'https://instagram.com/kvastram',
      'https://facebook.com/kvastram',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi'],
      email: 'support@kvastram.com',
    },
  };
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

export function buildProductJsonLd(product: Product) {
  const price = getProductPrice(product);
  const images =
    product.images?.map((image) => toAbsoluteUrl(image.url)) ||
    (product.thumbnail ? [toAbsoluteUrl(product.thumbnail)] : []);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: images,
    description: buildProductMetaDescription(product),
    sku: product.variants?.[0]?.sku || undefined,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    category: getProductCategoryLabel(product),
    offers: price
      ? {
          '@type': 'Offer',
          url: toAbsoluteUrl(getProductPath(product)),
          priceCurrency: price.currencyCode,
          price: price.amountInMajor,
          availability:
            (product.variants?.[0]?.inventory_quantity || 0) > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: SITE_NAME,
          },
        }
      : undefined,
    aggregateRating:
      product.avg_rating && product.review_count
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.avg_rating,
            reviewCount: product.review_count,
          }
        : undefined,
  };
}

export function buildCollectionPageJsonLd({
  name,
  path,
  description,
  image,
  items,
}: {
  name: string;
  path: string;
  description: string;
  image?: string | null;
  items?: Array<{ name: string; path: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: toAbsoluteUrl(path),
    description,
    image: image ? toAbsoluteUrl(image) : undefined,
    mainEntity:
      items && items.length > 0
        ? {
            '@type': 'ItemList',
            itemListElement: items.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.name,
              url: toAbsoluteUrl(item.path),
            })),
          }
        : undefined,
  };
}

export function buildWebPageJsonLd({
  title,
  path,
  description,
}: {
  title: string;
  path: string;
  description: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url: toAbsoluteUrl(path),
    description,
  };
}

export function buildArticleJsonLd({
  title,
  path,
  description,
  image,
  publishedAt,
  updatedAt,
}: {
  title: string;
  path: string;
  description: string;
  image?: string | null;
  publishedAt?: string;
  updatedAt?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image ? [toAbsoluteUrl(image)] : [],
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: toAbsoluteUrl('/favicon.ico'),
      },
    },
    mainEntityOfPage: toAbsoluteUrl(path),
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
  };
}

export function serializeJsonLd(
  payload: Record<string, unknown> | Array<Record<string, unknown>>
): string {
  return JSON.stringify(payload)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E');
}

export function buildProductSeoContent(product: Product) {
  const primaryKeyword = buildProductPrimaryKeyword(product);
  const category = getProductCategoryLabel(product);
  const material = getProductMaterial(product);
  const price = getProductPrice(product);
  const categoryLink = getCategoryPath(getPrimaryCategory(product) || {});
  const collectionLink = product.collection
    ? `/collections/${product.collection.handle || product.collection.id}`
    : null;
  const cleanDescription = stripMarkdown(product.description);
  const firstSentence =
    cleanDescription.split('. ').find(Boolean) ||
    `${product.title} is designed for women who want handcrafted Indian style with polished everyday versatility.`;

  return {
    primaryKeyword,
    intro: `${product.title} is a handmade ${category.toLowerCase()} from ${SITE_NAME}, crafted in ${material.toLowerCase()} by skilled artisan women in Jaipur, India. ${firstSentence} Each piece is one of a kind — no two are identical because every stitch is placed by hand. This makes a beautiful gift and a lasting everyday piece. Free worldwide shipping on orders over $75.`,
    bullets: [
      { label: 'Fabric', value: material },
      {
        label: 'Craft',
        value:
          cleanDescription.split('. ').find(Boolean) ||
          'Handmade by artisan women in Jaipur',
      },
      { label: 'Made in', value: 'Jaipur, India' },
      {
        label: 'Fit',
        value: product.options?.some((option) => option.title === 'Size')
          ? 'Regular'
          : 'Relaxed',
      },
      {
        label: 'Care',
        value: product.care_instructions || 'Dry clean or gentle hand wash',
      },
      {
        label: 'Price',
        value: price?.display || 'Contact for pricing',
      },
    ],
    styling: `Ships from Jaipur, India in tracked packaging. Arrives in 10–18 business days. ${
      categoryLink
        ? `Browse more ${getPrimaryCategory(product)?.name || category} pieces in our handmade collection.`
        : 'Explore more handmade pieces from our Jaipur workshop.'
    }`,
    categoryLink,
    collectionLink,
  };
}
