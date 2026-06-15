import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../../db';
import {
  orders,
  line_items,
  products,
  product_variants,
  discounts,
  customers,
  addresses,
  money_amounts,
  regions,
  discount_usage,
  store_settings,
} from '../../db/schema';
import { eq, and, gte, sql, inArray } from 'drizzle-orm';
import { config } from '../../config';
import { calculateTax, type TaxBreakdown } from '../../utils/tax-calculator';
import { carrierService } from '../../services/carrier-service';
import {
  buildCheckoutPaymentTokenMetadata,
  generateCheckoutPaymentToken,
} from '../../utils/payment-ownership';

const checkoutRouter = new Hono();

// --- SCHEMAS ---

const ValidateCouponSchema = z.object({
  code: z.string().min(1),
  cart_total: z.number().min(0), // in cents
});

const ShippingOptionsQuerySchema = z.object({
  country_code: z.string().length(2),
  region_id: z.string().uuid().optional(),
  postal_code: z.string().min(3).max(20).optional(),
});

const PlaceOrderSchema = z.object({
  region_id: z.string().uuid(),
  currency_code: z.string().length(3),
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  shipping_address: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    address_1: z.string(),
    address_2: z.string().optional(),
    city: z.string(),
    postal_code: z.string(),
    province: z.string().optional(),
    country_code: z.string(),
    phone: z.string().optional(),
  }),
  billing_address: z
    .object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      address_1: z.string(),
      address_2: z.string().optional(),
      city: z.string(),
      postal_code: z.string(),
      province: z.string().optional(),
      country_code: z.string(),
      phone: z.string().optional(),
    })
    .optional(),
  items: z
    .array(
      z.object({
        variant_id: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  discount_code: z.string().min(1).max(50).optional(),
});

// --- HELPERS ---

// Sanitize checkout body to remove PII before logging
const sanitizeCheckoutBody = (data: z.infer<typeof PlaceOrderSchema>): any => {
  const safe: any = { ...data };
  const piiFields = [
    'email',
    'phone',
    'first_name',
    'last_name',
    'address',
    'payment_info',
    'card',
  ];
  for (const field of piiFields) {
    if (safe[field]) safe[field] = '[REDACTED]';
  }
  if (safe.shipping_address)
    safe.shipping_address =
      '[REDACTED]' as unknown as typeof safe.shipping_address;
  if (safe.billing_address)
    safe.billing_address =
      '[REDACTED]' as unknown as typeof safe.billing_address;
  return safe;
};

const validateDiscount = async (
  code: string,
  cartTotal: number,
  customerId: string | null
) => {
  const now = new Date();

  // Find discount
  const [discount] = await db
    .select()
    .from(discounts)
    .where(eq(discounts.code, code.toUpperCase()))
    .limit(1);

  if (!discount) {
    throw new Error('Invalid discount code');
  }

  if (!discount.is_active) {
    throw new Error('Discount code is inactive');
  }

  // Check dates
  if (discount.starts_at && discount.starts_at > now) {
    throw new Error('Discount code is not active yet');
  }
  if (discount.ends_at && discount.ends_at < now) {
    throw new Error('Discount code has expired');
  }

  // Check usage limits (total)
  if (
    discount.usage_limit !== null &&
    (discount.usage_count || 0) >= discount.usage_limit
  ) {
    throw new Error('Discount usage limit reached');
  }

  // 🔒 FIX-006: Check per-customer usage limit
  // Only check if customer is logged in (has customerId)
  if (customerId) {
    const [existingUsage] = await db
      .select({ discount_id: discount_usage.discount_id })
      .from(discount_usage)
      .where(
        and(
          eq(discount_usage.discount_id, discount.id),
          eq(discount_usage.customer_id, customerId)
        )
      )
      .limit(1);

    if (existingUsage) {
      throw new Error('You have already used this discount code');
    }
  }

  // Check min purchase
  if (
    discount.min_purchase_amount &&
    cartTotal < discount.min_purchase_amount
  ) {
    throw new Error(
      `Minimum purchase of ${(discount.min_purchase_amount / 100).toFixed(2)} required`
    );
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (discount.type === 'percentage') {
    discountAmount = Math.round((cartTotal * discount.value) / 100);
  } else if (discount.type === 'fixed_amount') {
    discountAmount = discount.value;
  } else if (discount.type === 'free_shipping') {
    discountAmount = 0;
  }

  // Cap at cart total
  if (discountAmount > cartTotal) discountAmount = cartTotal;

  return { discount, discountAmount };
};

function getDefaultShippingOptions(input: {
  countryCode: string;
  currencyCode: string;
  domesticRate: number;
  intlRate: number;
  freeThreshold: number;
}) {
  const isDomestic = input.countryCode === 'IN';
  const baseRate = isDomestic ? input.domesticRate : input.intlRate;

  return {
    options: [
      {
        id: isDomestic ? 'domestic-standard' : 'international-standard',
        name: isDomestic ? 'Standard Shipping' : 'Standard International Shipping',
        description: isDomestic ? 'Final ETA confirmed at checkout' : 'Tracked delivery with final ETA at checkout',
        price: baseRate,
        estimated_days: isDomestic ? '3-7' : '7-14',
        currency_code: input.currencyCode,
      },
      {
        id: isDomestic ? 'domestic-priority' : 'international-priority',
        name: isDomestic ? 'Priority Shipping' : 'Priority International Shipping',
        description: isDomestic ? 'Faster dispatch when available' : 'Faster international processing when available',
        price: Math.round(baseRate * 1.45),
        estimated_days: isDomestic ? '2-5' : '5-10',
        currency_code: input.currencyCode,
      },
    ],
    free_shipping_threshold: input.freeThreshold,
    currency_code: input.currencyCode,
  };
}

// --- ROUTES ---

// GET /store/checkout/shipping-options
checkoutRouter.get(
  '/shipping-options',
  zValidator('query', ShippingOptionsQuerySchema),
  async (c) => {
    try {
      const { country_code, region_id, postal_code } = c.req.valid('query');
      const countryCode = country_code.toUpperCase();

      const allSettings = await db.select().from(store_settings);
      const settingsMap = allSettings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, any>);

      const [region] = region_id
        ? await db
            .select({ id: regions.id, currency_code: regions.currency_code })
            .from(regions)
            .where(eq(regions.id, region_id))
            .limit(1)
        : [];

      const domesticRate =
        (Number.isFinite(Number(settingsMap['domestic_shipping_rate']))
          ? Number(settingsMap['domestic_shipping_rate'])
          : 10) * 100;
      const intlRate =
        (Number.isFinite(Number(settingsMap['international_shipping_rate']))
          ? Number(settingsMap['international_shipping_rate'])
          : 30) * 100;
      const freeThreshold =
        (Number.isFinite(Number(settingsMap['free_shipping_threshold']))
          ? Number(settingsMap['free_shipping_threshold'])
          : 100) * 100;
      const allowedCountries: string[] = (
        settingsMap['shipping_countries'] || 'IN, US, CA, GB, AE'
      )
        .split(',')
        .map((value: string) => value.trim().toUpperCase())
        .filter(Boolean);

      if (!allowedCountries.includes(countryCode)) {
        return c.json(
          {
            options: [],
            free_shipping_threshold: freeThreshold,
            currency_code: region?.currency_code?.toUpperCase() || 'INR',
            serviceability: {
              checked: Boolean(postal_code),
              live: false,
              serviceable: false,
              message: `Shipping is currently unavailable to ${countryCode}.`,
            },
          },
          200
        );
      }

      const fallback = getDefaultShippingOptions({
        countryCode,
        currencyCode: region?.currency_code?.toUpperCase() || 'INR',
        domesticRate,
        intlRate,
        freeThreshold,
      });

      if (!postal_code || countryCode !== 'IN') {
        return c.json({
          ...fallback,
          serviceability: {
            checked: Boolean(postal_code),
            live: false,
            serviceable: null,
            message:
              countryCode === 'IN'
                ? 'Add your postal code for a better India delivery preview.'
                : 'Final courier availability and delivery timing are confirmed at checkout.',
          },
        });
      }

      const previewOrder = {
        email: 'preview@kvastram.com',
        payment_status: 'paid',
        shipping_address: {
          first_name: 'Preview',
          last_name: 'Customer',
          address_1: 'Preview address',
          city: 'Preview city',
          postal_code,
          country_code: countryCode,
          phone: '9999999999',
        },
        workflow: {
          label: {
            package_weight_grams: 500,
            package_length_cm: 25,
            package_width_cm: 20,
            package_height_cm: 4,
          },
        },
      };

      try {
        const liveRates = await carrierService.getRates(previewOrder);
        if (liveRates.rates.length > 0) {
          const liveCurrency =
            liveRates.rates[0]?.currency ||
            region?.currency_code?.toUpperCase() ||
            'INR';
          return c.json({
            options: liveRates.rates.map((rate) => ({
              id: rate.id,
              name: rate.service,
              description: rate.estimated_delivery_days
                ? `Estimated ${rate.estimated_delivery_days} day delivery`
                : 'Courier ETA confirmed at checkout',
              price: rate.amount,
              estimated_days: rate.estimated_delivery_days
                ? String(rate.estimated_delivery_days)
                : '',
              currency_code: rate.currency,
            })),
            free_shipping_threshold: freeThreshold,
            currency_code: liveCurrency,
            serviceability: {
              checked: true,
              live: true,
              serviceable: true,
              message:
                liveRates.message ||
                'Serviceability preview found live courier options for this postal code.',
            },
          });
        }

        return c.json({
          ...fallback,
          serviceability: {
            checked: true,
            live: true,
            serviceable: false,
            message:
              liveRates.message ||
              'No live courier options were returned for this postal code preview.',
          },
        });
      } catch (error: any) {
        return c.json({
          ...fallback,
          serviceability: {
            checked: true,
            live: false,
            serviceable: null,
            message:
              error?.message ||
              'Live serviceability preview is not available right now. Final shipping is still confirmed at checkout.',
          },
        });
      }
    } catch (error: any) {
      return c.json({ error: error.message || 'Failed to load shipping options' }, 400);
    }
  }
);

// POST /store/checkout/validate-coupon
checkoutRouter.post(
  '/validate-coupon',
  zValidator('json', ValidateCouponSchema),
  async (c) => {
    try {
      const { code, cart_total } = c.req.valid('json');

      const { discount, discountAmount } = await validateDiscount(
        code,
        cart_total,
        null // validate-coupon doesn't require customer check
      );

      return c.json({
        valid: true,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        discount_amount: discountAmount,
      });
    } catch (error: any) {
      return c.json({ valid: false, message: error.message }, 400);
    }
  }
);

// POST /store/checkout/place-order
checkoutRouter.post(
  '/place-order',
  zValidator('json', PlaceOrderSchema),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const { region_id, currency_code } = body;

      if (process.env.NODE_ENV !== 'production') {
        console.log(
          '[CHECKOUT] Order request:',
          JSON.stringify(sanitizeCheckoutBody(body))
        );
      }

      // Fetch store settings for shipping and tax
      const allSettings = await db.select().from(store_settings);
      const settingsMap = allSettings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, any>);

      // Fetch region for baseline tax
      const [region] = await db
        .select({ tax_rate: regions.tax_rate })
        .from(regions)
        .where(eq(regions.id, region_id))
        .limit(1);

      if (!region) {
        return c.json({ error: 'Region not found' }, 400);
      }

      // Merge dynamic settings with NaN-safe coercion
      const parsedGlobalTax = parseFloat(settingsMap['tax_rate']);
      const globalTaxRate = Number.isFinite(parsedGlobalTax) ? parsedGlobalTax : config.tax.defaultRate;
      const parsedRegionTax = parseFloat(region.tax_rate as string);
      const taxRate = Number.isFinite(globalTaxRate) && globalTaxRate > 0
        ? globalTaxRate
        : (Number.isFinite(parsedRegionTax) ? parsedRegionTax : 0);

      const domesticRate = (Number.isFinite(Number(settingsMap['domestic_shipping_rate'])) ? Number(settingsMap['domestic_shipping_rate']) : 10) * 100;
      const intlRate = (Number.isFinite(Number(settingsMap['international_shipping_rate'])) ? Number(settingsMap['international_shipping_rate']) : 30) * 100;
      const freeThreshold = (Number.isFinite(Number(settingsMap['free_shipping_threshold'])) ? Number(settingsMap['free_shipping_threshold']) : 100) * 100;
      
      // Determine shipping country
      const destCountry = body.shipping_address.country_code.toUpperCase();
      const allowedCountries: string[] = (settingsMap['shipping_countries'] || 'US, CA').split(',').map((s: string) => s.trim().toUpperCase());
      
      if (!allowedCountries.includes(destCountry)) {
         return c.json({ error: `Shipping is not available to ${destCountry}` }, 400);
      }

      // 1. Validate Items & Calculate Subtotal
      let subtotal = 0;
      interface ValidatedItem {
        id: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        product_title: string | null;
        variant_title: string;
        thumbnail: string | null;
      }
      const validatedItems: ValidatedItem[] = [];

      // Batch fetch all variants in ONE query to avoid N+1 problem
      const variantIds = body.items.map((item) => item.variant_id);
      type VariantRow = {
        id: string;
        price: number | null;
        product_id: string;
        product_title: string | null;
        thumbnail: string | null;
        variant_title: string;
        inventory_quantity: number | null;
      };
      const variantsMap = new Map<string, VariantRow>();

      if (variantIds.length > 0) {
        const allVariants = await db
          .select({
            id: product_variants.id,
            price: money_amounts.amount,
            product_id: product_variants.product_id,
            product_title: products.title,
            thumbnail: products.thumbnail,
            variant_title: product_variants.title,
            inventory_quantity: product_variants.inventory_quantity,
          })
          .from(product_variants)
          .leftJoin(
            money_amounts,
            and(
              eq(money_amounts.variant_id, product_variants.id),
              eq(money_amounts.region_id, region_id)
            )
          )
          .leftJoin(products, eq(product_variants.product_id, products.id))
          .where(inArray(product_variants.id, variantIds));

        // Store in map for O(1) lookup
        for (const v of allVariants) {
          variantsMap.set(v.id, v);
        }
      }

      // Now validate each item using the map
      for (const item of body.items) {
        const variant = variantsMap.get(item.variant_id);

        if (!variant) {
          return c.json({ error: `Variant ${item.variant_id} not found` }, 400);
        }

        // Check inventory
        const availableQty = variant.inventory_quantity ?? 0;
        if (availableQty < item.quantity) {
          return c.json(
            {
              error: `Insufficient stock for ${variant.variant_title}. Available: ${availableQty}`,
            },
            400
          );
        }

        // Check if price valid for region
        if (variant.price === null || variant.price === undefined) {
          return c.json(
            {
              error: `Variant ${item.variant_id} not priced for region ${region_id}`,
            },
            400
          );
        }

        const unitPrice = variant.price;
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        validatedItems.push({
          id: variant.id,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
          product_title: variant.product_title,
          variant_title: variant.variant_title,
          thumbnail: variant.thumbnail,
        });
      }

      // 2. Pre-validate Discount (dates, min_purchase, active check — no usage count check here)
      // Usage limit enforcement is re-checked atomically inside the transaction to prevent race conditions.
      let discountTotal = 0;
      let finalDiscountId = null;
      let discount: typeof discounts.$inferSelect | null = null;

      if (body.discount_code) {
        try {
          const result = await validateDiscount(
            body.discount_code,
            subtotal,
            null // Per-customer check done inside transaction
          );
          discount = result.discount;
          discountTotal = result.discountAmount;
          finalDiscountId = discount.id;
        } catch (e: any) {
          return c.json({ error: `Invalid discount: ${e.message}` }, 400);
        }
      }

      // 3. Calculate Totals
      let shippingTotal = 0;
      if (subtotal < freeThreshold) {
        shippingTotal = destCountry === 'US' ? domesticRate : intlRate;
      }

      // Tax is calculated on the discounted subtotal (post-discount), not gross subtotal
      const taxableAmount = Math.max(0, subtotal - discountTotal);
      const taxBreakdown: TaxBreakdown = calculateTax(taxableAmount, taxRate);
      const taxTotal = taxBreakdown.total;
      const total = taxableAmount + shippingTotal + taxTotal;

      // 4. Create Order Transaction
      let newOrder: typeof orders.$inferSelect | undefined;
      const checkoutPaymentToken = generateCheckoutPaymentToken();

      await db.transaction(async (tx) => {
        // Find or Create Customer
        let customerId: string | null = null;
        const [existingCustomer] = await tx
          .select()
          .from(customers)
          .where(eq(customers.email, body.email))
          .limit(1);

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // For guest checkout, create a minimal customer record.
          // ON CONFLICT DO NOTHING prevents duplicate inserts in concurrent requests.
          const customerData: Record<string, unknown> = {
            email: body.email,
            has_account: false,
          };
          if (body.first_name) customerData.first_name = body.first_name;
          if (body.last_name) customerData.last_name = body.last_name;
          if (body.phone) customerData.phone = body.phone;

          const inserted = await tx
            .insert(customers)
            .values(customerData)
            .onConflictDoNothing()
            .returning();

          if (inserted.length > 0) {
            customerId = inserted[0].id;
          } else {
            // Another concurrent request inserted the same email — fetch it
            const [raceCustomer] = await tx
              .select()
              .from(customers)
              .where(eq(customers.email, body.email))
              .limit(1);
            customerId = raceCustomer?.id ?? null;
          }
        }

        // Create Address - only include defined values
        const addressFields = [
          'first_name',
          'last_name',
          'address_1',
          'address_2',
          'city',
          'postal_code',
          'province',
          'country_code',
          'phone',
        ];
        const addressData: any = { customer_id: customerId };

        for (const field of addressFields) {
          const value =
            body.shipping_address[field as keyof typeof body.shipping_address];
          if (value !== undefined && value !== null && value !== '') {
            addressData[field] = value;
          }
        }

        const [shAddr] = await tx
          .insert(addresses)
          .values(addressData)
          .returning();

        // Create Order - only include defined values
        const orderData: any = {
          email: body.email,
          region_id: region_id,
          currency_code: currency_code,
          status: 'pending',
          payment_status: 'awaiting',
          fulfillment_status: 'not_fulfilled',
          subtotal,
          shipping_total: shippingTotal,
          tax_total: taxTotal,
          total,
          shipping_address_id: shAddr.id,
          metadata: {
            ...buildCheckoutPaymentTokenMetadata(checkoutPaymentToken),
            tax_rate: taxBreakdown.rate,
            tax_breakdown: {
              gross_subtotal: subtotal,
              discount_total: discountTotal,
              taxable_amount: taxableAmount,
              cgst: taxBreakdown.cgst,
              sgst: taxBreakdown.sgst,
              total: taxBreakdown.total,
              calculated_at: new Date().toISOString(),
            },
          },
        };

        // Only add optional fields if they have values
        if (customerId) orderData.customer_id = customerId;
        if (discountTotal > 0) orderData.discount_total = discountTotal;
        if (finalDiscountId) orderData.discount_id = finalDiscountId;

        const [order] = await tx.insert(orders).values(orderData).returning();

        newOrder = order;

        // Create Line Items
        // title is NOT NULL in schema — always provide a fallback value
        for (const item of validatedItems) {
          await tx.insert(line_items).values({
            order_id: order.id,
            variant_id: item.id,
            title: item.product_title ?? item.variant_title ?? 'Product',
            description: item.variant_title || null,
            thumbnail: item.thumbnail || null,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.lineTotal,
          });
        }

        // 🔒 RACE-FIX: Deduct inventory atomically — single UPDATE with WHERE inventory >= quantity.
        // If 0 rows are affected, another concurrent order grabbed the last stock.
        for (const item of validatedItems) {
          const updated = await tx
            .update(product_variants)
            .set({
              inventory_quantity: sql`${product_variants.inventory_quantity} - ${item.quantity}`,
            })
            .where(
              and(
                eq(product_variants.id, item.id),
                gte(product_variants.inventory_quantity, item.quantity)
              )
            )
            .returning({ id: product_variants.id });

          if (updated.length === 0) {
            throw new Error(
              `Insufficient stock for ${item.variant_title}. Please refresh and try again.`
            );
          }
        }

        // Handle discount usage — re-validate usage limit inside transaction to prevent race conditions
        if (finalDiscountId) {
          // 🔒 RACE-FIX: Atomic increment only if under usage_limit
          const usageUpdateResult = await tx.execute(sql`
            UPDATE discounts
            SET usage_count = COALESCE(usage_count, 0) + 1
            WHERE id = ${finalDiscountId}
              AND (usage_limit IS NULL OR COALESCE(usage_count, 0) < usage_limit)
            RETURNING id
          `);

          if ((usageUpdateResult.rows?.length ?? 0) === 0) {
            throw new Error('Discount usage limit reached. Please remove the code and try again.');
          }

          // Per-customer usage — only track if customer is logged in
          if (customerId) {
            // Check customer hasn't already used it (race condition guard)
            const [alreadyUsed] = await tx
              .select({ id: discount_usage.discount_id })
              .from(discount_usage)
              .where(and(
                eq(discount_usage.discount_id, finalDiscountId),
                eq(discount_usage.customer_id, customerId)
              ))
              .limit(1);

            if (alreadyUsed) {
              throw new Error('You have already used this discount code.');
            }

            await tx.insert(discount_usage).values({
              discount_id: finalDiscountId,
              customer_id: customerId,
              order_id: order.id,
            });
          }
        }
      });

      if (!newOrder) {
        throw new Error('Failed to create order');
      }

      // 5. Send order confirmation email
      try {
        const { emailService } = await import('../../services/email-service');
        if (newOrder.display_id) {
          await emailService.sendOrderConfirmation(
            {
              ...newOrder,
              order_number: newOrder.display_id.toString(),
            },
            newOrder.email
          );
          console.log(
            `Order Confirmation sent for order #${newOrder.display_id}`
          );
        }
      } catch (emailError: unknown) {
        console.error('Failed to send order confirmation email:', emailError);
      }

      // 6. Send WhatsApp notification to admin
      try {
        const { sendWhatsAppNotification } = await import('../admin/whatsapp');
        const orderWithItems = await db.query.orders.findFirst({
          where: eq(orders.id, newOrder.id),
          with: {
            items: true,
          },
        });

        if (orderWithItems) {
          await sendWhatsAppNotification('order', {
            ...orderWithItems,
            display_id: newOrder.display_id,
            total: newOrder.total,
          });
        }
      } catch (whatsappError: unknown) {
        console.error('Failed to send WhatsApp notification:', whatsappError);
      }

      const publicOrder = {
        ...newOrder,
        metadata: {
          ...((newOrder.metadata as Record<string, any>) || {}),
        },
      };
      delete publicOrder.metadata.checkout_payment_token_hash;
      delete publicOrder.metadata.checkout_payment_token_issued_at;
      delete publicOrder.metadata.checkout_payment_token_expires_at;

      return c.json({
        order: publicOrder,
        checkout_payment_token: checkoutPaymentToken,
      });
    } catch (error: any) {
      console.error('Checkout error:', error);

      // Return 400 for validation/inventory errors, 500 for server errors
      const isValidationError =
        error.message.includes('Insufficient stock') ||
        error.message.includes('Product not found') ||
        error.message.includes('Invalid discount');

      return c.json({ error: error.message }, isValidationError ? 400 : 500);
    }
  }
);

export default checkoutRouter;
