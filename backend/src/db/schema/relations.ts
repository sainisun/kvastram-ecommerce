import { relations } from './shared';
import {
  categories,
  countries,
  money_amounts,
  product_categories,
  product_collections,
  product_images,
  product_option_values,
  product_options,
  product_tags,
  product_variants,
  products,
  regions,
  tags,
} from './catalog';
import { users } from './auth';
import { addresses, customers, discounts, line_items, orders } from './commerce';
import { campaigns } from './marketing';
import { settings } from './settings';
import { posts } from './content';
import { product_reviews, return_items, returns } from './engagement';

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
  })
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parent_id],
    references: [categories.id],
    relationName: 'child_categories',
  }),
  children: many(categories, {
    relationName: 'child_categories',
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
  })
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
  })
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

export const settingsRelations = relations(settings, () => ({}));

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
    relationName: 'shipping_address',
  }),
  billing_address: one(addresses, {
    fields: [orders.billing_address_id],
    references: [addresses.id],
    relationName: 'billing_address',
  }),
  discount: one(discounts, {
    fields: [orders.discount_id],
    references: [discounts.id],
  }),

  items: many(line_items),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.author_id],
    references: [users.id],
  }),
}));

export const returnsRelations = relations(returns, ({ one, many }) => ({
  order: one(orders, {
    fields: [returns.order_id],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [returns.customer_id],
    references: [customers.id],
  }),
  items: many(return_items),
}));

export const returnItemsRelations = relations(return_items, ({ one }) => ({
  return_request: one(returns, {
    fields: [return_items.return_id],
    references: [returns.id],
  }),
  line_item: one(line_items, {
    fields: [return_items.line_item_id],
    references: [line_items.id],
  }),
}));


// --- ADMIN AUDIT LOG (guide Section 7.3) ---
