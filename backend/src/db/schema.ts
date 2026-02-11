import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  decimal,
  uuid,
  serial,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

// --- UTILS ---
const createdUpdated = {
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  deleted_at: timestamp("deleted_at"),
};

// --- AUTH & USERS (Admins) ---
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  first_name: text("first_name"),
  last_name: text("last_name"),
  role: text("role").default("admin"),
  two_factor_secret: text("two_factor_secret"),
  two_factor_enabled: boolean("two_factor_enabled").default(false),
  ...createdUpdated,
});

// --- PRODUCTS ---
export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
    handle: text("handle").notNull().unique(),
    is_giftcard: boolean("is_giftcard").default(false),
    status: text("status").default("draft"), // draft, published, proposed, rejected
    thumbnail: text("thumbnail"),
    weight: integer("weight"),
    length: integer("length"),
    height: integer("height"),
    width: integer("width"),
    origin_country: text("origin_country"),
    hs_code: text("hs_code"),
    mid_code: text("mid_code"),
    material: text("material"),
    collection_id: uuid("collection_id"),
    type_id: uuid("type_id"),
    discountable: boolean("discountable").default(true),
    metadata: jsonb("metadata"),
    ...createdUpdated,
  },
  (table) => ({
    statusIdx: index("idx_products_status").on(table.status),
    createdAtIndex: index("idx_products_created_at").on(table.created_at),
    collectionIdx: index("idx_products_collection_id").on(table.collection_id),
  }),
);

export const product_variants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    product_id: uuid("product_id")
      .references(() => products.id)
      .notNull(),
    title: text("title").notNull(),
    sku: text("sku"),
    barcode: text("barcode"),
    ean: text("ean"),
    upc: text("upc"),
    inventory_quantity: integer("inventory_quantity").default(0), // Note: Check constraint added via migration, not Drizzle schema
    allow_backorder: boolean("allow_backorder").default(false),
    manage_inventory: boolean("manage_inventory").default(true),
    hs_code: text("hs_code"),
    origin_country: text("origin_country"),
    mid_code: text("mid_code"),
    material: text("material"),
    weight: integer("weight"),
    length: integer("length"),
    height: integer("height"),
    width: integer("width"),
    metadata: jsonb("metadata"),
    ...createdUpdated,
  },
  (table) => ({
    productIdx: index("idx_product_variants_product_id").on(table.product_id),
    // 🔒 FIX-003: Prevent negative inventory at database level
    inventoryCheck: sql`CONSTRAINT chk_inventory_non_negative CHECK (inventory_quantity >= 0)`,
  }),
);

export const product_options = pgTable("product_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  product_id: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  title: text("title").notNull(), // e.g. "Size", "Color"
  metadata: jsonb("metadata"),
  ...createdUpdated,
});

export const product_option_values = pgTable("product_option_values", {
  id: uuid("id").defaultRandom().primaryKey(),
  variant_id: uuid("variant_id")
    .references(() => product_variants.id)
    .notNull(),
  option_id: uuid("option_id")
    .references(() => product_options.id)
    .notNull(),
  value: text("value").notNull(), // e.g. "Large", "Red"
  metadata: jsonb("metadata"),
  ...createdUpdated,
});

export const product_collections = pgTable("product_collections", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  handle: text("handle").notNull().unique(),
  metadata: jsonb("metadata"),
  ...createdUpdated,
});

export const product_images = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  product_id: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  url: text("url").notNull(),
  alt_text: text("alt_text"),
  position: integer("position").default(0),
  // ... existing code ...
  is_thumbnail: boolean("is_thumbnail").default(false),
  metadata: jsonb("metadata"),
  ...createdUpdated,
});

export const product_reviews = pgTable("product_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  product_id: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  customer_id: uuid("customer_id").references(() => customers.id), // Optional for guest reviews if we allow them, or require auth
  rating: integer("rating").notNull(), // 1-5
  title: text("title"),
  content: text("content"),
  status: text("status").default("pending"), // pending, approved, rejected
  author_name: text("author_name").notNull(), // Fallback if no customer_id
  ...createdUpdated,
});

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    image: text("image"),
    is_active: boolean("is_active").default(true),
    parent_id: uuid("parent_id"),
    metadata: jsonb("metadata"),
    ...createdUpdated,
  },
  (table) => ({
    parentIdx: index("idx_categories_parent_id").on(table.parent_id),
  }),
);

// Self-reference must be handled carefully or via relations if circular reference occurs in declaration
// But here parent_id is just a uuid column. The FK constraint can be added if needed, or handled via relations.
// For now let's keep it simple.

export const product_categories = pgTable(
  "product_categories",
  {
    product_id: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    category_id: uuid("category_id")
      .references(() => categories.id, { onDelete: "cascade" })
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.product_id, t.category_id] }),
  }),
);

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  metadata: jsonb("metadata"),
  ...createdUpdated,
});

export const product_tags = pgTable(
  "product_tags",
  {
    product_id: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    tag_id: uuid("tag_id")
      .references(() => tags.id, { onDelete: "cascade" })
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.product_id, t.tag_id] }),
  }),
);

// --- INTERNATIONALIZATION ---

export const regions = pgTable("regions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // e.g. "North America", "Europe"
  currency_code: text("currency_code").notNull(), // e.g. "usd", "eur"
  tax_rate: decimal("tax_rate").default("0"),
  tax_code: text("tax_code"),
  payment_providers: text("payment_providers"), // Comma separated IDs
  fulfillment_providers: text("fulfillment_providers"), // Comma separated IDs
  countries: jsonb("countries"), // Array of country ISO codes, e.g. ["IN", "US"]
  metadata: jsonb("metadata"),
  ...createdUpdated,
});

export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  iso_2: text("iso_2").notNull().unique(), // e.g., "us", "in", "de"
  iso_3: text("iso_3"),
  num_code: integer("num_code"),
  name: text("name").notNull(),
  display_name: text("display_name").notNull(),
  region_id: uuid("region_id").references(() => regions.id),
  ...createdUpdated,
});

export const money_amounts = pgTable(
  "money_amounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    currency_code: text("currency_code").notNull(), // "usd", "inr"
    amount: integer("amount").notNull(), // Stored in cents/lowest unit
    min_quantity: integer("min_quantity").default(1),
    max_quantity: integer("max_quantity"),
    variant_id: uuid("variant_id").references(() => product_variants.id),
    region_id: uuid("region_id").references(() => regions.id),
    ...createdUpdated,
  },
  (table) => ({
    variantIdx: index("idx_money_amounts_variant_id").on(table.variant_id),
    regionIdx: index("idx_money_amounts_region_id").on(table.region_id),
  }),
);

// --- ORDERS & CUSTOMERS ---

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    first_name: text("first_name"),
    last_name: text("last_name"),
    phone: text("phone"),
    has_account: boolean("has_account").default(false),
    password_hash: text("password_hash"), // Nullable for guest checkouts
    ...createdUpdated,
  },
  (table) => ({
    createdAtIndex: index("idx_customers_created_at").on(table.created_at),
  }),
);

export const addresses = pgTable("addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  customer_id: uuid("customer_id").references(() => customers.id),
  first_name: text("first_name"),
  last_name: text("last_name"),
  company: text("company"),
  address_1: text("address_1"),
  address_2: text("address_2"),
  city: text("city"),
  country_code: text("country_code"),
  province: text("province"),
  postal_code: text("postal_code"),
  phone: text("phone"),
  metadata: jsonb("metadata"),
  ...createdUpdated,
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    status: text("status").default("pending"), // pending, completed, archived, canceled
    fulfillment_status: text("fulfillment_status").default("not_fulfilled"), // not_fulfilled, fulfilled, partially_fulfilled, shipped
    payment_status: text("payment_status").default("awaiting"), // awaiting, captured, refunded
    display_id: serial("display_id"), // User facing ID like #1001

    // Links
    customer_id: uuid("customer_id").references(() => customers.id),
    region_id: uuid("region_id").references(() => regions.id),
    shipping_address_id: uuid("shipping_address_id").references(
      () => addresses.id,
    ),
    billing_address_id: uuid("billing_address_id").references(
      () => addresses.id,
    ),

    // Money
    currency_code: text("currency_code").notNull(),
    tax_rate: decimal("tax_rate"),

    // Totals (stored as integers)
    subtotal: integer("subtotal").default(0),
    tax_total: integer("tax_total").default(0),
    shipping_total: integer("shipping_total").default(0),
    discount_total: integer("discount_total").default(0),
    discount_id: uuid("discount_id").references(() => discounts.id),
    total: integer("total").default(0), // Final amount to charge

    email: text("email").notNull(), // Snapshot in case customer changes
    metadata: jsonb("metadata"),
    ...createdUpdated,
  },
  (table) => ({
    statusIdx: index("idx_orders_status").on(table.status),
    customerIdIdx: index("idx_orders_customer_id").on(table.customer_id),
    regionIdIdx: index("idx_orders_region_id").on(table.region_id),
    discountIdIdx: index("idx_orders_discount_id").on(table.discount_id),
    createdAtIndex: index("idx_orders_created_at").on(table.created_at),
  }),
);

export const line_items = pgTable(
  "line_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    order_id: uuid("order_id")
      .references(() => orders.id)
      .notNull(),
    variant_id: uuid("variant_id").references(() => product_variants.id),
    title: text("title").notNull(),
    description: text("description"),
    thumbnail: text("thumbnail"),
    quantity: integer("quantity").notNull(),
    unit_price: integer("unit_price").notNull(),
    total_price: integer("total_price").notNull(), // quantity * unit_price
    metadata: jsonb("metadata"),
    ...createdUpdated,
  },
  (table) => ({
    orderIdx: index("idx_line_items_order_id").on(table.order_id),
    variantIdx: index("idx_line_items_variant_id").on(table.variant_id),
  }),
);

// --- RELATIONS ---

export const productsRelations = relations(products, ({ one, many }) => ({
  variants: many(product_variants),
  options: many(product_options),
  images: many(product_images),
  collection: one(product_collections, {
    fields: [products.collection_id],
    references: [product_collections.id],
  }),
  categories: many(product_categories),
  tags: many(product_tags),
}));

export const productImagesRelations = relations(product_images, ({ one }) => ({
  product: one(products, {
    fields: [product_images.product_id],
    references: [products.id],
  }),
}));

export const productReviewsRelations = relations(
  product_reviews,
  ({ one }) => ({
    product: one(products, {
      fields: [product_reviews.product_id],
      references: [products.id],
    }),
    customer: one(customers, {
      fields: [product_reviews.customer_id],
      references: [customers.id],
    }),
  }),
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parent_id],
    references: [categories.id],
    relationName: "child_categories",
  }),
  children: many(categories, {
    relationName: "child_categories",
  }),
  products: many(product_categories),
}));

export const productCategoriesRelations = relations(
  product_categories,
  ({ one }) => ({
    product: one(products, {
      fields: [product_categories.product_id],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [product_categories.category_id],
      references: [categories.id],
    }),
  }),
);

export const tagsRelations = relations(tags, ({ many }) => ({
  products: many(product_tags),
}));

export const productTagsRelations = relations(product_tags, ({ one }) => ({
  product: one(products, {
    fields: [product_tags.product_id],
    references: [products.id],
  }),
  tag: one(tags, {
    fields: [product_tags.tag_id],
    references: [tags.id],
  }),
}));

export const productVariantsRelations = relations(
  product_variants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [product_variants.product_id],
      references: [products.id],
    }),
    prices: many(money_amounts),
    option_values: many(product_option_values),
  }),
);

export const moneyAmountsRelations = relations(money_amounts, ({ one }) => ({
  variant: one(product_variants, {
    fields: [money_amounts.variant_id],
    references: [product_variants.id],
  }),
  region: one(regions, {
    fields: [money_amounts.region_id],
    references: [regions.id],
  }),
}));

export const regionsRelations = relations(regions, ({ many }) => ({
  countries: many(countries),
}));

export const countriesRelations = relations(countries, ({ one }) => ({
  region: one(regions, {
    fields: [countries.region_id],
    references: [regions.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  addresses: many(addresses),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, {
    fields: [addresses.customer_id],
    references: [customers.id],
  }),
}));

export const lineItemsRelations = relations(line_items, ({ one }) => ({
  order: one(orders, {
    fields: [line_items.order_id],
    references: [orders.id],
  }),
  variant: one(product_variants, {
    fields: [line_items.variant_id],
    references: [product_variants.id],
  }),
}));

// --- SETTINGS ---
export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value"),
  category: text("category").default("general"), // general, notifications, security, email, payment, shipping
  ...createdUpdated,
});

// --- MARKETING CAMPAIGNS ---
export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").default("promotion"), // promotion, email, social
  status: text("status").default("draft"), // draft, active, paused, completed
  start_date: timestamp("start_date"),
  end_date: timestamp("end_date"),
  budget: integer("budget"), // in cents
  spent: integer("spent").default(0), // in cents
  customers_reached: integer("customers_reached").default(0),
  conversions: integer("conversions").default(0),
  revenue: integer("revenue").default(0), // in cents
  metadata: jsonb("metadata"),
  ...createdUpdated,
});

// --- DISCOUNT CODES ---
export const discounts = pgTable("discounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // percentage, fixed_amount, free_shipping
  value: integer("value").notNull(), // percentage (0-100) or amount in cents
  description: text("description"),
  starts_at: timestamp("starts_at"),
  ends_at: timestamp("ends_at"),
  usage_limit: integer("usage_limit"), // null = unlimited
  usage_count: integer("usage_count").default(0),
  min_purchase_amount: integer("min_purchase_amount"), // in cents
  is_active: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  campaign_id: uuid("campaign_id").references(() => campaigns.id),
  ...createdUpdated,
});

// 🔒 FIX-006: Discount usage tracking table (per-customer limits)
export const discount_usage = pgTable(
  "discount_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    discount_id: uuid("discount_id")
      .references(() => discounts.id, { onDelete: "cascade" })
      .notNull(),
    customer_id: uuid("customer_id")
      .references(() => customers.id, { onDelete: "cascade" })
      .notNull(),
    order_id: uuid("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    used_at: timestamp("used_at").defaultNow(),
  },
  (table) => ({
    // Unique constraint: one use per customer per discount
    uniqueDiscountCustomer: primaryKey({
      columns: [table.discount_id, table.customer_id],
      name: "pk_discount_customer_usage",
    }),
    customerIdx: index("idx_discount_usage_customer_id").on(table.customer_id),
    discountIdx: index("idx_discount_usage_discount_id").on(table.discount_id),
  }),
);

// --- WHOLESALE INQUIRIES ---
export const wholesale_inquiries = pgTable("wholesale_inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  company_name: text("company_name").notNull(),
  contact_name: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  country: text("country").notNull(),
  business_type: text("business_type").notNull(), // boutique, online, distributor, chain, other
  estimated_order_volume: text("estimated_order_volume"), // 50-100, 100-200, 200-500, 500+
  message: text("message"),
  status: text("status").default("pending"), // pending, approved, rejected
  discount_tier: text("discount_tier"), // starter, growth, enterprise
  admin_notes: text("admin_notes"),
  reviewed_by: uuid("reviewed_by").references(() => users.id),
  reviewed_at: timestamp("reviewed_at"),
  ...createdUpdated,
});

// --- CONTACT FORM ---
export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// --- NEWSLETTER ---
export const newsletter_subscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  status: text("status").default("active"),
  created_at: timestamp("created_at").defaultNow(),
});

// --- RELATIONS ---
export const settingsRelations = relations(settings, ({ }) => ({}));

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  discounts: many(discounts),
}));

export const discountsRelations = relations(discounts, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [discounts.campaign_id],
    references: [campaigns.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customer_id],
    references: [customers.id],
  }),
  region: one(regions, {
    fields: [orders.region_id],
    references: [regions.id],
  }),
  shipping_address: one(addresses, {
    fields: [orders.shipping_address_id],
    references: [addresses.id],
    relationName: "shipping_address",
  }),
  billing_address: one(addresses, {
    fields: [orders.billing_address_id],
    references: [addresses.id],
    relationName: "billing_address",
  }),
  discount: one(discounts, {
    fields: [orders.discount_id],
    references: [discounts.id],
  }),

  items: many(line_items),
}));

// --- CONTENT MANAGEMENT (Banners) ---
export const banners = pgTable("banners", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  image_url: text("image_url").notNull(),
  link: text("link"),
  button_text: text("button_text"),
  position: integer("position").default(0), // For ordering
  is_active: boolean("is_active").default(true),
  section: text("section").default("hero"), // hero, collection_header, etc.
  ...createdUpdated,
});

// --- BLOG & CONTENT ---
export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  cover_image: text("cover_image"),
  author_id: uuid("author_id").references(() => users.id),
  status: text("status").default("draft"), // draft, published, archived
  published_at: timestamp("published_at"),
  seo_title: text("seo_title"),
  seo_description: text("seo_description"),
  seo_keywords: text("seo_keywords"),
  metadata: jsonb("metadata"),
  ...createdUpdated,
});

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.author_id],
    references: [users.id],
  }),
}));

export const pages = pgTable("pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(), // HTML content
  is_visible: boolean("is_visible").default(true),
  seo_title: text("seo_title"),
  seo_description: text("seo_description"),
  ...createdUpdated,
});
