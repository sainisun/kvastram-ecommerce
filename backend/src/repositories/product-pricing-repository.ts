import { eq } from 'drizzle-orm';
import { money_amounts, regions } from '../db/schema';

export type ProductPriceInput = {
  region_id?: string | null;
  currency_code: string;
  amount: number;
};

export function resolveProductPriceRegionId(price: ProductPriceInput, inrRegionId?: string | null) {
  if (price.region_id) return price.region_id;
  if (price.currency_code === 'inr') {
    if (!inrRegionId) throw new Error('INR Region missing in database. Cannot assign price without region_id.');
    return inrRegionId;
  }
  return price.region_id ?? null;
}

export function buildProductPriceRows(variantId: string, prices: ProductPriceInput[], inrRegionId?: string | null) {
  return prices.map((price) => ({
    variant_id: variantId,
    region_id: resolveProductPriceRegionId(price, inrRegionId),
    currency_code: price.currency_code,
    amount: price.amount,
    min_quantity: 1,
  }));
}

export class ProductPricingRepository {
  private async resolveInrRegionId(tx: any, prices: ProductPriceInput[]) {
    if (!prices.some((price) => !price.region_id && price.currency_code === 'inr')) return null;
    const inrRegion = await tx.select({ id: regions.id }).from(regions).where(eq(regions.currency_code, 'inr')).limit(1);
    return inrRegion[0]?.id ?? null;
  }

  async assign(tx: any, variantId: string, prices: ProductPriceInput[] | undefined) {
    if (!prices?.length) return;
    const inrRegionId = await this.resolveInrRegionId(tx, prices);
    await tx.insert(money_amounts).values(buildProductPriceRows(variantId, prices, inrRegionId));
  }

  async replace(tx: any, variantId: string, prices: ProductPriceInput[]) {
    await tx.delete(money_amounts).where(eq(money_amounts.variant_id, variantId));
    if (!prices.length) return;
    await tx.insert(money_amounts).values(
      prices.map((price) => ({
        variant_id: variantId,
        region_id: price.region_id ?? null,
        currency_code: price.currency_code,
        amount: price.amount,
        min_quantity: 1,
      }))
    );
  }
}

export const productPricingRepository = new ProductPricingRepository();
