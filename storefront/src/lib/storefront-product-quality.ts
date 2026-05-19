import type { Product, ProductImage, ProductVariant } from '@/types';
import { getProductDisplayTitle } from '@/lib/product-title';

const PLACEHOLDER_TITLE_PATTERN =
  /\b(test|dummy|sample|placeholder|lorem|hhj|asdf|untitled)\b/i;

function hasUsableTitle(product: Product) {
  const title = getProductDisplayTitle(product.title || '').trim();
  return title.length > 2 && !PLACEHOLDER_TITLE_PATTERN.test(title);
}

export function hasProductMedia(product: Product) {
  if (product.thumbnail?.trim()) return true;
  return Boolean(
    product.images?.some((image: ProductImage) => image.url?.trim())
  );
}

export function getProductPrimaryImage(product: Product) {
  return (
    product.thumbnail?.trim() ||
    product.images?.find((image: ProductImage) => image.url?.trim())?.url?.trim() ||
    null
  );
}

export function hasSellablePrice(product: Product) {
  if (product.price_type === 'on_request') return false;

  return Boolean(
    product.variants?.some((variant: ProductVariant) =>
      variant.prices?.some((price) => Number(price.amount) > 0)
    )
  );
}

export function isStorefrontProductReady(product: Product) {
  return Boolean(
    product?.id &&
      product.status === 'published' &&
      product.handle?.trim() &&
      hasUsableTitle(product) &&
      hasProductMedia(product) &&
      hasSellablePrice(product)
  );
}

export function filterStorefrontReadyProducts(products: Product[] = []) {
  return products.filter(isStorefrontProductReady);
}

export function getProductReadinessWarnings(product: Product) {
  const warnings: string[] = [];

  if (product.status !== 'published') warnings.push('not published');
  if (!product.handle?.trim()) warnings.push('missing handle');
  if (!hasUsableTitle(product)) warnings.push('placeholder title');
  if (!hasProductMedia(product)) warnings.push('missing image');
  if (!hasSellablePrice(product)) warnings.push('missing sellable price');

  return warnings;
}

export function getStorefrontReadinessScore(product: Product) {
  const checks = [
    product.status === 'published',
    Boolean(product.handle?.trim()),
    hasUsableTitle(product),
    hasProductMedia(product),
    hasSellablePrice(product),
    Boolean(product.description?.trim()),
    Boolean(product.material?.trim() || product.attributes?.some((attribute) => attribute.attribute_code === 'material')),
    Boolean(product.collection?.title || product.categories?.length),
  ];

  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}
