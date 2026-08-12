import { boolean, decimal, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uniqueIndex, uuid, vector, createdUpdated } from './shared';

// --- PRODUCTS ---
export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    description: text('description'),
    handle: text('handle').notNull().unique(),
    is_giftcard: boolean('is_giftcard').default(false),
    is_wholesale_only: boolean('is_wholesale_only').default(false), // Only visible to wholesale customers
    status: text('status').default('draft'), // draft, published, proposed, rejected
    thumbnail: text('thumbnail'),
    weight: integer('weight'),
    length: integer('length'),
    height: integer('height'),
    width: integer('width'),
    origin_country: text('origin_country'),
    hs_code: text('hs_code'),
    mid_code: text('mid_code'),
    material: text('material'),
    collection_id: uuid('collection_id'),
    type_id: uuid('type_id'),
    discountable: boolean('discountable').default(true),
    size_guide: text('size_guide'),
    care_instructions: text('care_instructions'),
    price_type: text('price_type').default('fixed'), // fixed | on_request
    seo_title: text('seo_title'),
    seo_description: text('seo_description'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    statusIdx: index('idx_products_status').on(table.status),
    createdAtIndex: index('idx_products_created_at').on(table.created_at),
    collectionIdx: index('idx_products_collection_id').on(table.collection_id),
  })
);

export const product_variants = pgTable(
  'product_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    product_id: uuid('product_id')
      .references(() => products.id)
      .notNull(),
    title: text('title').notNull(),
    sku: text('sku'),
    barcode: text('barcode'),
    ean: text('ean'),
    upc: text('upc'),
    inventory_quantity: integer('inventory_quantity').default(0), // 🔒 FIX-001: Database CHECK constraint in migration 20260211_inventory_check_constraint.sql
    allow_backorder: boolean('allow_backorder').default(false),
    manage_inventory: boolean('manage_inventory').default(true),
    hs_code: text('hs_code'),
    origin_country: text('origin_country'),
    mid_code: text('mid_code'),
    material: text('material'),
    weight: integer('weight'),
    length: integer('length'),
    height: integer('height'),
    width: integer('width'),
    wholesale_price: integer('wholesale_price'), // Price in cents for wholesale customers
    compare_at_price: integer('compare_at_price'), // Original price before discount in cents
    moq: integer('moq'), // Minimum Order Quantity for wholesale customers
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    productIdx: index('idx_product_variants_product_id').on(table.product_id),
  })
);

export const product_options = pgTable('product_options', {
  id: uuid('id').defaultRandom().primaryKey(),
  product_id: uuid('product_id')
    .references(() => products.id)
    .notNull(),
  title: text('title').notNull(), // e.g. "Size", "Color"
  metadata: jsonb('metadata'),
  ...createdUpdated,
});

export const product_option_values = pgTable('product_option_values', {
  id: uuid('id').defaultRandom().primaryKey(),
  variant_id: uuid('variant_id')
    .references(() => product_variants.id)
    .notNull(),
  option_id: uuid('option_id')
    .references(() => product_options.id)
    .notNull(),
  value: text('value').notNull(), // e.g. "Large", "Red"
  metadata: jsonb('metadata'),
  ...createdUpdated,
});

export const product_collections = pgTable(
  'product_collections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    handle: text('handle').notNull().unique(),
    image: text('image'),
    // v2 fields
    type: text('type'), // occasion | seasonal | price | fabric | gift | style
    rule_type: text('rule_type').default('manual'), // manual | auto
    rule_definition: jsonb('rule_definition'),
    description: text('description'),
    cover_image_url: text('cover_image_url'),
    status: text('status').default('draft'), // draft | active | archived
    display_order: integer('display_order').default(0),
    show_in_megamenu: boolean('show_in_megamenu').default(false),
    homepage_section: text('homepage_section'),
    valid_from: timestamp('valid_from'),
    valid_until: timestamp('valid_until'),
    seo_title: text('seo_title'),
    seo_desc: text('seo_desc'),
    og_image_url: text('og_image_url'),
    is_indexable: boolean('is_indexable').default(true),
    robots_policy: text('robots_policy').default('index,follow'),
    canonical_url: text('canonical_url'),
    seasonal_flag: text('seasonal_flag').default('evergreen'),
    faq_items: jsonb('faq_items').default([]),
    answer_capsule: text('answer_capsule'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    statusIdx: index('idx_collections_status').on(table.status),
    typeIdx: index('idx_collections_type').on(table.type),
    displayOrderIdx: index('idx_collections_display_order').on(table.display_order),
    indexableIdx: index('idx_collections_is_indexable').on(table.is_indexable),
    seasonalIdx: index('idx_collections_seasonal_flag').on(table.seasonal_flag),
  })
);

// M2M junction: products ↔ collections (guide Section 5.4)
export const collection_products = pgTable(
  'collection_products',
  {
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    collection_id: uuid('collection_id')
      .references(() => product_collections.id, { onDelete: 'cascade' })
      .notNull(),
    position: integer('position').default(0),
    added_at: timestamp('added_at').defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.product_id, t.collection_id] }),
    collectionIdx: index('idx_cp_collection').on(t.collection_id, t.position),
    productIdx: index('idx_cp_product').on(t.product_id),
  })
);

export const product_images = pgTable('product_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  product_id: uuid('product_id')
    .references(() => products.id)
    .notNull(),
  url: text('url').notNull(),
  alt_text: text('alt_text'),
  position: integer('position').default(0),
  // ... existing code ...
  is_thumbnail: boolean('is_thumbnail').default(false),
  metadata: jsonb('metadata'),
  ...createdUpdated,
});

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    image: text('image'),
    is_active: boolean('is_active').default(true),
    parent_id: uuid('parent_id'),
    metadata: jsonb('metadata'),
    display_order: integer('display_order').default(0),
    show_in_header: boolean('show_in_header').default(true),
    header_image_url: text('header_image_url'),
    emoji: text('emoji'),
    seo_title: text('seo_title'),
    seo_desc: text('seo_desc'),
    og_image_url: text('og_image_url'),
    ...createdUpdated,
  },
  (table) => ({
    parentIdx: index('idx_categories_parent_id').on(table.parent_id),
    displayOrderIdx: index('idx_categories_display_order').on(table.display_order),
    showInHeaderIdx: index('idx_categories_show_in_header').on(table.show_in_header),
  })
);

// Self-reference must be handled carefully or via relations if circular reference occurs in declaration
// But here parent_id is just a uuid column. The FK constraint can be added if needed, or handled via relations.
// For now let's keep it simple.

export const product_categories = pgTable(
  'product_categories',
  {
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    category_id: uuid('category_id')
      .references(() => categories.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.product_id, t.category_id] }),
  })
);

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  metadata: jsonb('metadata'),
  ...createdUpdated,
});

export const product_tags = pgTable(
  'product_tags',
  {
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    tag_id: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.product_id, t.tag_id] }),
  })
);

// --- SEO, DISCOVERY & AI COMMERCE ---

export const product_seo = pgTable(
  'product_seo',
  {
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .primaryKey(),
    seo_title: text('seo_title'),
    meta_description: text('meta_description'),
    canonical_url: text('canonical_url'),
    robots_index: boolean('robots_index').default(true),
    robots_follow: boolean('robots_follow').default(true),
    og_title: text('og_title'),
    og_description: text('og_description'),
    og_image_url: text('og_image_url'),
    twitter_card: text('twitter_card').default('summary_large_image'),
    schema_overrides: jsonb('schema_overrides'),
    localized_metadata: jsonb('localized_metadata'),
    hreflang_group_id: text('hreflang_group_id'),
    seo_score: integer('seo_score').default(0),
    ...createdUpdated,
  },
  (table) => ({
    scoreIdx: index('idx_product_seo_score').on(table.seo_score),
    robotsIdx: index('idx_product_seo_robots').on(table.robots_index, table.robots_follow),
  })
);

export const product_attributes = pgTable(
  'product_attributes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull().unique(),
    label: text('label').notNull(),
    type: text('type').default('text'),
    facet_enabled: boolean('facet_enabled').default(true),
    seo_enabled: boolean('seo_enabled').default(true),
    merchant_mapping: text('merchant_mapping'),
    display_order: integer('display_order').default(0),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    codeIdx: index('idx_product_attributes_code').on(table.code),
    displayIdx: index('idx_product_attributes_display').on(table.display_order),
  })
);

export const attribute_values = pgTable(
  'attribute_values',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    attribute_id: uuid('attribute_id')
      .references(() => product_attributes.id, { onDelete: 'cascade' })
      .notNull(),
    slug: text('slug').notNull(),
    label: text('label').notNull(),
    synonyms: jsonb('synonyms'),
    locale_labels: jsonb('locale_labels'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    attrSlugIdx: index('idx_attribute_values_attr_slug').on(table.attribute_id, table.slug),
    labelIdx: index('idx_attribute_values_label').on(table.label),
  })
);

export const product_attribute_values = pgTable(
  'product_attribute_values',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    attribute_id: uuid('attribute_id')
      .references(() => product_attributes.id, { onDelete: 'cascade' })
      .notNull(),
    value_id: uuid('value_id').references(() => attribute_values.id, {
      onDelete: 'set null',
    }),
    raw_value: text('raw_value'),
    source: text('source').default('admin'),
    confidence: integer('confidence').default(100),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    productIdx: index('idx_product_attribute_values_product').on(table.product_id),
    attributeIdx: index('idx_product_attribute_values_attribute').on(table.attribute_id),
    valueIdx: index('idx_product_attribute_values_value').on(table.value_id),
  })
);

export const product_discovery = pgTable(
  'product_discovery',
  {
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .primaryKey(),
    primary_keyword: text('primary_keyword'),
    secondary_keywords: jsonb('secondary_keywords'),
    long_tail_keywords: jsonb('long_tail_keywords'),
    search_intents: jsonb('search_intents'),
    semantic_entities: jsonb('semantic_entities'),
    negative_keywords: jsonb('negative_keywords'),
    product_document: text('product_document'),
    document_hash: text('document_hash'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    primaryKeywordIdx: index('idx_product_discovery_primary_keyword').on(table.primary_keyword),
    hashIdx: index('idx_product_discovery_document_hash').on(table.document_hash),
  })
);

export const product_variant_merchant = pgTable(
  'product_variant_merchant',
  {
    variant_id: uuid('variant_id')
      .references(() => product_variants.id, { onDelete: 'cascade' })
      .primaryKey(),
    gtin: text('gtin'),
    mpn: text('mpn'),
    item_group_id: text('item_group_id'),
    color: text('color'),
    size: text('size'),
    size_system: text('size_system'),
    size_type: text('size_type'),
    gender: text('gender'),
    age_group: text('age_group'),
    condition: text('condition').default('new'),
    google_product_category: text('google_product_category'),
    material: text('material'),
    pattern: text('pattern'),
    shipping_weight: integer('shipping_weight'),
    feed_enabled: boolean('feed_enabled').default(false),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    itemGroupIdx: index('idx_product_variant_merchant_item_group').on(table.item_group_id),
    feedIdx: index('idx_product_variant_merchant_feed').on(table.feed_enabled),
  })
);

export const product_media_seo = pgTable(
  'product_media_seo',
  {
    image_id: uuid('image_id')
      .references(() => product_images.id, { onDelete: 'cascade' })
      .primaryKey(),
    alt_text: text('alt_text'),
    image_role: text('image_role'),
    view_type: text('view_type'),
    color: text('color'),
    seo_filename: text('seo_filename'),
    cloudinary_public_id: text('cloudinary_public_id'),
    media_type: text('media_type').default('image'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    roleIdx: index('idx_product_media_seo_role').on(table.image_role),
  })
);

export const seo_landing_pages = pgTable(
  'seo_landing_pages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    meta_description: text('meta_description'),
    intro_content: text('intro_content'),
    outro_content: text('outro_content'),
    rule_definition: jsonb('rule_definition'),
    canonical_url: text('canonical_url'),
    robots_index: boolean('robots_index').default(true),
    robots_follow: boolean('robots_follow').default(true),
    hreflang_group_id: text('hreflang_group_id'),
    status: text('status').default('draft'),
    priority: integer('priority').default(50),
    localized_metadata: jsonb('localized_metadata'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    slugIdx: index('idx_seo_landing_pages_slug').on(table.slug),
    statusIdx: index('idx_seo_landing_pages_status').on(table.status),
    indexableIdx: index('idx_seo_landing_pages_indexable').on(table.status, table.robots_index),
  })
);

export const search_synonyms = pgTable(
  'search_synonyms',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locale: text('locale').default('en'),
    term: text('term').notNull(),
    normalized_term: text('normalized_term').notNull(),
    synonyms: jsonb('synonyms'),
    boost: integer('boost').default(1),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    termIdx: index('idx_search_synonyms_term').on(table.locale, table.normalized_term),
  })
);

export const search_query_logs = pgTable(
  'search_query_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    query: text('query').notNull(),
    normalized_query: text('normalized_query'),
    locale: text('locale').default('en'),
    result_count: integer('result_count').default(0),
    clicked_product_id: uuid('clicked_product_id').references(() => products.id, {
      onDelete: 'set null',
    }),
    source: text('source').default('storefront'),
    metadata: jsonb('metadata'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    queryIdx: index('idx_search_query_logs_query').on(table.normalized_query),
    zeroResultIdx: index('idx_search_query_logs_zero_result').on(table.result_count),
    createdIdx: index('idx_search_query_logs_created').on(table.created_at),
  })
);

export const product_embeddings = pgTable(
  'product_embeddings',
  {
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .primaryKey(),
    locale: text('locale').default('en'),
    source_hash: text('source_hash'),
    document: text('document'),
    embedding: vector('embedding'),
    metadata: jsonb('metadata'),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    localeIdx: index('idx_product_embeddings_locale').on(table.locale),
    hashIdx: index('idx_product_embeddings_hash').on(table.source_hash),
  })
);

export const artisans = pgTable(
  'artisans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    bio: text('bio'),
    craft_specialty: text('craft_specialty'),
    location: text('location'),
    image_url: text('image_url'),
    knows_about: jsonb('knows_about').default([]),
    has_occupation: text('has_occupation').default('Textile artisan'),
    same_as: jsonb('same_as').default([]),
    status: text('status').default('active'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    slugIdx: index('idx_artisans_slug').on(table.slug),
    statusIdx: index('idx_artisans_status').on(table.status),
  })
);

export const product_artisans = pgTable(
  'product_artisans',
  {
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    artisan_id: uuid('artisan_id')
      .references(() => artisans.id, { onDelete: 'cascade' })
      .notNull(),
    role: text('role').default('creator'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.product_id, table.artisan_id] }),
    productIdx: index('idx_product_artisans_product').on(table.product_id),
    artisanIdx: index('idx_product_artisans_artisan').on(table.artisan_id),
  })
);

export const hreflang_groups = pgTable(
  'hreflang_groups',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entity_type: text('entity_type').notNull(),
    entity_id: text('entity_id'),
    canonical_url: text('canonical_url').notNull(),
    locale: text('locale').notNull(),
    localized_url: text('localized_url').notNull(),
    is_default: boolean('is_default').default(false),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    entityIdx: index('idx_hreflang_groups_entity').on(table.entity_type, table.entity_id),
    localeIdx: index('idx_hreflang_groups_locale').on(table.locale),
  })
);

export const market_policies = pgTable(
  'market_policies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locale: text('locale').notNull(),
    market_code: text('market_code').notNull(),
    shipping_title: text('shipping_title'),
    shipping_content: text('shipping_content'),
    returns_title: text('returns_title'),
    returns_content: text('returns_content'),
    currency_code: text('currency_code'),
    status: text('status').default('active'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    marketIdx: index('idx_market_policies_market').on(table.locale, table.market_code),
    statusIdx: index('idx_market_policies_status').on(table.status),
  })
);

export const gsc_performance = pgTable(
  'gsc_performance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    date: timestamp('date').notNull(),
    page: text('page').notNull(),
    query: text('query'),
    locale: text('locale').default('en'),
    clicks: integer('clicks').default(0),
    impressions: integer('impressions').default(0),
    ctr: decimal('ctr').default('0'),
    position: decimal('position').default('0'),
    metadata: jsonb('metadata'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    pageIdx: index('idx_gsc_performance_page').on(table.page),
    dateIdx: index('idx_gsc_performance_date').on(table.date),
  })
);

export const competitor_keywords = pgTable(
  'competitor_keywords',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    keyword: text('keyword').notNull(),
    competitor_url: text('competitor_url'),
    locale: text('locale').default('en'),
    search_volume: integer('search_volume'),
    difficulty: integer('difficulty'),
    priority: integer('priority').default(50),
    status: text('status').default('candidate'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    keywordIdx: index('idx_competitor_keywords_keyword').on(table.keyword),
    statusIdx: index('idx_competitor_keywords_status').on(table.status),
  })
);

export const merchant_feed_health = pgTable(
  'merchant_feed_health',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    channel: text('channel').notNull(),
    status: text('status').default('ok'),
    product_count: integer('product_count').default(0),
    error_count: integer('error_count').default(0),
    errors: jsonb('errors').default([]),
    last_generated_at: timestamp('last_generated_at').defaultNow(),
    metadata: jsonb('metadata'),
  },
  (table) => ({
    channelIdx: index('idx_merchant_feed_health_channel').on(table.channel),
  })
);

// --- INTERNATIONALIZATION ---

export const regions = pgTable('regions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), // e.g. "North America", "Europe"
  currency_code: text('currency_code').notNull(), // e.g. "usd", "eur"
  tax_rate: decimal('tax_rate').default('0'),
  tax_code: text('tax_code'),
  payment_providers: text('payment_providers'), // Comma separated IDs
  fulfillment_providers: text('fulfillment_providers'), // Comma separated IDs
  countries: jsonb('countries'), // Array of country ISO codes, e.g. ["IN", "US"]
  metadata: jsonb('metadata'),
  ...createdUpdated,
});

export const countries = pgTable('countries', {
  id: serial('id').primaryKey(),
  iso_2: text('iso_2').notNull().unique(), // e.g., "us", "in", "de"
  iso_3: text('iso_3'),
  num_code: integer('num_code'),
  name: text('name').notNull(),
  display_name: text('display_name').notNull(),
  region_id: uuid('region_id').references(() => regions.id),
  ...createdUpdated,
});

export const money_amounts = pgTable(
  'money_amounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    currency_code: text('currency_code').notNull(), // "usd", "inr"
    amount: integer('amount').notNull(), // Stored in cents/lowest unit
    min_quantity: integer('min_quantity').default(1),
    max_quantity: integer('max_quantity'),
    variant_id: uuid('variant_id').references(() => product_variants.id),
    region_id: uuid('region_id').references(() => regions.id),
    ...createdUpdated,
  },
  (table) => ({
    variantIdx: index('idx_money_amounts_variant_id').on(table.variant_id),
    regionIdx: index('idx_money_amounts_region_id').on(table.region_id),
  })
);
