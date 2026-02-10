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
} from "../../db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

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

const validateDiscount = async (code: string, cartTotal: number) => {
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

  // Check usage limits
  if (
    discount.usage_limit !== null &&
    (discount.usage_count || 0) >= discount.usage_limit
  ) {
    throw new Error("Discount usage limit reached");
  }

  // Check min purchase
  if (
    discount.min_purchase_amount &&
    cartTotal < discount.min_purchase_amount
  ) {
    throw new Error(
      `Minimum purchase of $${(discount.min_purchase_amount / 100).toFixed(2)} required`,
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

      // 2. Validate Discount
      let discountTotal = 0;
      let finalDiscountId = null;

      if (body.discount_code) {
        try {
          const { discount, discountAmount } = await validateDiscount(
            body.discount_code,
            subtotal,
          );
          discountTotal = discountAmount;
          finalDiscountId = discount.id;
        } catch (e: any) {
          return c.json({ error: `Invalid discount: ${e.message}` }, 400);
        }
      }

      // 3. Calculate Totals
      const shippingTotal = 0;
      const taxTotal = 0;
      const total = subtotal + shippingTotal + taxTotal - discountTotal;

      // 4. Create Order Transaction
      let newOrder: typeof orders.$inferSelect | undefined;

      await db.transaction(async (tx) => {
        // Find or Create Customer
        let customerId = null;
        const [existingCustomer] = await tx
          .select()
          .from(customers)
          .where(eq(customers.email, body.email))
          .limit(1);

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const [newCust] = await tx
            .insert(customers)
            .values({
              email: body.email,
              first_name: body.first_name,
              last_name: body.last_name,
              phone: body.phone,
              has_account: false, // Guest
            })
            .returning();
          customerId = newCust.id;
        }

        // Create Addresses
        const [shAddr] = await tx
          .insert(addresses)
          .values({
            customer_id: customerId,
            ...body.shipping_address,
          })
          .returning();

        // Create Order
        const [order] = await tx
          .insert(orders)
          .values({
            customer_id: customerId,
            email: body.email,
            region_id: region_id,
            currency_code: currency_code,
            status: "pending",
            payment_status: "awaiting",
            fulfillment_status: "not_fulfilled",
            subtotal,
            discount_total: discountTotal,
            shipping_total: shippingTotal,
            tax_total: taxTotal,
            total,
            shipping_address_id: shAddr.id,
            discount_id: finalDiscountId,
            metadata: {},
          })
          .returning();

        newOrder = order;

        // Create Line Items
        for (const item of validatedItems) {
          await tx.insert(line_items).values({
            order_id: order.id,
            variant_id: item.id,
            title: item.product_title || "Item",
            description: item.variant_title,
            thumbnail: item.thumbnail,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.lineTotal,
          });
        }

        // Increment Discount Usage & Update Campaign Stats
        if (finalDiscountId) {
          // Update discount usage
          await tx.execute(sql`
                     UPDATE discounts
                     SET usage_count = COALESCE(usage_count, 0) + 1
                     WHERE id = ${finalDiscountId}
                 `);

          // Check for campaign and update stats
          const [usedDiscount] = await tx
            .select()
            .from(discounts)
            .where(eq(discounts.id, finalDiscountId));

          if (usedDiscount && usedDiscount.campaign_id) {
            await tx.execute(sql`
                         UPDATE campaigns
                         SET
                             revenue = COALESCE(revenue, 0) + ${total},
                             conversions = COALESCE(conversions, 0) + 1
                         WHERE id = ${usedDiscount.campaign_id}
                     `);
          }
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
      return c.json({ error: error.message }, 500);
    }
  },
);

export default checkoutRouter;
