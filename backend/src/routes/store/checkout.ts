import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../../db";
import {
  orders,
  line_items,
  products,
  product_variants,
  discounts,
  customers,
  addresses,
  money_amounts,
  campaigns,
  regions,
  discount_usage,
} from "../../db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { config } from "../../config";
import { calculateTax, type TaxBreakdown } from "../../utils/tax-calculator";

const checkoutRouter = new Hono();

// --- SCHEMAS ---

const ValidateCouponSchema = z.object({
  code: z.string().min(1),
  cart_total: z.number().min(0), // in cents
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
      }),
    )
    .min(1),
  discount_code: z.string().optional(),
});

// --- HELPERS ---

const validateDiscount = async (code: string, cartTotal: number, customerId: string | null) => {
  const now = new Date();

  // Find discount
  const [discount] = await db
    .select()
    .from(discounts)
    .where(eq(discounts.code, code.toUpperCase()))
    .limit(1);

  if (!discount) {
    throw new Error("Invalid discount code");
  }

  if (!discount.is_active) {
    throw new Error("Discount code is inactive");
  }

  // Check dates
  if (discount.starts_at && discount.starts_at > now) {
    throw new Error("Discount code is not active yet");
  }
  if (discount.ends_at && discount.ends_at < now) {
    throw new Error("Discount code has expired");
  }

  // Check usage limits (total)
  if (
    discount.usage_limit !== null &&
    (discount.usage_count || 0) >= discount.usage_limit
  ) {
    throw new Error("Discount usage limit reached");
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
      throw new Error("You have already used this discount code");
    }
  }

  // Check min purchase
  if (
    discount.min_purchase_amount &&
    cartTotal < discount.min_purchase_amount
  ) {
    throw new Error(
      `Minimum purchase of ${(discount.min_purchase_amount / 100).toFixed(2)} required`,
    );
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (discount.type === "percentage") {
    discountAmount = Math.round((cartTotal * discount.value) / 100);
  } else if (discount.type === "fixed_amount") {
    discountAmount = discount.value;
  } else if (discount.type === "free_shipping") {
    discountAmount = 0;
  }

  // Cap at cart total
  if (discountAmount > cartTotal) discountAmount = cartTotal;

  return { discount, discountAmount };
};

// --- ROUTES ---

// POST /store/checkout/validate-coupon
checkoutRouter.post(
  "/validate-coupon",
  zValidator("json", ValidateCouponSchema),
  async (c) => {
    try {
      const { code, cart_total } = c.req.valid("json");

      const { discount, discountAmount } = await validateDiscount(
        code,
        cart_total,
        null, // validate-coupon doesn't require customer check
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
  },
);

// POST /store/checkout/place-order
checkoutRouter.post(
  "/place-order",
  zValidator("json", PlaceOrderSchema),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const { region_id, currency_code } = body;
      
      console.log('[CHECKOUT] Order request:', JSON.stringify(body));

      // Fetch region for tax rate
      const [region] = await db
        .select({ tax_rate: regions.tax_rate })
        .from(regions)
        .where(eq(regions.id, region_id))
        .limit(1);

      if (!region) {
        return c.json({ error: "Region not found" }, 400);
      }

      const taxRate = parseFloat(region.tax_rate as string) || config.tax.defaultRate;

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

      for (const item of body.items) {
        const [variant] = await db
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
          .where(eq(product_variants.id, item.variant_id))
          .limit(1);

        if (!variant) {
          return c.json({ error: `Variant ${item.variant_id} not found` }, 400);
        }

        // Check inventory
        const availableQty = variant.inventory_quantity ?? 0;
        if (availableQty < item.quantity) {
          return c.json({
            error: `Insufficient stock for ${variant.variant_title}. Available: ${availableQty}`
          }, 400);
        }

        // Check if price valid for region
        if (variant.price === null || variant.price === undefined) {
          return c.json({ error: `Variant ${item.variant_id} not priced for region ${region_id}` }, 400);
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

      // 2. Validate Discount (basic validation - no customer check yet)
      let discountTotal = 0;
      let finalDiscountId = null;
      let discount: typeof discounts.$inferSelect | null = null;

      if (body.discount_code) {
        try {
          const result = await validateDiscount(
            body.discount_code,
            subtotal,
            null, // Will check per-customer inside transaction
          );
          discount = result.discount;
          discountTotal = result.discountAmount;
          finalDiscountId = discount.id;
        } catch (e: any) {
          return c.json({ error: `Invalid discount: ${e.message}` }, 400);
        }
      }

      // 3. Calculate Totals
      const shippingTotal = 0;
      // FIX-005: Use dedicated tax calculator for GST (CGST + SGST)
      const taxBreakdown: TaxBreakdown = calculateTax(subtotal, taxRate);
      const taxTotal = taxBreakdown.total;
      const total = subtotal + shippingTotal + taxTotal - discountTotal;

      // 4. Create Order Transaction
      let newOrder: typeof orders.$inferSelect | undefined;

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
          // For guest checkout, create a minimal customer record
          const customerData: any = { email: body.email };
          if (body.first_name) customerData.first_name = body.first_name;
          if (body.last_name) customerData.last_name = body.last_name;
          if (body.phone) customerData.phone = body.phone;
          customerData.has_account = false;
          
          const [newCust] = await tx
            .insert(customers)
            .values(customerData)
            .returning();
          customerId = newCust.id;
        }

        // Create Address - only include defined values
        const addressFields = ['first_name', 'last_name', 'address_1', 'address_2', 'city', 'postal_code', 'province', 'country_code', 'phone'];
        const addressData: any = { customer_id: customerId };
        
        for (const field of addressFields) {
            const value = body.shipping_address[field as keyof typeof body.shipping_address];
            if (value !== undefined && value !== null && value !== '') {
                (addressData as any)[field] = value;
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
            status: "pending",
            payment_status: "awaiting",
            fulfillment_status: "not_fulfilled",
            subtotal,
            shipping_total: shippingTotal,
            tax_total: taxTotal,
            total,
            shipping_address_id: shAddr.id,
            metadata: {
              tax_rate: taxBreakdown.rate,
              tax_breakdown: {
                subtotal: taxBreakdown.subtotal,
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

        const [order] = await tx
          .insert(orders)
          .values(orderData)
          .returning();

        newOrder = order;

        // Create Line Items - only include defined values
        for (const item of validatedItems) {
            const lineItemData: any = {
                order_id: order.id,
                variant_id: item.id,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total_price: item.lineTotal,
            };
            
            if (item.product_title) lineItemData.title = item.product_title;
            if (item.variant_title) lineItemData.description = item.variant_title;
            if (item.thumbnail) lineItemData.thumbnail = item.thumbnail;
            
            await tx.insert(line_items).values(lineItemData);
        }

        // Deduct inventory
        for (const item of validatedItems) {
          await tx
            .update(product_variants)
            .set({
              inventory_quantity: sql`COALESCE(${product_variants.inventory_quantity}, 0) - ${item.quantity}`
            })
            .where(eq(product_variants.id, item.id));
        }

        // Handle discount usage
        if (finalDiscountId && customerId) {
          await tx.insert(discount_usage).values({
            discount_id: finalDiscountId,
            customer_id: customerId,
            order_id: order.id,
          });

          await tx.execute(sql`
             UPDATE discounts
             SET usage_count = COALESCE(usage_count, 0) + 1
             WHERE id = ${finalDiscountId}
         `);
        }
      });

      if (!newOrder) {
        throw new Error("Failed to create order");
      }

      // 5. Send order confirmation email
      try {
        const { emailService } = await import("../../services/email-service");
        if (newOrder && newOrder.display_id) {
          await emailService.sendOrderConfirmation(
            {
              ...newOrder,
              order_number: newOrder.display_id.toString(),
            },
            newOrder.email,
          );
          console.log(
            `Order Confirmation sent for order #${newOrder.display_id}`,
          );
        }
      } catch (emailError) {
        console.error("Failed to send order confirmation email:", emailError);
      }

      return c.json({ order: newOrder });
    } catch (error: any) {
      console.error("Checkout error:", error);

      // Return 400 for validation/inventory errors, 500 for server errors
      const isValidationError = error.message.includes("Insufficient stock")
        || error.message.includes("Product not found")
        || error.message.includes("Invalid discount");

      return c.json({ error: error.message }, isValidationError ? 400 : 500);
    }
  },
);

export default checkoutRouter;
