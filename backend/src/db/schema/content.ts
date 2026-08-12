import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid, createdUpdated } from './shared';
import { users } from './auth';
import { categories, product_collections, products, tags } from './catalog';

export const banners = pgTable('banners', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  image_url: text('image_url').notNull(),
  link: text('link'),
  button_text: text('button_text'),
  position: integer('position').default(0), // For ordering
  is_active: boolean('is_active').default(true),
  section: text('section').default('hero'), // hero, collection_header, etc.
  ...createdUpdated,
});

export const hero_banners = pgTable(
  'hero_banners',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    image_url: text('image_url').notNull(),
    mobile_image_url: text('mobile_image_url'),
    title: text('title'),
    subtitle: text('subtitle'),
    button_text: text('button_text'),
    button_link: text('button_link'),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_hero_banners_is_active').on(table.is_active),
    sortOrderIdx: index('idx_hero_banners_sort_order').on(table.sort_order),
  })
);

export const trending_reels = pgTable(
  'trending_reels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    video_url: text('video_url').notNull(),
    thumbnail_url: text('thumbnail_url').notNull(),
    category: text('category'),
    caption: text('caption'),
    product_id: uuid('product_id').references(() => products.id, {
      onDelete: 'set null',
    }),
    product_name: text('product_name').notNull(),
    price: text('price').notNull(),
    price_amount: integer('price_amount'),
    link_url: text('link_url').notNull(),
    view_count: integer('view_count').default(0).notNull(),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_trending_reels_is_active').on(table.is_active),
    sortOrderIdx: index('idx_trending_reels_sort_order').on(table.sort_order),
  })
);

export const reel_collections = pgTable(
  'reel_collections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    handle: text('handle').notNull().unique(),
    subtitle: text('subtitle'),
    description: text('description'),
    hero_image_url: text('hero_image_url'),
    hero_video_url: text('hero_video_url'),
    cta_label: text('cta_label').default('Shop Collection').notNull(),
    cta_url: text('cta_url'),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_reel_collections_is_active').on(table.is_active),
    handleIdx: index('idx_reel_collections_handle').on(table.handle),
    sortOrderIdx: index('idx_reel_collections_sort_order').on(table.sort_order),
  })
);

export const reel_collection_items = pgTable(
  'reel_collection_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    collection_id: uuid('collection_id')
      .references(() => reel_collections.id, { onDelete: 'cascade' })
      .notNull(),
    reel_id: uuid('reel_id')
      .references(() => trending_reels.id, { onDelete: 'cascade' })
      .notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    collectionIdx: index('idx_reel_collection_items_collection').on(
      table.collection_id,
      table.sort_order
    ),
    reelIdx: index('idx_reel_collection_items_reel').on(table.reel_id),
  })
);

export const homepage_categories = pgTable(
  'homepage_categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    category_id: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    image_url: text('image_url').notNull(),
    name: text('name').notNull(),
    link_url: text('link_url').notNull(),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_homepage_categories_is_active').on(table.is_active),
    sortOrderIdx: index('idx_homepage_categories_sort_order').on(table.sort_order),
  })
);

export const homepage_banners = pgTable(
  'homepage_banners',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    image_url: text('image_url').notNull(),
    headline: text('headline'),
    button_label: text('button_label'),
    button_url: text('button_url'),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_homepage_banners_is_active').on(table.is_active),
    sortOrderIdx: index('idx_homepage_banners_sort_order').on(table.sort_order),
  })
);

export const category_circles = pgTable(
  'category_circles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    category_id: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    image_url: text('image_url').notNull(),
    label: text('label').notNull(),
    link_url: text('link_url').notNull(),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_category_circles_is_active').on(table.is_active),
    sortOrderIdx: index('idx_category_circles_sort_order').on(table.sort_order),
  })
);

export const trust_items = pgTable(
  'trust_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    label: text('label').notNull(),
    sub: text('sub').notNull(),
    icon: text('icon').notNull().default('✦'),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_trust_items_is_active').on(table.is_active),
    sortOrderIdx: index('idx_trust_items_sort_order').on(table.sort_order),
  })
);

export const featured_products = pgTable(
  'featured_products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    section_key: text('section_key').default('spotlight').notNull(),
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    custom_image_url: text('custom_image_url'),
    badge_text: text('badge_text'),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    sectionIdx: index('idx_featured_products_section_key').on(table.section_key),
    productIdx: index('idx_featured_products_product_id').on(table.product_id),
    activeIdx: index('idx_featured_products_is_active').on(table.is_active),
    sortOrderIdx: index('idx_featured_products_sort_order').on(table.sort_order),
  })
);

export const homepage_merchandising_slots = pgTable(
  'homepage_merchandising_slots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slot_key: text('slot_key').notNull(),
    eyebrow: text('eyebrow'),
    title: text('title').notNull(),
    copy: text('copy'),
    image_url: text('image_url'),
    mobile_image_url: text('mobile_image_url'),
    link_url: text('link_url'),
    linked_product_id: uuid('linked_product_id').references(() => products.id, {
      onDelete: 'set null',
    }),
    linked_collection_id: uuid('linked_collection_id').references(
      () => product_collections.id,
      { onDelete: 'set null' }
    ),
    linked_category_id: uuid('linked_category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    linked_tag_id: uuid('linked_tag_id').references(() => tags.id, {
      onDelete: 'set null',
    }),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    slotKeyIdx: index('idx_homepage_merchandising_slots_slot_key').on(
      table.slot_key
    ),
    activeIdx: index('idx_homepage_merchandising_slots_is_active').on(
      table.is_active
    ),
    sortOrderIdx: index('idx_homepage_merchandising_slots_sort_order').on(
      table.sort_order
    ),
  })
);

export const homepage_social_posts = pgTable(
  'homepage_social_posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    image_url: text('image_url').notNull(),
    alt_text: text('alt_text').notNull(),
    caption: text('caption'),
    destination_url: text('destination_url').notNull(),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_homepage_social_posts_is_active').on(table.is_active),
    sortOrderIdx: index('idx_homepage_social_posts_sort_order').on(table.sort_order),
  })
);

// --- BLOG & CONTENT ---
export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  cover_image: text('cover_image'),
  author_id: uuid('author_id').references(() => users.id),
  status: text('status').default('draft'), // draft, published, archived
  published_at: timestamp('published_at'),
  seo_title: text('seo_title'),
  seo_description: text('seo_description'),
  seo_keywords: text('seo_keywords'),
  metadata: jsonb('metadata'),
  ...createdUpdated,
});

export const pages = pgTable('pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(), // HTML content
  is_visible: boolean('is_visible').default(true),
  seo_title: text('seo_title'),
  seo_description: text('seo_description'),
  ...createdUpdated,
});

// --- TESTIMONIALS ---
export const testimonials = pgTable('testimonials', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  location: text('location'),
  avatar_url: text('avatar_url'),
  rating: integer('rating').default(5),
  content: text('content').notNull(),
  is_active: boolean('is_active').default(true),
  display_order: integer('display_order').default(0),
  ...createdUpdated,
});

// --- NOTIFICATIONS ---
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: text('type').notNull(), // order, customer, system
    title: text('title').notNull(),
    message: text('message').notNull(),
    read: boolean('read').default(false),
    metadata: jsonb('metadata'), // store order_id, customer_id etc
    ...createdUpdated,
  },
  (table) => ({
    typeIdx: index('idx_notifications_type').on(table.type),
    readIdx: index('idx_notifications_read').on(table.read),
    createdAtIdx: index('idx_notifications_created_at').on(table.created_at),
  })
);
