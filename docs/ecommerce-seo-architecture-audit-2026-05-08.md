# Kvastram E-commerce SEO Architecture Audit

Date: 2026-05-08  
Scope: Admin panel, backend product architecture, storefront SEO, product discoverability, semantic search readiness, Merchant compatibility, fashion commerce SEO, CRO integration.

## Scores

| Area | Score |
|---|---:|
| Overall SEO readiness | 46/100 |
| Technical SEO | 58/100 |
| Product SEO | 39/100 |
| Semantic SEO | 26/100 |
| AI search readiness | 22/100 |
| UX + CRO | 66/100 |
| Admin panel capability | 44/100 |

## Executive Verdict

Kvastram has a respectable SEO foundation: server-rendered product pages, editable product handles, basic product/category/collection metadata, sitemap, robots, JSON-LD helpers, canonical product redirects, collection pages, reviews, media handling, tags, and basic international pricing.

But it is not yet built like a 2026 global fashion marketplace. The current system behaves more like a boutique catalog with metadata fields than an Etsy-style discovery engine. The biggest weakness is product intelligence: fabric, technique, occasion, pattern, style, artisan, region, color, fit, sleeve, search intent, synonyms, and merchant feed attributes are mostly unstructured or missing.

## Critical SEO Problems

| Problem | Why It Matters | Impact | Implementation |
|---|---|---|---|
| Product attributes are not structured enough. `material` is plain text and the rest lives nowhere durable. | Fashion discovery depends on structured facets: fabric, print, fit, occasion, sleeve, region, artisan craft. Plain text cannot scale ranking, filters, feeds, AI search, or internal links. | SEO high, business high, scalability high. | Add normalized attribute taxonomy tables and controlled vocabularies. Keep free-text notes separate from canonical facet values. |
| Search is substring search only. Backend searches title and description with SQL `LIKE`, not tags, attributes, synonyms, typo tolerance, vectors, or popularity. | Etsy-style discovery is query understanding. "boho cotton kaftan", "jaipur block print dress", "summer wedding kurti" should map to attributes and intent, not only literal text. | SEO medium, conversion high, scalability high. | Add Postgres full-text plus trigram now, vector embeddings next, synonym dictionaries, query logs, boosted fields, and merchandising ranking. |
| Product schema is too thin for Merchant/Shopping. JSON-LD has `Product`, `Offer`, SKU, brand, price, availability, rating, but no GTIN/MPN policy, `ProductGroup`, variant `hasVariant`, shipping, returns, condition, color, size, material, pattern. | Google merchant listings can use price, availability, shipping, returns, and variant data. Apparel feeds require color, size, gender, age group, material, and item group data in key markets. | SEO high, Google Shopping high, revenue high. | Add merchant attributes at variant level and emit ProductGroup plus Product variant JSON-LD. Build a Merchant Center feed endpoint. |
| Admin SEO controls stop at title/description. Product editor supports handle, SEO title, meta description, tags, category, collection, material, HS code, origin. It does not support canonical, robots, OG override, Twitter card, schema controls, keyword clusters, search intent, multilingual keywords, or related links. | Editors cannot manage crawl/index behavior or rich discovery metadata without engineering changes. | SEO high, workflow high, scalability high. | Add a dedicated "SEO & Discovery" tab with validation, previews, index controls, semantic fields, merchant readiness, and schema preview. |
| Media alt storage exists but no admin alt editor is visible. `alt_text` is stored and rendered, but `ProductMediaUpload` only previews alt; it does not expose editable alt text. | Fashion SEO is image-led: Google Images, Pinterest, AI visual discovery, and accessibility all need intentional alt text. | SEO medium, Pinterest high, accessibility high. | Add per-image alt, role, view type, color, model/on-flat-lay, filename/public ID controls. Auto-suggest but require human approval. |
| Faceted navigation is not architected for index control. Filters use query params and client router pushes. Collections are clean URLs, but facet combinations lack index policy, canonical policy, URL allowlist, and facet landing-page generation. | Fashion stores need selective indexation: `/collections/block-print-dresses`, `/collections/cotton-kaftans`, not infinite `?tag_id=&sort=` combinations. | Crawl high, SEO high, scalability high. | Create indexable SEO collections from approved facet combinations; keep utility filters canonicalized/noindexed. |
| International SEO is currency-aware, not locale-aware. The system has regions/currencies and country checkout, but storefront is single `lang="en"` and no hreflang alternates. | Global fashion search differs by US, UK, EU, AU, India vocabulary and shipping expectations. Currency conversion is not hreflang. | International SEO high, business high. | Add locale URL strategy: `/en-us`, `/en-gb`, `/en-au`, `/en-in`, self-referencing hreflang, localized metadata, localized shipping/returns. |

## What Works

- Dynamic sitemap generation includes products, categories, collections, pages, and posts.
- Product pages server-render metadata and JSON-LD.
- Product handle canonical redirects exist.
- Categories and collections have basic SEO fields.
- Product image `alt_text` exists in the database and storefront rendering path.
- Next image optimization supports AVIF/WebP.
- Cloudinary delivery is partially optimized through `f_auto,q_auto`.
- Reviews, wishlist, recently viewed, back-in-stock, low stock, share, and trust UI exist on product pages.
- Redirect management exists in backend/admin, though public storefront middleware consumption was not found during the audit.

## Missing Admin Features

| Feature | Status |
|---|---|
| SEO title, meta description, editable slug | Present |
| Canonical URL override | Missing |
| Robots meta per product/collection | Missing |
| OG/Twitter per product | Missing |
| Product schema controls | Missing |
| Product tags | Present, shallow |
| Semantic keywords and keyword clusters | Missing |
| Synonyms and typo dictionaries | Missing |
| Multi-language keywords | Missing |
| Search intent mapping | Missing |
| Structured fabric/technique/occasion/style/sleeve/fit/pattern/region/artisan | Mostly missing |
| Image alt editing | Storage exists, workflow missing |
| WebP/AVIF delivery | Partly present |
| CDN integration | Present through Cloudinary |
| Merchant fields GTIN/MPN/item group/gender/age/color/size system | Mostly missing |
| Blog topical clusters | Basic blog exists, clusters missing |
| AI/vector discovery management | Missing |

## High-Priority Fixes

1. Build a fashion attribute system: `fabric`, `material_composition`, `technique`, `print`, `pattern`, `color_family`, `occasion`, `style`, `fit`, `sleeve`, `length`, `region`, `artisan_group`, `sustainability_claim`, `care`, `season`.
2. Add merchant-ready variant fields: `gtin`, `mpn`, `barcode`, `item_group_id`, `color`, `size`, `size_system`, `size_type`, `gender`, `age_group`, `condition`, `availability_date`.
3. Replace product JSON-LD with ProductGroup-aware structured data for variants.
4. Add SEO collection generation for approved long-tail pages: `/collections/block-print-cotton-dresses`, `/collections/jaipur-boho-bags`, `/collections/kantha-quilts`, `/collections/festive-kurtis`.
5. Upgrade internal search to Postgres FTS plus trigram plus synonym expansion; later add vector search.
6. Add per-image alt editing and image role tagging: front, back, detail, fabric close-up, model, flat lay.
7. Add canonical/index controls for search, filters, collections, posts, pages, and products.
8. Create a Google Merchant feed endpoint and validation dashboard.

## Medium-Priority Fixes

- Add SEO QA scoring in admin before publish.
- Add product completeness rules for image count, alt text, material, origin, category, price, variant SKU, shipping data, and merchant attributes.
- Add category/collection body copy sections that render above and below product grids.
- Add FAQ schema for product classes and shipping/returns pages.
- Add breadcrumb schema consistently across all indexable catalog pages.
- Add internal link automation by same fabric, same print, same region, same occasion, and same artisan technique.
- Add automated stale URL redirect creation when handles/slugs change.
- Add zero-results search analytics and synonym suggestions.
- Add indexable collection governance: demand, product count, uniqueness, canonical, and crawl budget controls.

## Future-Ready SEO Improvements

- Vector search product embeddings.
- AI-generated but human-approved product enrichment.
- Semantic entity graph for Jaipur, Kantha, Sanganer block print, slow fashion, sustainable textiles, and artisan groups.
- Search intent classification: buy, compare, gift, occasion, style inspiration, care/how-to.
- Multilingual keyword fields for Hindi, English, US English, UK English, and marketplace-style synonyms.
- Product knowledge graph export for AI commerce surfaces.
- Query-to-collection generation for high-demand search phrases.
- Feed quality monitoring for Google Merchant, Pinterest, Meta catalog, and Etsy-style marketplaces.

## Recommended Database Structure

```sql
product_seo(
  product_id,
  seo_title,
  meta_description,
  canonical_url,
  robots_index,
  robots_follow,
  og_title,
  og_description,
  og_image_url,
  twitter_card,
  schema_overrides_json
);

product_attributes(
  id,
  code,
  label,
  type,
  facet_enabled,
  seo_enabled,
  merchant_mapping
);

attribute_values(
  id,
  attribute_id,
  slug,
  label,
  synonyms_json,
  locale_labels_json
);

product_attribute_values(
  product_id,
  attribute_id,
  value_id,
  raw_value,
  confidence,
  source
);

product_discovery(
  product_id,
  primary_keyword,
  secondary_keywords_json,
  search_intents_json,
  semantic_entities_json,
  negative_keywords_json
);

product_variant_merchant(
  variant_id,
  gtin,
  mpn,
  item_group_id,
  color,
  size,
  size_system,
  size_type,
  gender,
  age_group,
  condition
);

search_synonyms(
  id,
  locale,
  term,
  synonyms_json,
  normalized_term,
  boost
);

seo_landing_pages(
  id,
  slug,
  title,
  meta_description,
  rule_json,
  indexable,
  canonical_url,
  hreflang_group_id
);

product_embeddings(
  product_id,
  locale,
  embedding,
  source_hash,
  updated_at
);
```

## Recommended Product Schema Structure

```json
{
  "title": "Blue Jaipur Block Print Cotton Kaftan",
  "category": "Kaftans",
  "fabric": "Cotton",
  "technique": "Hand block print",
  "print_region": "Jaipur",
  "style": ["boho", "ethnic", "resort wear"],
  "occasion": ["vacation", "summer", "casual"],
  "fit": "relaxed",
  "pattern": "floral block print",
  "artisan": {
    "region": "Jaipur",
    "craft": "block printing"
  },
  "merchant": {
    "gender": "female",
    "age_group": "adult",
    "color": "Blue",
    "size_system": "IN"
  },
  "seo": {
    "primary_keyword": "blue block print cotton kaftan",
    "intent": "buy"
  }
}
```

## Recommended URL Architecture

Use clean, curated URLs for indexable demand:

- `/products/{product-slug}`
- `/collections/{primary-category}`
- `/collections/{attribute-category}` such as `/collections/block-print-dresses`
- `/collections/{occasion}` such as `/collections/wedding-guest-kurtis`
- `/journal/{topic}/{article-slug}` once content grows
- `/en-us/products/{slug}`, `/en-gb/products/{slug}`, `/en-in/products/{slug}` for international SEO

Keep utility filters as non-indexable or canonicalized:

- `?sort=`
- `?price=`
- `?page=`
- temporary search params
- internal IDs

## Recommended Tag/Keyword System

Do not use tags as a flat bucket. Use five classes:

- `facet_tags`: customer filters like cotton, block print, kaftan
- `seo_keywords`: target phrases like "Jaipur block print dress"
- `semantic_entities`: Jaipur, Kantha, Sanganer, artisan, slow fashion
- `merchandising_tags`: bestseller, new arrival, giftable
- `internal_tags`: supplier, margin, warehouse, photo-needed

## Recommended Semantic SEO System

Create entity templates for each craft and product class. Example: "Block print" should connect to Jaipur, Sanganer, hand-carved wooden blocks, cotton, natural dye, artisan process, care, and outfit use cases.

Product pages should render visible semantic sections, not only metadata:

- craft story
- fabric
- making time
- styling
- occasion
- care
- shipping
- artisan provenance
- FAQ

## Recommended AI-Powered Product Discovery Architecture

Use a hybrid ranking stack:

1. Query normalization: spelling, plural/singular, Hindi/Indian fashion synonyms.
2. Lexical retrieval: Postgres `tsvector` over title, description, attributes, tags.
3. Fuzzy retrieval: trigram for typo tolerance.
4. Vector retrieval: embeddings over enriched product documents.
5. Ranking features: availability, margin, recency, conversion rate, return rate, review score, image completeness.
6. LLM layer: query rewrite and guided filters, not direct ranking authority.
7. Feedback loop: zero-result queries, clicked products, added-to-cart, purchased, returned.

## Source Baseline

This audit was cross-checked against current Google Search Central and Merchant documentation:

- Google Merchant product data specification
- Google merchant listing structured data
- Google ProductGroup/product variant structured data
- Google large-site crawl budget and faceted navigation guidance
- Google hreflang/localized versions guidance
- Google image SEO best practices

