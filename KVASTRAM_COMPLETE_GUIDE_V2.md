# Kvastram — Category & Collection System: Complete Rules & Architecture Guide v2.0

> **Purpose:** Ye guide Claude Code aur developers ke liye ek binding rulebook hai.
> Kvastram (kvastram.com) ke admin panel mein Categories, Collections, aur Products ka
> poora system is document ke rules ke according banana aur maintain karna hai.
> Koi bhi existing broken data is spec ke against rebuild hogi.
>
> **Version:** 2.0 — Gap analysis ke baad updated (22 gaps covered)
> **Store:** kvastram.com | **Last Updated:** May 2026

---

## Table of Contents

1.  [System Overview — Do Alag Cheezein Hain](#1-system-overview)
2.  [Categories — Rules & Structure](#2-categories)
3.  [Collections — Rules & Structure](#3-collections)
4.  [Product Assignment Rules](#4-product-assignment)
5.  [Database Schema](#5-database-schema)
6.  [Admin Panel Behavior Specs](#6-admin-panel-specs)
7.  [Admin Roles & Permissions](#7-admin-roles-permissions)
8.  [URL & Slug Rules](#8-url-and-slug-rules)
9.  [Navigation Integration Rules](#9-navigation-integration)
10. [Frontend Display Rules](#10-frontend-display-rules)
11. [SEO Rules](#11-seo-rules)
12. [Filter & Search Rules](#12-filter-and-search-rules)
13. [Data Validation & Quality Gates](#13-data-validation)
14. [Kvastram-Specific Taxonomy](#14-kvastram-taxonomy)
15. [What Must Be Deleted / Cleaned](#15-cleanup-required)
16. [Do's and Don'ts Summary](#16-summary)

---

## 1. System Overview

Kvastram ke store mein **do alag, alag purpose ke systems** hain. Inhe mix nahi karna:

```
CATEGORY (permanent, product-type based)
├── Jackets
├── Sarees
├── Bags & Totes
├── Suits & Kurtas
└── ...

COLLECTION (curated, admin-created, time/theme based)
├── Summer Edit 2025
├── Festival Picks
├── Wedding Anniversary Looks
└── Gifts Under ₹2,000
```

| Feature              | Category                            | Collection                              |
|----------------------|-------------------------------------|-----------------------------------------|
| Kya hai?             | Product ka TYPE (permanent label)   | Admin-curated EDIT (theme/occasion)     |
| Kitni hogi?          | Fixed — 10-15 max                   | Flexible — admin add/remove karta rahe  |
| Ek product mein?     | Exactly ONE category                | Multiple collections (0 se N tak)       |
| URL format           | `/categories/jackets`               | `/collections/summer-edit-2025`         |
| Products zaruri?     | Haan — category bina product nahi   | Haan — min 3 products required          |
| Delete hoti hai?     | Nahi (permanent)                    | Haan (season khatam = archive/delete)   |
| Mega menu mein?      | Haan — primary nav                  | Optional — featured section             |
| Page type            | Filter + grid (utilitarian)         | Editorial layout (story + products)     |
| Subcategories?       | Haan — 2-level max                  | Nahi — flat only                        |

---

## 2. Categories

### 2.1 Category Kya Hoti Hai

Category ek **product type label** hai — product ka permanent identity.
Jaise ek jacket hamesha "Jackets" category mein rahega chahe koi bhi sale, season, ya collection ho.

### 2.2 Category Hierarchy (2-Level Max)

Kvastram ek **2-level category tree** support karta hai. Deeper nesting allowed nahi.

```
Level 1 (Parent Category)
└── Level 2 (Subcategory)

Example:
Bags & Totes             ← parent slug: bags
├── Tote Bags            ← slug: tote-bags
├── Toiletry Pouches     ← slug: toiletry-bags
└── Clutches             ← slug: clutches

Clothing                 ← parent slug: clothing
├── Jackets              ← slug: jackets
├── Sarees               ← slug: sarees
├── Suits & Kurtas       ← slug: suits-kurtas
└── Lehengas             ← slug: lehengas
```

**RULE C-HIER-1:** Parent category ke paas apne directly-assigned products nahi honge —
woh sirf grouping ke liye hogi. Products sirf leaf (Level 2) categories mein assign honge.

**RULE C-HIER-2:** Agar abhi subcategories nahi chahiye, toh flat (Level 1 only) use karo.
Level 1 category directly products hold kar sakti hai agar usme koi children nahi hain.

**RULE C-HIER-3:** URL structure:
- Parent only: `/categories/bags`
- With child:  `/categories/bags/tote-bags`

### 2.3 Kvastram Master Category List

Ye categories **fixed** hain. Naya category add karne ke liye developer approval chahiye.

| Parent | Child Slug      | Display Name      | Description                              |
|--------|-----------------|-------------------|------------------------------------------|
| —      | `clothing`      | Clothing          | Top-level group — no products assigned   |
| clothing | `jackets`     | Jackets           | Kantha, Velvet, Kimono — all outerwear   |
| clothing | `sarees`      | Sarees            | Handloom, Kantha, Block Print sarees     |
| clothing | `suits-kurtas`| Suits & Kurtas    | Kurta sets, straight suits, Anarkali     |
| clothing | `lehengas`    | Lehengas          | Bridal, festive, semi-formal             |
| clothing | `t-shirts`    | T-Shirts & Tops   | Kantha print tops, casual wear           |
| —      | `bags`          | Bags & Totes      | Top-level group — no products assigned   |
| bags   | `tote-bags`     | Tote Bags         | Kantha print carry bags                  |
| bags   | `toiletry-bags` | Toiletry Pouches  | Travel bags, cosmetic pouches            |
| bags   | `clutches`      | Clutches          | Evening bags, small purses               |
| —      | `home-textiles` | Home Textiles     | Quilts, throws, bedspreads               |
| —      | `scarves-wraps` | Scarves & Wraps   | Stoles, dupattas, shawls                 |
| —      | `accessories`   | Accessories       | Jewellery, belts, small goods            |

### 2.4 Category Rules (Hard Rules)

**RULE C-1:** Ek product mein exactly ek (leaf) category hogi.
Koi product "Jackets" aur "Suits" dono mein nahi ho sakta.

**RULE C-2:** Category name mein trailing/leading space KABHI nahi.
"Jackets " invalid hai. Admin panel auto-trim karega on save.

**RULE C-3:** Category label on product card = product ki actual assigned category ka display name.
Mismatched labels = data integrity violation = build fail.

**RULE C-4:** Category slug lowercase, hyphen-separated, no special chars.
`tote-bags` ✅ | `Tote Bags` ❌ | `tote_bags` ❌ | `tote-bags ` ❌

**RULE C-5:** Homepage category grid sirf leaf categories show karega (parent groups nahi).
Koi bhi "Test Category", "Kvastram", ya placeholder category homepage pe nahi aayegi.

**RULE C-6:** Category image required hai aur Active hone ke liye mandatory hai.
Image specs: min 800×1000px, portrait orientation, webp format, Cloudinary upload.

**RULE C-7:** Category delete tab tak BLOCK hogi jab tak us category mein koi bhi product ho
— active, draft, ya archived. Archived products bhi count honge.
Delete se pehle admin ko products reassign karne honge.

### 2.5 Category Admin Panel Fields

```
Category Create/Edit Form:
├── Name (required)
├── Slug (auto-generated, locked after 1st product assigned)
├── Parent Category (optional dropdown — Level 1 only)
├── Description (optional, shown on category page)
├── Image (required to go Active)
│   └── Specs: 800×1000px min, portrait, webp
├── Sort Order (number — homepage grid order)
├── Is Active (toggle — inactive = hidden everywhere)
└── SEO
    ├── Meta Title (default: "{Name} — Handmade Indian Fashion | Kvastram")
    ├── Meta Description (default: auto-generated from category description)
    └── OG Image (default: category image, 1200×630px crop)
```

---

## 3. Collections

### 3.1 Collection Kya Hoti Hai

Collection ek **curated editorial edit** hai — admin manually products daalta hai.
"Wedding Anniversary Looks" ek collection hai, category nahi.
Collection time-bound, occasion-based, ya marketing-driven hoti hai.

### 3.2 Collection Rules (Hard Rules)

**RULE CO-1:** Collection tab tak LIVE nahi hogi jab tak usme minimum 3 ACTIVE products na hon.
0-2 products wali collection automatically `draft` status mein rahegi.

**RULE CO-2:** Collection name globally unique hoga (case-insensitive).
"Bags" aur "bags" ek hi manenge — duplicate blocked.

**RULE CO-3:** Collection name clean — auto-trim on save (leading/trailing spaces hata).

**RULE CO-4:** Slug URL-safe — lowercase, hyphens only.
`festival-picks` ✅ | `Festival Picks` ❌ | `festival picks ` ❌

**RULE CO-5:** Cover image required hai Active hone ke liye.
Specs: 1200×800px landscape, webp format.

**RULE CO-6:** Status system:
- `draft` — sirf admin dekh sakta hai, customers nahi
- `active` — live (min 3 active products + cover image)
- `archived` — hidden, data preserved (seasonal ke liye)
Draft/archived collections sitemap mein nahi aayengi.

**RULE CO-7:** Footer/nav links mein sirf ACTIVE collections hongi.
Broken link = build-time warning + deployment block.

**RULE CO-8:** Product delete hone par auto-remove from all collections.
Agar removal se collection ke products < 3 ho jaayein, collection automatically `draft` mein jaayegi.

### 3.3 Collection Types

| Type       | Example                        | Homepage Section        |
|------------|-------------------------------|-------------------------|
| `occasion` | Wedding Looks, Festival Picks  | "Shop by Occasion"      |
| `seasonal` | Summer Edit 2025               | "Seasonal Edits"        |
| `price`    | Gifts Under ₹2,000, Sale       | Nav + Homepage          |
| `fabric`   | Kantha Edit, Block Print       | "Shop by Fabric"        |
| `gift`     | Gifts for Her, Gifts Under $75 | Gift guide section      |
| `style`    | Boho Essentials, Minimal Edit  | Collections page        |

### 3.4 Rule-Based Auto-Collections (Smart Collections)

Kuch collections manually manage karna mushkil hota hai. Ye auto-update hongi:

| Collection Name    | Rule                                         | Type       |
|--------------------|----------------------------------------------|------------|
| New Arrivals       | products created in last 30 days             | `seasonal` |
| Bestsellers        | products with orders_count > 10              | `style`    |
| Sale               | products with discount_percent > 0           | `price`    |
| Almost Gone        | products with stock_quantity <= 3            | `style`    |

**RULE CO-AUTO-1:** Auto-collection rules admin panel mein editable hain (threshold values).
**RULE CO-AUTO-2:** Auto-collections mein manual override allowed hai
(admin specific products add/exclude kar sakta hai).
**RULE CO-AUTO-3:** Auto-collections bhi min 3 products rule follow karenge status ke liye.

### 3.5 Collection Admin Panel Fields

```
Collection Create/Edit Form:
├── Name (required, unique)
├── Slug (auto-generated)
├── Type (dropdown: occasion/seasonal/price/fabric/gift/style)
├── Rule Type (manual OR auto)
│   └── If auto: rule definition (field + operator + value)
├── Description (optional, shown on collection page hero)
├── Cover Image (required for Active)
│   └── Specs: 1200×800px landscape, webp
├── Products
│   ├── If manual: multi-select product picker
│   ├── If auto: auto-populated + manual override list
│   └── Product count badge: "4 products" (must be ≥3 for Active)
├── Product Sort Order (drag-and-drop OR auto: newest/price/bestselling)
├── Status (draft / active / archived)
├── Display Order (for homepage section ordering)
├── Show in Mega Menu (toggle, max 6 per column)
├── Show in Homepage Section (dropdown: which section)
├── Valid From / Valid Until (optional, auto-archive on end date)
└── SEO
    ├── Meta Title
    ├── Meta Description
    └── OG Image (default: cover image cropped 1200×630)
```

---

## 4. Product Assignment Rules

### 4.1 Every Product Must Have

```
Product Required Fields:
├── name          string      Clean Title Case name, 10-80 chars
├── slug          string      Auto from name, URL-safe, unique
├── price_type    enum        'fixed' | 'on_request'
├── price         decimal     Required if price_type = 'fixed', min ₹1
├── category_id   uuid        FK to leaf category — required, cannot be null
├── images        array       Min 2 images (front + detail)
├── status        enum        'draft' | 'active' | 'archived'
└── description   object      Structured blocks (see Section 4.3)
```

### 4.2 Product Name Rules

**RULE P-1:** Test/placeholder names production pe nahi jaayenge.
Invalid patterns (admin will warn):
- Random chars: "Jjjn", "Njkkkk", "hhjkkj", "AAAA"
- All lowercase generic: "best tshirt", "tote bags", "jacket"
- Known test words: "test", "sample", "dummy", "temp", "xxx"

**RULE P-2:** Product name Title Case mein hoga.
`Kantha Quilted Kimono Jacket` ✅
`kantha quilted kimono jacket` ❌
`KANTHA QUILTED KIMONO JACKET` ❌

**RULE P-3:** Name length 10-80 characters ke beech.
< 10 chars = too short warning.
> 80 chars = truncation warning (slug bhi bahut lamba ho jaata hai).

### 4.3 Price Type Rules

**RULE P-4:** `price_type` field har product par mandatory hai.

```
price_type = 'fixed':
├── price field required (decimal, min ₹1 / $0.01)
├── compare_at_price optional (original price for strikethrough)
├── CTA button: "Add to Bag"
└── Cart/checkout flow: normal

price_type = 'on_request':
├── price field = null (nahi bharenge)
├── CTA button: "Enquire on WhatsApp" (NOT "Add to Bag")
├── WhatsApp link: wa.me/{number}?text=Hi, interested in: {product_name}
├── No add-to-cart functionality
└── No checkout flow for this product
```

**RULE P-5:** Product page pe `price_type = 'on_request'` hone par
"Add to Bag" button KABHI nahi dikhega. Sirf WhatsApp/inquiry CTA dikhega.
Abhi live store pe yeh broken hai — both show ho rahe hain, fix required.

### 4.4 Product Description Structure

Har product ki description structured blocks mein hogi, free-form paragraph nahi.
Ye blocks admin panel mein separate fields honge:

```
Description Blocks (all required for Active status):

Block 1 — Story (required, min 50 chars)
  "Hand-stitched by artisan women in Jaipur's old city using
   recycled cotton saris layered with kantha embroidery..."

Block 2 — Details (required — structured key-value)
  ├── Fabric:      "100% Cotton, Kantha quilted"
  ├── Dimensions:  "Chest 46in, Length 26in, Sleeve 19in"
  ├── Fit:         "Relaxed / Oversized"
  └── SKU:         "KVS-JKT-001"

Block 3 — Craft Note (required, min 30 chars)
  "Each piece is one of a kind — minor variations in embroidery
   placement are part of the handmade process, not defects."

Block 4 — Care Instructions (required)
  "Dry clean recommended. Gentle hand wash in cold water.
   Do not tumble dry. Iron on reverse."

Block 5 — Made In (required)
  "Handmade in Jaipur, Rajasthan, India"
```

**RULE P-6:** Description mein "handmade handmade", "default variant", ya
"crafted in default variant" jaisi auto-generated/duplicate phrases NAHI aayengi.
Admin panel text field mein duplicate word detection warning add karo.

### 4.5 Product Images

```
Image Requirements:
├── Minimum 2 images per product (active status ke liye)
├── Image 1 (front view):   800×1000px, portrait, webp, <300KB
├── Image 2 (detail view):  800×1000px, portrait, webp, <300KB
├── Image 3+ (optional):    same specs
└── Alt text: auto-generated as "{Color} {Product Name} {Category} front/detail view"

Cloudinary transformation for product card thumbnail:
  f_auto,q_auto,c_fill,w_600,h_750,g_auto

OG Image crop: c_fill,w_1200,h_630,g_auto
```

### 4.6 Product ↔ Category Assignment

```
Admin product save karte waqt validation:
1. category_id required — blank save blocked
2. Selected category must be a LEAF category (no parent categories)
3. Selected category must be in master list
4. Product card display: category label = category.display_name
5. Category breadcrumb: Home → {Category Name} → {Product Name}
```

### 4.7 Product ↔ Collection Assignment

```
Admin product edit page — "Collections" tab:
├── Multi-select: product N collections mein ho sakta hai
├── Shows: "This product is in 3 collections: [Festival Picks] [New Arrivals] [Gifts]"
├── Remove: collection edit page pe bhi removable
├── Delete product: auto-removed from all collections
│   └── If collection drops below 3 products: auto-draft
└── Bulk assign: products list page se multiple products ek collection mein add
```

---

## 5. Database Schema

### 5.1 Categories Table

```sql
CREATE TABLE categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(120) NOT NULL UNIQUE,
  parent_id     UUID REFERENCES categories(id) ON DELETE RESTRICT,
  description   TEXT,
  image_url     TEXT,
  sort_order    INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT false,
  seo_title     VARCHAR(200),
  seo_desc      VARCHAR(300),
  og_image_url  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT name_trimmed CHECK (name = trim(name)),
  CONSTRAINT max_depth CHECK (
    parent_id IS NULL OR
    (SELECT parent_id FROM categories p WHERE p.id = parent_id) IS NULL
  )
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active);
```

### 5.2 Collections Table

```sql
CREATE TABLE collections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(150) NOT NULL,
  slug            VARCHAR(160) NOT NULL UNIQUE,
  type            VARCHAR(20) NOT NULL CHECK (type IN
                    ('occasion','seasonal','price','fabric','gift','style')),
  rule_type       VARCHAR(10) DEFAULT 'manual' CHECK (rule_type IN ('manual','auto')),
  rule_definition JSONB,
  description     TEXT,
  cover_image_url TEXT,
  status          VARCHAR(10) DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  display_order   INTEGER DEFAULT 0,
  show_in_megamenu BOOLEAN DEFAULT false,
  homepage_section VARCHAR(50),
  valid_from      TIMESTAMPTZ,
  valid_until     TIMESTAMPTZ,
  seo_title       VARCHAR(200),
  seo_desc        VARCHAR(300),
  og_image_url    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT name_trimmed CHECK (name = trim(name)),
  CONSTRAINT name_unique_ci UNIQUE (lower(name))
);

CREATE INDEX idx_collections_slug ON collections(slug);
CREATE INDEX idx_collections_status ON collections(status);
CREATE INDEX idx_collections_type ON collections(type);
```

### 5.3 Products Table (Relevant Fields)

```sql
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  slug            VARCHAR(220) NOT NULL UNIQUE,
  category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  price_type      VARCHAR(15) DEFAULT 'fixed' CHECK (price_type IN ('fixed','on_request')),
  price           DECIMAL(10,2),
  compare_at_price DECIMAL(10,2),
  status          VARCHAR(10) DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  description_story    TEXT,
  description_details  JSONB,
  description_craft    TEXT,
  description_care     TEXT,
  made_in         VARCHAR(100) DEFAULT 'Jaipur, Rajasthan, India',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT name_trimmed CHECK (name = trim(name)),
  CONSTRAINT price_required CHECK (
    price_type = 'on_request' OR (price IS NOT NULL AND price > 0)
  ),
  CONSTRAINT name_not_test CHECK (
    name !~* '^(test|sample|dummy|temp|jjj|kkk|hhh|njk|hhjk)'
  )
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_slug ON products(slug);
```

### 5.4 Product-Collections M2M Junction Table

```sql
CREATE TABLE product_collections (
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  position      INTEGER DEFAULT 0,
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  added_by      UUID,

  PRIMARY KEY (product_id, collection_id)
);

CREATE INDEX idx_pc_collection ON product_collections(collection_id, position);
CREATE INDEX idx_pc_product ON product_collections(product_id);
```

**Cascade behavior:**
- Product delete → auto-removed from all collections (CASCADE)
- Collection delete → junction rows removed (CASCADE)
- After any CASCADE remove: trigger checks collection product count.
  If active collection drops below 3 → set status = 'draft'

```sql
-- Trigger: auto-draft collection when products drop below 3
CREATE OR REPLACE FUNCTION check_collection_product_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE collections
  SET status = 'draft'
  WHERE id = OLD.collection_id
    AND status = 'active'
    AND (SELECT COUNT(*) FROM product_collections pc
         JOIN products p ON p.id = pc.product_id
         WHERE pc.collection_id = OLD.collection_id
           AND p.status = 'active') < 3;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_collection_count_check
AFTER DELETE ON product_collections
FOR EACH ROW EXECUTE FUNCTION check_collection_product_count();
```

### 5.5 Product Images Table

```sql
CREATE TABLE product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt_text    VARCHAR(300),
  position    INTEGER DEFAULT 0,
  variant     VARCHAR(50),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_images_product ON product_images(product_id, position);
```

---

## 6. Admin Panel Behavior Specs

### 6.1 Sidebar Navigation

```
Admin Sidebar:
├── Dashboard
├── Products
│   ├── All Products          (with bulk actions)
│   ├── Add New Product
│   └── Bulk Upload (CSV)
├── Categories
│   ├── All Categories        (tree view with drag-drop sort)
│   └── Add Category
├── Collections
│   ├── All Collections       (with status filter)
│   ├── Add Collection
│   └── Featured Manager      (drag to set homepage order)
├── Orders
├── Customers
├── Navigation
│   └── Mega Menu Editor      (visual drag-drop)
└── Settings
```

### 6.2 Categories Admin Page

```
/admin/categories — Tree view with expand/collapse

Table Columns:
| Drag | Image | Name | Slug | Level | Products | Status | Actions |

- Level badge: "Parent" or "Sub"
- Products count: active count / total count
- Status toggle (disabled if products exist and going Inactive — warn first)
- Delete: blocked if any product (active/draft/archived) exists in category

Validation on Save:
✓ Name required, trimmed, 3-100 chars
✓ Name not duplicate (case-insensitive within same parent level)
✓ Slug auto-generated, validated format, unique globally
✓ Slug LOCKED once any product is assigned (edit shows warning)
✓ Parent: only Level 1 categories in dropdown (no grandchildren)
✓ Image required to set Active
✓ Cannot set Active if 0 products (show info, not hard block)
```

### 6.3 Collections Admin Page

```
/admin/collections

Filters: All | Active | Draft | Archived | By Type | With 0 Products

Table Columns:
| Image | Name | Type | Rule | Products | Status | Valid Until | Actions |

Status Indicators:
🟢 Active   — min 3 products, has image, status=active
🟡 Draft    — any publish gate failing
⚫ Archived — manually or auto-archived
🔴 Broken   — active but linked in nav, has <3 products (data inconsistency)

Validation on Save:
✓ Name required, trimmed, 3-150 chars
✓ Name globally unique (case-insensitive) — block on duplicate
✓ Slug auto, URL-safe, unique
✓ Status cannot be Active if: products < 3 OR no cover image
✓ If valid_until in past and status=active: warn + auto-archive
```

### 6.4 Bulk Actions (Products List)

```
Products list page — checkbox multi-select enables:

Bulk Actions Dropdown:
├── Assign Category    → modal: pick one category from master list
├── Add to Collection  → modal: pick one or more active/draft collections
├── Remove from Collection → modal: pick collection
├── Set Status         → Active / Draft / Archived
├── Set Price Type     → Fixed / On Request
└── Delete             → confirm modal, "X products will be permanently deleted"

Bulk CSV Upload:
├── Template download with all required columns
├── Validation run before import (show errors per row)
└── Import creates products as Draft — manual review before Active
```

### 6.5 Collection Product Ordering

```
Collection Edit Page — Products tab:

Default Sort Options (radio):
○ Manual order (drag-and-drop)
○ Newest first (created_at DESC)
○ Bestselling (orders_count DESC)
○ Price: low to high
○ Price: high to low

If "Manual order" selected:
→ Products list becomes drag-sortable
→ position field updated on drag
→ This order is reflected on /collections/{slug} storefront page
```

### 6.6 Admin Warnings

| Condition | Level | Message |
|---|---|---|
| Product with no category | Error | "Category required before publishing" |
| Product price_type=fixed, price=null | Error | "Price required for fixed price products" |
| Product: on_request + Add to Bag shown | Error | "on_request products must not show cart button" |
| Collection < 3 products, status=active | Error | "Add at least 3 products before activating" |
| Footer/nav link to non-existent slug | Warning | "Broken link: /collections/kantha-quilts not found" |
| Duplicate collection name | Error | "Collection with this name already exists" |
| Product name < 10 chars | Warning | "Name may be too short — verify this is correct" |
| Product name matches test pattern | Warning | "This looks like a test entry — verify before publishing" |
| Category image missing | Warning | "Add image to show on homepage grid" |
| Description block incomplete | Warning | "Story / Details / Care blocks required for Active" |
| "handmade handmade" or "default variant" in description | Warning | "Description contains auto-generated placeholder text" |
| Collection valid_until < today | Warning | "This collection has expired — archiving recommended" |

---

## 7. Admin Roles & Permissions

### 7.1 Role Definitions

| Role | Who | Access Level |
|---|---|---|
| `super_admin` | Store owner | Full access — create/edit/delete everything including roles |
| `editor` | Staff, marketing team | Create/edit products, collections, categories. Cannot delete categories with products. Cannot manage roles. |
| `viewer` | Read-only staff | View admin panel, export reports. Cannot edit anything. |

### 7.2 Permission Matrix

| Action | Super Admin | Editor | Viewer |
|---|---|---|---|
| Create category | ✅ | ✅ | ❌ |
| Edit category | ✅ | ✅ | ❌ |
| Delete category (no products) | ✅ | ✅ | ❌ |
| Delete category (has products) | ✅ | ❌ (blocked) | ❌ |
| Change category slug | ✅ | ❌ (locked) | ❌ |
| Create collection | ✅ | ✅ | ❌ |
| Archive collection | ✅ | ✅ | ❌ |
| Delete collection | ✅ | ❌ | ❌ |
| Create/edit product | ✅ | ✅ | ❌ |
| Delete product | ✅ | ❌ | ❌ |
| Bulk assign category | ✅ | ✅ | ❌ |
| Edit navigation/mega menu | ✅ | ❌ | ❌ |
| Manage admin roles | ✅ | ❌ | ❌ |
| View all orders/customers | ✅ | ✅ | ✅ |
| Export data | ✅ | ✅ | ✅ |

### 7.3 Audit Log

Har admin action log hoga:

```sql
CREATE TABLE admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  user_role   VARCHAR(20),
  action      VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id   UUID,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

Logged actions: category.create, category.delete, collection.status_change,
product.category_change, product.delete, nav.update, role.change

---

## 8. URL & Slug Rules

### 8.1 URL Format Standards

```
Categories:
/categories/{slug}                    — flat category
/categories/{parent-slug}/{slug}      — subcategory
e.g. /categories/bags/tote-bags

Collections:
/collections/{slug}
e.g. /collections/festival-picks-2025

Products:
/products/{slug}                      — ALWAYS canonical URL
e.g. /products/kantha-kimono-jacket

Filtered shop:
/products?category={slug}             — category filter
/products?sort=newest                 — sort
/products?category={slug}&sort=price  — combined

NEVER use tag_id in public URLs:
/products?tag_id=202e7213...          ❌ (internal only)
```

### 8.2 Canonical URL Rule

**RULE U-CANONICAL:** `/products/{slug}` HAMESHA canonical URL hai.
Agar same product `/collections/festival/products/jacket` jaisi URL se access ho,
canonical tag pointe karega `/products/jacket` ko.

```html
<!-- On any product page, regardless of how reached: -->
<link rel="canonical" href="https://kvastram.com/products/{slug}" />
```

### 8.3 Slug Generation Rules

```javascript
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
// "Kantha Kimono Jacket!" → "kantha-kimono-jacket"
```

**RULE U-LOCK:** Slug is LOCKED once first visit/product assigned.
Admin panel shows warning: "Changing this slug will break existing links and SEO rankings."
Only super_admin can force-change slug (with redirect setup).

**RULE U-REDIRECT:** Agar slug change zaruri ho, 301 redirect setup karo:
old slug → new slug. Redirect table maintain karo.

### 8.4 Multi-Currency Collection URLs

```
Indian market (INR): /collections/gifts-under-2000
Global market (USD): /collections/gifts-under-75

Ye DO ALAG collections hongi — shared products ke saath.
Ek universal collection mein dono currencies target karna misleading hai.
Collection name mein currency symbol dalo: "Gifts Under ₹2,000" vs "Gifts Under $75"
```

---

## 9. Navigation Integration Rules

### 9.1 Desktop Mega Menu Structure

```
Top Nav Bar:
[Logo] [Home] [New Arrivals] [SHOP ▾] [Plus Size] [Sale] [About] [Contact]
                                ↓ hover
┌─────────────────────────────────────────────────────────┐
│  Shop by Category      Collections        Featured       │
│  ─────────────────    ──────────────────  ────────────  │
│  Jackets               New Arrivals       [hero image]  │
│  Sarees                Bestsellers                       │
│  Suits & Kurtas        Festival Picks     Shop All →    │
│  Lehengas              Summer Edit 2025                  │
│  Bags & Totes          Kantha Essentials                 │
│  Accessories           Gifts Under ₹2K                   │
│  Home Textiles                                           │
│  Scarves & Wraps                                         │
└─────────────────────────────────────────────────────────┘
```

**RULE N-1:** Mega menu sirf ACTIVE categories aur collections dikhayega.
**RULE N-2:** Collections column mein max 6 items (toggle "Show in Mega Menu").
**RULE N-3:** Koi bhi link 404 nahi karega — nav save par link validation.
**RULE N-4:** Mega menu categories column = all active leaf categories, sorted by sort_order.

### 9.2 Mobile Navigation

```
Mobile Top Header:
[Logo]                    [Search icon] [Cart icon (count)]

Hamburger (≡) opens slide-in drawer:
├── Home
├── New Arrivals
├── Shop ▸ (accordion)
│   ├── --- Browse by Category ---
│   ├── Jackets
│   ├── Sarees
│   ├── Suits & Kurtas
│   ├── Lehengas
│   ├── Bags & Totes
│   └── Accessories
│   ├── --- Collections ---
│   ├── Festival Picks
│   ├── Summer Edit
│   └── View All Collections →
├── Plus Size
├── Sale
├── About
└── Contact

Mobile Bottom Nav (5 tabs — fixed):
[Home]  [Search]  [Shop]  [Wishlist]  [Account]
          ↑
   MANDATORY — currently missing from kvastram.com
```

**RULE N-5:** Search tab bottom nav mein MANDATORY hai.
**RULE N-6:** Bottom nav mein "Sale" separate tab nahi — Sale mega menu mein hai.
**RULE N-7:** Cart icon top header mein hoga with item count badge.

### 9.3 Announcement Bar

```
Announcement Bar (above header):
- Rotating messages (3-4 items, auto-rotate every 4s)
- Examples:
  "Free shipping on orders above ₹2,000 · Use code WELCOME10 for 10% off"
  "Handcrafted in Jaipur, India · Ships worldwide in 10-18 days"
  "New collection: Festival Picks 2025 — Shop Now →"
- Admin panel: Announcement Bar settings, toggle on/off, add/edit messages
```

### 9.4 Footer Links Validation

Footer mein koi bhi link broken nahi hona chahiye.
Currently broken links — fix karo:

```
MUST CREATE or REMOVE:
/collections/kantha-quilts    → Create "Kantha Essentials" collection (or redirect)
/collections/block-print      → Create "Block Print Edit" collection (or redirect)
/collections/dupattas-stoles  → Create "Scarves & Wraps" collection (or redirect)
/collections/gifts            → Create "Gifts Under ₹2,000" collection (or redirect)
/collections/shawls           → Redirect → /categories/scarves-wraps
/collections/kurtis           → Redirect → /categories/suits-kurtas
/collections/accessories      → Redirect → /categories/accessories
```

---

## 10. Frontend Display Rules

### 10.1 Category Page Layout

```
/categories/{slug}

1. Breadcrumb:    Home > {Parent Category} > {Category Name}
                  (parent shown only if subcategory)

2. Hero Bar:      Category name (H1) + description + product count
                  "Jackets — 12 products"

3. Subcategory Pills (if parent category):
   [All] [Tote Bags] [Toiletry Pouches] [Clutches]

4. Filter + Sort Bar:
   Filters: Price range | Size | In Stock only
   Sort: Newest | Bestselling | Price: Low–High | Price: High–Low

5. Product Grid:
   Desktop: 4 columns | Tablet: 3 columns | Mobile: 2 columns
   Product card shows: image, name, category label, price/on_request CTA

6. Empty State (0 products):
   "No pieces in this category yet — check back soon."
   + "Browse All" CTA button
   (NOT: blank page or 404)

7. Pagination or Infinite Scroll: defined per implementation
```

### 10.2 Collection Page Layout (Editorial)

```
/collections/{slug}

1. Full-width Hero:
   Cover image (1200×800) + Collection Name (H1) + Description
   "Festival Picks — Pieces that celebrate the craft of Rajasthan."

2. NO filter bar (collections are curated, not filtered)

3. Product Grid (same grid specs as category page)
   Products appear in admin-defined position order

4. "Related Collections" section at bottom (2-3 same-type collections)

5. Empty State (draft seen only by admin preview):
   Admin sees: "This collection has 0 products — add products before publishing."
   Customers: never see 0-product collections (draft = hidden)
```

### 10.3 Product Card Display Rules

```
Product Card:
├── Image (front, hover shows detail image)
├── Badges: "New" | "Almost Gone" | "Sale"
├── Brand label: "Kvastram" (always)
├── Category label: must match product.category.display_name
│   WRONG: Jacket product showing "Bags"
│   RIGHT:  Jacket product showing "Jackets"
├── Product name (Title Case)
└── Price:
    If price_type = 'fixed':   "₹2,000" (or "$24" based on currency)
    If price_type = 'on_request': "Enquire for price" (NOT "Contact for price" — too vague)
```

### 10.4 Empty States (All Page Types)

| Page | 0 Products State | Message |
|---|---|---|
| Category page | Show message + CTA | "No pieces here yet — browse all →" |
| Collection page (admin preview) | Show warning | "Add 3+ products before publishing" |
| Collection page (customer) | Should never happen | Draft collections are hidden |
| Search results | Show message | "No results for '{query}' — try Jackets or Sarees" |
| Sale page | Show message | "No sale items right now — check New Arrivals →" |

### 10.5 Breadcrumb Rules

```
Product page:     Home > Jackets > Kantha Kimono Jacket
Category page:    Home > Bags & Totes > Tote Bags
Collection page:  Home > Collections > Festival Picks
Search results:   Home > Search results for "kantha"

WRONG (currently live): Home > Kantha Quilted Short Kimono...
(Category step is missing — fix required)
```

---

## 11. SEO Rules

### 11.1 Meta Tags — Per Page Type

```
Category Page (/categories/jackets):
  title:       "Jackets — Handmade Kantha & Kimono Jackets | Kvastram"
  description: "Shop handmade Kantha quilted jackets and Kimono coats from
                Jaipur. Each piece is one of a kind, handcrafted by artisan
                women. Free worldwide shipping."
  og:title:    same as title
  og:image:    category.image_url (1200×630 crop)
  canonical:   https://kvastram.com/categories/jackets

Collection Page (/collections/festival-picks):
  title:       "Festival Picks — Handcrafted Indian Fashion | Kvastram"
  description: collection.seo_desc OR collection.description (first 160 chars)
  og:image:    collection.cover_image_url (1200×630 crop)
  canonical:   https://kvastram.com/collections/festival-picks

Product Page:
  title:       "{Product Name} | Kvastram"
  description: First 160 chars of description_story
  og:image:    First product image (1200×630 crop)
  canonical:   https://kvastram.com/products/{slug}  ← ALWAYS canonical

Admin default: auto-generate from category/collection/product data.
Admin can override per-entity in SEO fields.
```

### 11.2 Structured Data (JSON-LD)

Har page type pe schema.org markup required hai.

**Product Page:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Kantha Quilted Kimono Jacket",
  "image": ["https://res.cloudinary.com/.../image.webp"],
  "description": "Hand-stitched by artisan women in Jaipur...",
  "sku": "KVS-JKT-001",
  "brand": {
    "@type": "Brand",
    "name": "Kvastram"
  },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "INR",
    "price": "4500",
    "availability": "https://schema.org/InStock",
    "url": "https://kvastram.com/products/kantha-kimono-jacket"
  }
}
```

Note: `price_type = 'on_request'` products ke liye Offer.price omit karo,
`availability` set karo `InStock` aur seller contact info add karo.

**BreadcrumbList (every product/category/collection page):**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home",
      "item": "https://kvastram.com" },
    { "@type": "ListItem", "position": 2, "name": "Jackets",
      "item": "https://kvastram.com/categories/jackets" },
    { "@type": "ListItem", "position": 3, "name": "Kantha Kimono Jacket",
      "item": "https://kvastram.com/products/kantha-kimono-jacket" }
  ]
}
```

**CollectionPage (collection pages):**
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Festival Picks",
  "description": "Handcrafted pieces for the festive season",
  "url": "https://kvastram.com/collections/festival-picks"
}
```

### 11.3 Sitemap Rules

```xml
<!-- sitemap.xml structure -->
<urlset>
  <!-- Static pages -->
  <url><loc>https://kvastram.com/</loc></url>
  <url><loc>https://kvastram.com/about</loc></url>

  <!-- Categories: ONLY active leaf categories -->
  <url><loc>https://kvastram.com/categories/jackets</loc>
       <changefreq>weekly</changefreq></url>

  <!-- Collections: ONLY active collections (not draft/archived) -->
  <url><loc>https://kvastram.com/collections/festival-picks</loc>
       <changefreq>weekly</changefreq></url>

  <!-- Products: ONLY active products -->
  <url><loc>https://kvastram.com/products/kantha-kimono-jacket</loc>
       <changefreq>monthly</changefreq>
       <lastmod>2026-04-15</lastmod></url>
</urlset>
```

**RULE SEO-SITEMAP:** Draft, archived categories/collections/products sitemap mein nahi aayengi.
**RULE SEO-ROBOTS:** `/admin/*` and `/api/*` robots.txt mein disallow.

### 11.4 Redirect Rules

```
301 Permanent Redirects (set in redirect table, applied at edge/middleware):
/collections/kantha-quilts   → /collections/kantha-essentials
/collections/shawls          → /categories/scarves-wraps
/collections/kurtis          → /categories/suits-kurtas
/collections/accessories     → /categories/accessories

When a slug changes:
old_slug → new_slug (admin panel mein redirect auto-create)
```

---

## 12. Filter & Search Rules

### 12.1 Faceted Filter System

```
/products page aur /categories/* page pe filters:

Available Filters:
├── Category (on /products page only — not on /categories page)
│   Checkboxes: [Jackets] [Sarees] [Suits] [Lehengas] [Bags] ...
├── Price Range
│   Slider: ₹0 ———●———— ₹20,000
│   OR presets: Under ₹1,000 | ₹1,000–5,000 | ₹5,000+
├── Size (if applicable)
│   Checkboxes: [XS] [S] [M] [L] [XL] [XXL] [One Size]
└── Availability
│   Toggle: [In Stock Only]

URL state (no tag_id — named params only):
/products?category=jackets&price_max=5000&size=xl&in_stock=true
/products?category=jackets&category=sarees  (multiple category filter)

Filter + Sort kombinaton:
/categories/bags?sort=price_asc&price_max=2000&in_stock=true
```

### 12.2 Search Results Rules

```
Search results page (/search?q=kantha):

Result Card:
├── Product image
├── Product name (matched term highlighted)
├── Category label    ← MUST match actual product category (not "Bags" for a jacket)
├── Price / "Enquire for price"
└── Quick Add button

"Did you mean?" suggestions for typos.

Empty state:
"No results for 'kantha jacket' — try browsing Jackets or New Arrivals"
+ category suggestion tiles

Category label in search results = product.category.display_name
(Currently broken — Jackets showing "Bags" — fix in product data)
```

---

## 13. Data Validation & Quality Gates

### 13.1 Pre-Publish Checklist

```
Category → Active gate:
□ name: trimmed, unique in parent scope, 3-100 chars
□ slug: URL-safe format, globally unique, not changed if products exist
□ image: uploaded, min 800×1000px
□ parent_id: null OR points to Level 1 category
□ At least 1 active product (soft check — warn only, not hard block)

Collection → Active gate:
□ name: trimmed, globally unique (case-insensitive), 3-150 chars
□ slug: URL-safe, unique
□ cover_image: uploaded, min 1200×800px
□ products: min 3 ACTIVE products assigned
□ type: one of allowed values
□ All assigned products: active status, valid names, price set

Product → Active gate:
□ name: Title Case, 10-80 chars, no test patterns
□ category_id: set, valid leaf category
□ price_type: 'fixed' with price > 0 OR 'on_request' with price = null
□ images: min 2 uploaded
□ description_story: min 50 chars, no placeholder text
□ description_details: Fabric, Dimensions fields present
□ description_care: min 20 chars
□ status: 'draft' → 'active' only after all above pass
```

### 13.2 Build-Time Validation (CI/CD)

```typescript
// Run before every production deployment

async function validateProductionData() {
  const errors: string[] = [];

  // G-01: No products with null category
  const orphanProducts = await db.query(
    `SELECT id, name FROM products WHERE category_id IS NULL AND status = 'active'`
  );
  orphanProducts.forEach(p =>
    errors.push(`ORPHAN PRODUCT: "${p.name}" has no category`)
  );

  // G-02: No active collections with <3 active products
  const thinCollections = await db.query(`
    SELECT c.name, COUNT(p.id) as count
    FROM collections c
    LEFT JOIN product_collections pc ON pc.collection_id = c.id
    LEFT JOIN products p ON p.id = pc.product_id AND p.status = 'active'
    WHERE c.status = 'active'
    GROUP BY c.id, c.name
    HAVING COUNT(p.id) < 3
  `);
  thinCollections.forEach(c =>
    errors.push(`THIN COLLECTION: "${c.name}" is active but has only ${c.count} products`)
  );

  // G-03: No duplicate collection names
  const dupeCollections = await db.query(`
    SELECT lower(name) as name_lower, COUNT(*) as cnt
    FROM collections GROUP BY lower(name) HAVING COUNT(*) > 1
  `);
  dupeCollections.forEach(c =>
    errors.push(`DUPLICATE COLLECTION NAME: "${c.name_lower}"`)
  );

  // G-04: No broken nav/footer links
  const navLinks = await getNavAndFooterLinks(); // from CMS
  for (const link of navLinks) {
    if (link.href.startsWith('/collections/')) {
      const slug = link.href.replace('/collections/', '');
      const exists = await db.query(
        `SELECT 1 FROM collections WHERE slug = $1 AND status = 'active'`, [slug]
      );
      if (!exists.length)
        errors.push(`BROKEN NAV LINK: ${link.href} does not exist or is not active`);
    }
  }

  // G-05: No test products in active status
  const testPattern = /^[a-z]{1,6}$|jjj|kkk|hhh|njk|hhjk|test|sample|dummy/i;
  const activeProducts = await db.query(`SELECT name FROM products WHERE status = 'active'`);
  activeProducts.filter(p => testPattern.test(p.name)).forEach(p =>
    errors.push(`TEST PRODUCT IN PRODUCTION: "${p.name}"`)
  );

  // G-06: No on_request products with price set
  const brokenPrice = await db.query(`
    SELECT name FROM products WHERE price_type = 'on_request' AND price IS NOT NULL
  `);
  brokenPrice.forEach(p =>
    errors.push(`PRICE CONFLICT: "${p.name}" is on_request but has price set`)
  );

  if (errors.length > 0) {
    console.error('VALIDATION FAILED:\n' + errors.join('\n'));
    process.exit(1); // Block deployment
  }
  console.log('All validation checks passed.');
}
```

### 13.3 Image Specs Quick Reference

| Context | Width | Height | Aspect | Format | Max Size |
|---|---|---|---|---|---|
| Category homepage tile | 800 | 1000 | Portrait 4:5 | webp | 200KB |
| Collection cover | 1200 | 800 | Landscape 3:2 | webp | 300KB |
| Product front/detail | 800 | 1000 | Portrait 4:5 | webp | 300KB |
| Product card thumbnail | 600 | 750 | Portrait 4:5 | webp (Cloudinary transform) | — |
| OG / Social share | 1200 | 630 | Landscape 1.91:1 | jpg/webp (Cloudinary crop) | 300KB |
| Mega menu category icon | 120 | 120 | Square 1:1 | webp | 30KB |

---

## 14. Kvastram-Specific Taxonomy

### 14.1 Recommended Collections to Create (Priority Order)

```
Priority 1 — Create Immediately (products already exist):
├── "Kantha Essentials"        type: fabric    slug: kantha-essentials
├── "Festival Ready"           type: occasion  slug: festival-ready
└── "Gifts Under ₹2,000"       type: price     slug: gifts-under-2000

Priority 2 — Create This Month:
├── "Block Print Edit"         type: fabric    slug: block-print-edit
├── "For the Home"             type: style     slug: for-the-home
└── "New Arrivals"             type: seasonal  slug: new-arrivals (AUTO rule: last 30 days)

Priority 3 — When Stock Ready:
├── "Bridal Picks"             type: occasion  slug: bridal-picks
├── "Everyday Carry"           type: style     slug: everyday-carry
└── "Gifts Under $75"          type: price     slug: gifts-under-75 (USD audience)
```

### 14.2 Homepage Section → Collection Type Mapping

```
Homepage Section             Collection Type(s) Shown
"Shop by Occasion"      ←    type: occasion
"Seasonal Edits"        ←    type: seasonal (show_in_homepage_section = 'seasonal')
"Shop by Fabric"        ←    type: fabric
"Curated Collections"   ←    type: style OR gift
"Reels that Sell"       ←    Reels (separate system, not collections)
"Sale"                  ←    type: price, collections with slug containing 'sale'
```

### 14.3 Current Products — Correct Data

| Current Name (Broken) | Correct Name | Correct Category | Price Type |
|---|---|---|---|
| Kantha Quilted Short Kimono Yellow Floral Jacket Cotton Quilted Handmade Coat Gift For Her | Kantha Quilted Kimono Jacket | `jackets` | on_request |
| Velvet Embroidery Jacket Handmade Short Jacket Gift for Him | Velvet Embroidered Short Jacket | `jackets` | on_request |
| Best tshirt | Kantha Block Print Cotton T-Shirt | `t-shirts` | fixed |
| tote bags | Kantha Print Tote Bag | `tote-bags` | fixed |
| Rajasthani Block Print Quilted Toiletry Bag Set of 3... | Rajasthani Block Print Toiletry Bag Set | `toiletry-bags` | fixed |
| Jjjn | DELETE — test product | — | — |
| Njkkkk | DELETE — test product | — | — |
| hhjkkj | DELETE — test product | — | — |

---

## 15. Cleanup Required

### 15.1 Delete These Collections

```
Immediate deletion required:
1. "Bags " (trailing space)   — broken slug, 0 products
2. "Bags-" (trailing dash)   — broken slug, 0 products
3. "Tote bags" (0 products)  — rename "Tote Bags Edit" and add products, OR delete
4. "Vintage jacket " (space) — rename cleanly or delete
5. "Wedding anniversary dress " — rename "Anniversary Looks" or archive
```

### 15.2 Fix These Products

```
1. Delete: "Jjjn", "Njkkkk", "hhjkkj" (test products)
2. Rename + fix category: "Best tshirt" → proper name + t-shirts category
3. Rename: "tote bags" → "Kantha Print Tote Bag" (check if duplicate of existing)
4. Fix: Any jacket showing "Bags" as category label
5. Fix: All products with price_type=on_request showing "Add to Bag" button
6. Fix: Product descriptions containing "handmade handmade" or "default variant"
```

### 15.3 Fix Footer/Nav Links

```
All broken footer links either:
a) Create the collection at that slug, OR
b) Replace link with correct existing URL

Broken → Fix:
/collections/kantha-quilts   → /collections/kantha-essentials (after creating)
/collections/block-print     → /collections/block-print-edit (after creating)
/collections/dupattas-stoles → /categories/scarves-wraps
/collections/gifts           → /collections/gifts-under-2000 (after creating)
/collections/shawls          → /categories/scarves-wraps
/collections/kurtis          → /categories/suits-kurtas
/collections/accessories     → /categories/accessories
```

---

## 16. Do's and Don'ts Summary

| DO ✅ | DON'T ❌ |
|---|---|
| Ek product = ek leaf category | Ek product = 2 categories |
| Category = product type (permanent) | Category = occasion/season |
| Collection = curated edit (flexible) | Collection = product type |
| Collection mein ≥3 active products then live | 0-product collection live karna |
| Clean Title Case name | Test names: "Jjjn", lowercase "best tshirt" |
| price_type='on_request' → WhatsApp CTA only | on_request product pe "Add to Bag" button |
| Slug: `kantha-jackets` | Slug: `Kantha Jackets`, `kantha jackets ` |
| Canonical: always /products/{slug} | Same product at multiple canonical URLs |
| Footer link → existing active collection | Footer link → 404 page |
| JSON-LD structured data on every page | No schema markup |
| Breadcrumb: Home > Category > Product | Breadcrumb: Home > Product (category missing) |
| Admin validates before publish | Save karo aur chhod do |
| Only active items in sitemap | Drafts/archived in sitemap |
| Subcategory max 2 levels deep | 3+ level nested categories |
| Slug locked after first product assigned | Slug change without 301 redirect |
| Description: 5 structured blocks | Free-form auto-generated text |

---

*Version 2.0 — All 22 gaps from audit addressed*
*For: kvastram.com | Use with: Claude Code | Updated: May 2026*
