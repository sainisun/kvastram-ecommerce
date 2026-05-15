# Advanced AI E-commerce SEO Architecture Execution Plan

## Summary

Build Kvastram into a Shopify Plus/WooCommerce-plus-level SEO and AI commerce architecture without changing the existing storefront layout.

Chosen defaults:
- Rollout: phased full build.
- Storefront: existing design/layout stays same; only minimal content slots inside existing product/collection areas.
- Search stack: Postgres hybrid using structured facets, full-text search, trigram typo tolerance, and vector-ready embeddings.

Target outcome:
- Advanced product SEO management.
- Semantic fashion taxonomy.
- Google Merchant readiness.
- AI/vector product discovery.
- SEO-safe collection and faceted navigation.
- Admin workflows that force product SEO completeness before publishing.

## Phase 1: SEO Foundation And Data Model

Add normalized SEO/discovery tables:

- `product_seo`: canonical URL, robots index/follow, OG/Twitter fields, schema override JSON, SEO score.
- `product_attributes`: attribute definitions such as fabric, technique, occasion, style, sleeve, fit, pattern, color, region, artisan type.
- `attribute_values`: canonical values, slugs, synonyms, multilingual labels.
- `product_attribute_values`: product-to-attribute mapping with source and confidence.
- `product_discovery`: primary keyword, long-tail keywords, semantic entities, search intents, negative keywords.
- `product_variant_merchant`: GTIN, MPN, item group ID, color, size, size system, gender, age group, condition.
- `seo_landing_pages`: indexable collection/facet landing pages with rule JSON, canonical URL, robots policy, content blocks.
- `search_synonyms`: typo/synonym dictionary by locale.
- `product_embeddings`: vector-ready product document hash and embedding storage.

Migration defaults:
- Existing `products.material` becomes a mapped `material/fabric` attribute where possible.
- Existing tags remain but get classified as `facet`, `seo`, `merchandising`, or `internal`.
- Existing SEO title/meta fields remain backward-compatible and are mirrored into `product_seo`.

## Phase 2: Admin SEO And Discovery Workflows

Add a dedicated product editor section: **SEO & Discovery**.

Capabilities:
- SEO title, meta description, slug, canonical, robots index/follow.
- OG title, OG description, OG image, Twitter card.
- Schema preview and validation warnings.
- Primary keyword, secondary keywords, long-tail keywords.
- Search intent mapping: buy, gift, occasion, styling, comparison, care.
- Semantic entities: Jaipur, Sanganer, Kantha, block print, cotton, slow fashion, artisan-made.
- Structured attributes with controlled dropdowns and multi-selects.
- Merchant readiness fields at variant level.
- Per-image alt text, image role, image view type, color, and SEO filename/public ID guidance.
- Product completeness score before publish.

Admin publish rule:
- Draft can be saved anytime.
- Published products must pass required fields: title, slug, price or on-request mode, at least one image, category, primary attribute set, SEO title/meta, canonical policy, product schema validity.
- Merchant-ready status is warning-only in v1 unless the product is marked for Google Shopping feed.

## Phase 3: Product Schema And Merchant Architecture

Upgrade JSON-LD generation:
- Product pages emit `Product` or `ProductGroup` depending on variant count.
- Variant schema includes SKU, GTIN/MPN when available, color, size, material, pattern, price, currency, availability, condition.
- Offers include shipping and return policy where globally configured.
- Breadcrumb schema remains.
- Review/aggregate rating remains only when approved review data exists.
- Product schema must never emit fake GTIN, fake review data, or unavailable merchant fields.

Add Merchant feed endpoints:
- `/merchant/google/products.xml`
- `/merchant/google/products.json`

Feed includes ID, title, description, link, image link, availability, price, sale price, brand, GTIN/MPN, condition, Google product category, color, size, gender, age group, material, pattern, shipping weight, origin country.

Feed excludes draft, noindex, out-of-policy, missing-price, or missing-image products.

## Phase 4: Search, Synonyms, And AI Product Discovery

Implement hybrid product retrieval:
- Structured filters from product attributes.
- Postgres full-text search over title, subtitle, description, attributes, tags, collection, category, craft story.
- Trigram similarity for typo tolerance.
- Synonym expansion from `search_synonyms`.
- Search ranking boosts: exact title match, primary keyword, attribute match, in-stock, bestseller, new arrival, review score, conversion-ready media.
- Vector-ready product document built from title, description, attributes, artisan story, collection, tags, and merchant fields.
- Embeddings stored in `product_embeddings`; actual embedding provider can be plugged in later without changing product APIs.

Add admin search intelligence:
- Zero-result query log.
- Top queries.
- Synonym suggestions.
- Query-to-collection suggestions.
- Attribute gap report: searches that imply missing attributes.

## Phase 5: SEO Collection And Facet Indexation

Create controlled SEO landing pages instead of indexing random filter URLs.

Indexable examples:
- `/collections/block-print-dresses`
- `/collections/cotton-kaftans`
- `/collections/jaipur-boho-bags`
- `/collections/kantha-quilts`
- `/collections/festive-kurtis`
- `/collections/summer-cotton-dresses`
- `/collections/gifts-under-2000`

Rules:
- Only admin-approved `seo_landing_pages` are indexable.
- Utility filters such as sort, price, internal IDs, and temporary query params stay canonicalized or noindexed.
- Sitemap includes only approved indexable landing pages.
- Product grid design remains the same.
- Minimal collection SEO content slot can render intro/outro copy within existing collection layout.

## Phase 6: Storefront Integration Without Layout Redesign

Keep current visual design and page structure.

Allowed minimal visible additions:
- Product page existing tabs may include craft story, fabric details, artisan provenance, FAQ, care, and styling copy.
- Collection pages may include compact SEO intro/outro content blocks using current typography.
- Related products improve from category/collection only to same fabric, technique, style, occasion, color, and artisan region.

Invisible SEO changes:
- Metadata generation reads `product_seo`.
- Canonical and robots policy become database-driven.
- Hreflang-ready metadata structure is added.
- Product/schema data is generated from normalized attributes.
- Internal links are generated from semantic relationships.
- Sitemaps include products, categories, approved collections, journal, pages, and SEO landing pages.

## Phase 7: International SEO

Add locale-ready architecture without forcing full translation immediately.

Default locale set:
- `en-in`
- `en-us`
- `en-gb`
- `en-au`
- `en-eu`

Implementation:
- Add localized SEO fields for title, meta description, collection copy, keyword labels, and attribute labels.
- Add hreflang groups.
- Generate self-referencing hreflang.
- Keep pricing conversion separate from locale SEO.
- Localize shipping/returns copy by market when available.
- Default fallback: if localized metadata is missing, use global English metadata.

## Public APIs, Interfaces, And Types

Add/extend admin APIs:
- `GET/PUT /products/:id/seo`
- `GET/PUT /products/:id/discovery`
- `GET/PUT /products/:id/attributes`
- `GET/PUT /products/:id/merchant`
- `GET/PUT /products/:id/media-seo`
- `GET /products/:id/seo-score`
- `GET/POST/PUT /seo/landing-pages`
- `GET/POST/PUT /search/synonyms`
- `GET /search/analytics/zero-results`
- `GET /merchant/google/products`

Extend product response shape:
- `seo`
- `attributes`
- `discovery`
- `merchant`
- `media_seo`
- `semantic_related_products`

Backward compatibility:
- Existing `seo_title`, `seo_description`, `material`, tags, categories, collections, and images continue working.
- Storefront falls back to existing fields if new SEO tables are empty.
- No existing product URL changes unless admin intentionally edits a slug and creates a redirect.

## Test Plan

Database and migration tests:
- Existing products migrate without data loss.
- Product with only legacy `material` still renders valid metadata.
- Product with no advanced SEO fields still renders safe fallback schema.
- Attribute values, synonyms, and landing page rules validate correctly.

Backend/API tests:
- Product SEO CRUD.
- Attribute assignment CRUD.
- Merchant feed excludes invalid products.
- ProductGroup schema generated only when variants exist.
- Search ranking handles exact match, typo, synonym, attribute match, and zero result.
- Canonical/robots policies resolve correctly.

Admin tests:
- Product can save as draft with incomplete SEO.
- Publish shows blocking errors for required SEO/product fields.
- Merchant warnings appear but do not block unless configured.
- Image alt editor saves and storefront receives alt text.
- SEO score updates when fields change.

Storefront tests:
- Existing layout does not regress.
- Product page metadata, canonical, robots, OG/Twitter, Product/ProductGroup schema render correctly.
- Collection landing page canonical/index policy is correct.
- Utility filters do not create indexable duplicate pages.
- Related products use semantic matching when attributes exist and fallback when not.
- Hreflang tags render when locale data exists.

Performance tests:
- Product page schema generation does not add heavy client JS.
- Search endpoint remains performant with indexes.
- Sitemap generation handles large product counts.
- Merchant feed generation can stream or paginate safely.

Acceptance criteria:
- SEO/admin architecture supports all audit requirements.
- Existing storefront design remains visually consistent.
- Google Rich Results validates product schema for eligible products.
- Merchant feed validates required apparel fields for eligible products.
- Search supports synonym and typo-tolerant discovery.
- Approved SEO landing pages appear in sitemap; unapproved filters do not.

## Assumptions

- No major storefront redesign is allowed.
- Minimal visible SEO content slots are allowed inside current product/collection layouts.
- Postgres remains the primary search and data platform for v1.
- Vector search is designed into the schema and services, with provider integration kept pluggable.
- Google Merchant feed support is required, but products can be marked ineligible until fields are complete.
- Existing URLs stay stable; redirects are created for intentional slug changes.
