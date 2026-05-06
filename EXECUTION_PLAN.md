# Kvastram — Complete System Execution Plan
## Based on: KVASTRAM_COMPLETE_GUIDE_V2.md + Full Codebase Audit

> **Status:** PLAN ONLY — Koi bhi execution abhi nahi hui  
> **Created:** May 2026  
> **Guide Reference:** KVASTRAM_COMPLETE_GUIDE_V2.md  
> **Audit Findings:** Neeche har phase mein "Current State" section mein likha hai

---

## AUDIT SUMMARY (Existing System Ki Reality)

### Jo HAI (Working):
- ✅ Categories table (id, name, slug, parent_id, is_active, display_order, show_in_header)
- ✅ Product-Categories junction table (product_categories) with CASCADE delete
- ✅ product_collections table (collections) — lekin sirf basic fields hain
- ✅ Products table — basic fields hain, price/variants alag table mein
- ✅ Full CRUD API routes — categories, collections, products
- ✅ Bulk product operations (bulk-create, bulk-update, bulk-delete)
- ✅ Admin dashboard (`/admin/` — separate Next.js app) — 49 pages
- ✅ Storefront product page with JSON-LD structured data
- ✅ Mega menu with categories
- ✅ 5-tab bottom navigation (Home, Shop, Reels, Wishlist, Account)
- ✅ Sitemap generation (sitemap.ts)
- ✅ robots.txt (blocks /admin, /api, /cart etc.)
- ✅ JWT auth + admin route protection

### Jo NAHI HAI (Missing — Ye plan execute karega):
- ❌ `product_collections` (collections) table mein: `type`, `status`, `rule_type`, `display_order`, `show_in_megamenu`, `homepage_section`, `valid_from`, `valid_until`, `seo_title`, `seo_desc`, `og_image_url` fields
- ❌ `products` table mein: `price_type` ('fixed'|'on_request') field
- ❌ `categories` table mein: `seo_title`, `seo_desc`, `og_image_url` fields
- ❌ `admin_audit_log` table
- ❌ `redirects` table
- ❌ Collections ke liye auto-draft DB trigger (abhi code mein hai, DB mein nahi)
- ❌ ProductView mein `price_type=on_request` handling (WhatsApp CTA, hide Add to Bag)
- ❌ Proper `/categories/[slug]` page (sirf permanentRedirect hai collections pe)
- ❌ Collection page mein "Related Collections" section
- ❌ Footer links dynamic nahi hain (hardcoded — broken links hain)
- ❌ Build-time data validation script
- ❌ Admin mein granular roles (editor vs super_admin vs viewer)
- ❌ Redirect management routes/UI
- ❌ Collection type/status fields admin form mein

### Data Quality Issues (Guide Section 14.3 aur 15):
- 🔴 Test products exist: "Jjjn", "Njkkkk", "hhjkkj" — DELETE karne hain
- 🔴 Broken product names: "Best tshirt", "tote bags" — Fix karne hain
- 🔴 Broken collections: "Bags " (trailing space), "Bags-" — Delete karne hain
- 🔴 Footer mein hardcoded broken links (7 links 404 dete hain)
- 🟡 Products mein category label mismatch possible (jacket showing "Bags")

---

## PHASE OVERVIEW

```
PHASE 1 — Data Cleanup          [NO CODE — Admin panel se karo]         ~1 day
PHASE 2 — Database Migrations   [Backend schema changes]                 ~1 day
PHASE 3 — Backend API Updates   [Routes + validation]                    ~2 days
PHASE 4 — Admin Panel Updates   [Form fields + new pages]                ~2 days
PHASE 5 — Storefront Fixes      [ProductView, pages, components]         ~2 days
PHASE 6 — SEO & Validation      [Build checks, sitemap, redirects]       ~1 day
PHASE 7 — Master Data Setup     [Categories + collections create]        ~1 day

TOTAL ESTIMATED TIME: ~10 days
```

---

## PHASE 1 — DATA CLEANUP (Admin Panel Se)
### Pre-condition: Phase 1 pehle execute karo — code changes ke baad data messy ho sakta hai

### TASK 1.1 — Test Products Delete Karo
**Kya karna hai:** Guide Section 15.2 ke according ye products delete karo:
- "Jjjn" — test product
- "Njkkkk" — test product
- "hhjkkj" — test product

**Kaise:** Admin panel → Products → filter by name → delete each
**Verify:** Products list mein koi bhi `^[a-z]{1,5}$` pattern wala naam nahi hona chahiye

---

### TASK 1.2 — Broken Product Names Fix Karo
**Kya karna hai:** Guide Section 14.3 ke according rename + category fix:

| Current Name | Correct Name | Correct Category |
|---|---|---|
| Best tshirt | Kantha Block Print Cotton T-Shirt | t-shirts |
| tote bags | Kantha Print Tote Bag | tote-bags |
| Kantha Quilted Short Kimono Yellow Floral... (too long) | Kantha Quilted Kimono Jacket | jackets |
| Velvet Embroidery Jacket Handmade Short... | Velvet Embroidered Short Jacket | jackets |

**Kaise:** Admin panel → Products → edit each
**Verify:** Name Title Case hai, length 10-80 chars, category correct leaf category hai

---

### TASK 1.3 — Broken Collections Delete/Fix Karo
**Kya karna hai:** Guide Section 15.1 ke according:
- Delete: "Bags " (trailing space)
- Delete: "Bags-" (trailing dash)
- Delete OR fix: "Tote bags" (0 products — rename "Tote Bags Edit" ya delete)
- Delete OR fix: "Vintage jacket " (trailing space)
- Delete OR fix: "Wedding anniversary dress " (trailing space)

**Kaise:** Admin panel → Collections → filter "With 0 Products" → delete/fix each
**Verify:** Koi bhi collection name mein leading/trailing space nahi

---

### TASK 1.4 — Existing Category-Product Assignments Verify Karo
**Kya karna hai:** Check karo ki koi jacket "Bags" category mein toh nahi
**Kaise:** Admin panel → Products → filter by category "Bags" → verify no clothing items
**Verify:** Har product ka category label match karta ho product type se

---

## PHASE 2 — DATABASE MIGRATIONS
### Pre-condition: Phase 1 complete hona chahiye

### TASK 2.1 — Collections Table Upgrade (Migration)
**File:** `backend/drizzle/0030_collections_v2_upgrade.sql`

**Current State:** `product_collections` table mein sirf: `id, title, handle, image, metadata, created_at, updated_at, deleted_at`

**Kya add karna hai:**
```sql
-- Ye migration likho:
ALTER TABLE product_collections
  ADD COLUMN IF NOT EXISTS type VARCHAR(20) 
    CHECK (type IN ('occasion','seasonal','price','fabric','gift','style')),
  ADD COLUMN IF NOT EXISTS rule_type VARCHAR(10) DEFAULT 'manual' 
    CHECK (rule_type IN ('manual','auto')),
  ADD COLUMN IF NOT EXISTS rule_definition JSONB,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,          -- rename image → cover_image_url
  ADD COLUMN IF NOT EXISTS status VARCHAR(10) DEFAULT 'draft' 
    CHECK (status IN ('draft','active','archived')),
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_in_megamenu BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS homepage_section VARCHAR(50),
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seo_title VARCHAR(200),
  ADD COLUMN IF NOT EXISTS seo_desc VARCHAR(300),
  ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Existing image field ko cover_image_url mein migrate karo:
UPDATE product_collections SET cover_image_url = image WHERE cover_image_url IS NULL AND image IS NOT NULL;

-- Status existing collections: agar handle hai toh active
UPDATE product_collections SET status = 'active' WHERE status = 'draft' AND handle IS NOT NULL;

-- Indexes:
CREATE INDEX IF NOT EXISTS idx_collections_status ON product_collections(status);
CREATE INDEX IF NOT EXISTS idx_collections_type ON product_collections(type);
CREATE INDEX IF NOT EXISTS idx_collections_display_order ON product_collections(display_order);
```

**Drizzle schema update:** `backend/src/db/schema.ts` mein `product_collections` table update karo naye fields ke saath.

**Verify:** `SELECT column_name FROM information_schema.columns WHERE table_name = 'product_collections'` — sab naye columns dikhne chahiye

---

### TASK 2.2 — Collections Products Junction Table Audit + Position Field
**File:** `backend/drizzle/0031_collection_products_junction.sql`

**Current State:** Confirm karo ki collection-products junction table exist karta hai. Agar nahi toh banao.

**Expected junction structure (guide Section 5.4):**
```sql
-- Pehle check karo:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'collection_products';

-- Agar nahi hai toh banao:
CREATE TABLE IF NOT EXISTS collection_products (
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES product_collections(id) ON DELETE CASCADE,
  position      INTEGER DEFAULT 0,
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (product_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_cp_collection ON collection_products(collection_id, position);
CREATE INDEX IF NOT EXISTS idx_cp_product ON collection_products(product_id);
```

**Agar already hai** toh sirf `position` field add karo agar missing hai.

---

### TASK 2.3 — Collections Auto-Draft DB Trigger
**File:** `backend/drizzle/0032_collection_auto_draft_trigger.sql`

**Current State:** Auto-draft logic sirf backend code mein hai — fragile.

**Kya banano:**
```sql
-- Guide Section 5.4 trigger exactly:
CREATE OR REPLACE FUNCTION check_collection_product_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE product_collections
  SET status = 'draft'
  WHERE id = OLD.collection_id
    AND status = 'active'
    AND (
      SELECT COUNT(*) 
      FROM collection_products cp
      JOIN products p ON p.id = cp.product_id
      WHERE cp.collection_id = OLD.collection_id
        AND p.status = 'published'
    ) < 3;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_collection_count_check
AFTER DELETE ON collection_products
FOR EACH ROW EXECUTE FUNCTION check_collection_product_count();
```

> **Note:** `published` use karo `active` ki jagah — current products schema mein status = 'published' hai draft/published/proposed/rejected

---

### TASK 2.4 — Products price_type Field Add Karo
**File:** `backend/drizzle/0033_products_price_type.sql`

**Current State:** Products table mein `price_type` field nahi hai. `is_wholesale_only` boolean hai but `on_request` pricing concept nahi hai.

```sql
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS price_type VARCHAR(15) DEFAULT 'fixed'
    CHECK (price_type IN ('fixed', 'on_request'));

-- Sab existing products ke liye default fixed
UPDATE products SET price_type = 'fixed' WHERE price_type IS NULL;

-- Index:
CREATE INDEX IF NOT EXISTS idx_products_price_type ON products(price_type);
```

**Drizzle schema update:** `backend/src/db/schema.ts` mein `products` table mein `price_type` field add karo.

---

### TASK 2.5 — Categories SEO Fields Add Karo
**File:** `backend/drizzle/0034_categories_seo.sql`

**Current State:** Categories table mein SEO fields nahi hain.

```sql
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS seo_title VARCHAR(200),
  ADD COLUMN IF NOT EXISTS seo_desc VARCHAR(300),
  ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Category page meta title auto-generate format (se populate karo via code):
-- "{name} — Handmade Indian Fashion | Kvastram"
```

---

### TASK 2.6 — Admin Audit Log Table Banao
**File:** `backend/drizzle/0035_admin_audit_log.sql`

**Current State:** Koi bhi admin action log nahi hota.

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
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON admin_audit_log(user_id);
CREATE INDEX idx_audit_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON admin_audit_log(created_at DESC);
```

**Log events (guide Section 7.3):**
- category.create, category.update, category.delete
- collection.create, collection.status_change, collection.delete
- product.create, product.category_change, product.delete, product.status_change
- nav.update, role.change

---

### TASK 2.7 — Redirects Table Banao
**File:** `backend/drizzle/0036_redirects.sql`

**Current State:** Koi redirect management nahi hai — broken footer links manually fix karne padte hain.

```sql
CREATE TABLE redirects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path  TEXT NOT NULL UNIQUE,
  to_path    TEXT NOT NULL,
  status     INTEGER DEFAULT 301 CHECK (status IN (301, 302)),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_redirects_from ON redirects(from_path);

-- Seed: Footer ke broken links ke liye initial redirects (guide Section 15.3):
INSERT INTO redirects (from_path, to_path) VALUES
  ('/collections/kantha-quilts',   '/collections/kantha-essentials'),
  ('/collections/block-print',     '/collections/block-print-edit'),
  ('/collections/dupattas-stoles', '/categories/scarves-wraps'),
  ('/collections/gifts',           '/collections/gifts-under-2000'),
  ('/collections/shawls',          '/categories/scarves-wraps'),
  ('/collections/kurtis',          '/categories/suits-kurtas'),
  ('/collections/accessories',     '/categories/accessories')
ON CONFLICT (from_path) DO NOTHING;
```

---

## PHASE 3 — BACKEND API UPDATES
### Pre-condition: Phase 2 migrations run ho jaayein

### TASK 3.1 — Collections Route Update (New Fields)
**File:** `backend/src/routes/collections.ts`

**Current State:** Collections CRUD works but new fields (type, status, rule_type, valid_from, valid_until, show_in_megamenu etc.) nahi handle hote.

**Kya update karna hai:**
1. **GET /collections** — `status` filter add karo (default: `active` for public, `all` for admin)
2. **POST /collections** — naye fields validate + save karo (Zod schema update)
3. **PUT /collections/:id** — naye fields update
4. **Status validation** — Active status sirf set ho agar min 3 active products + cover_image_url hai
5. **Auto-archive** — valid_until < NOW() wali collections auto-archive logic
6. Response mein `product_count` return karo har collection ke saath

**Zod schema changes (`backend/src/utils/validation.ts`):**
```typescript
// collectionsCreateSchema update:
{
  title: z.string().min(3).max(150).trim(),
  handle: z.string().optional(), // auto-generate se
  type: z.enum(['occasion','seasonal','price','fabric','gift','style']),
  rule_type: z.enum(['manual','auto']).default('manual'),
  rule_definition: z.record(z.any()).optional(),
  description: z.string().optional(),
  cover_image_url: z.string().url().optional(),
  status: z.enum(['draft','active','archived']).default('draft'),
  display_order: z.number().int().default(0),
  show_in_megamenu: z.boolean().default(false),
  homepage_section: z.string().optional(),
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().optional(),
  seo_title: z.string().max(200).optional(),
  seo_desc: z.string().max(300).optional(),
}
```

---

### TASK 3.2 — Products Route: price_type Support
**File:** `backend/src/routes/products.ts`

**Current State:** price_type field nahi hai — sab products fixed price treat hote hain.

**Kya update karna hai:**
1. `POST /products` aur `PUT /products/:id` mein `price_type` accept karo
2. Validation: agar `price_type = 'on_request'` toh price null hona chahiye
3. Validation: agar `price_type = 'fixed'` toh price required hai (> 0)
4. `GET /products` response mein `price_type` field return karo

**Validation rule (guide Section 4.3):**
```typescript
// Zod refinement:
.refine(data => {
  if (data.price_type === 'fixed') return data.price != null && data.price > 0;
  if (data.price_type === 'on_request') return data.price == null;
  return true;
}, { message: "price_type=fixed requires price, on_request requires no price" })
```

---

### TASK 3.3 — Admin Audit Log Middleware
**File:** `backend/src/middleware/audit.ts` (naya file)

**Current State:** Koi audit trail nahi hai.

**Kya banano:**
```typescript
// Middleware: har admin mutating action ke baad log karo
export function auditLog(entityType: string, action: string) {
  return async (c: Context, next: Next) => {
    // before: old value fetch karo (agar update/delete hai)
    await next();
    // after: log insert karo
    // Insert into admin_audit_log: user_id, action, entity_type, entity_id, old_value, new_value, ip
  };
}
```

**Wahan use karo:**
- `POST /categories` → `auditLog('category', 'create')`
- `DELETE /categories/:id` → `auditLog('category', 'delete')`
- `PUT /collections/:id` (status change) → `auditLog('collection', 'status_change')`
- `DELETE /products/:id` → `auditLog('product', 'delete')`
- etc.

---

### TASK 3.4 — Redirects API Routes
**File:** `backend/src/routes/redirects.ts` (naya file)

**Current State:** Koi redirect management nahi.

**Kya banano:**
```
GET    /redirects          — list all (admin only)
POST   /redirects          — create redirect (admin only)
DELETE /redirects/:id      — delete redirect (admin only)
GET    /redirects/lookup?path=/collections/kantha-quilts  — public, storefront middleware use karega
```

**Storefront middleware (`storefront/src/middleware.ts`) update karo:**
- Request aate waqt `GET /redirects/lookup?path={pathname}` call karo
- Agar match mila → NextResponse.redirect() karo correct URL pe

---

### TASK 3.5 — Build-Time Validation Script
**File:** `backend/src/scripts/validate-production-data.ts` (naya file)

**Current State:** Koi pre-deploy validation nahi hai.

**Kya banano:** Guide Section 13.2 ka poora script implement karo:
- G-01: No active products without category
- G-02: No active collections with < 3 active products
- G-03: No duplicate collection names (case-insensitive)
- G-04: No broken nav/footer links (check against redirects + active collections)
- G-05: No test products in active status (pattern: `jjj|kkk|test|sample|dummy`)
- G-06: No on_request products with price set

**`package.json` script:**
```json
"validate:prod": "tsx src/scripts/validate-production-data.ts"
```

**CI/CD:** Pre-deploy step mein add karo — agar validation fail toh deploy block.

---

### TASK 3.6 — Categories Route: SEO Fields + Slug Lock Logic
**File:** `backend/src/routes/categories.ts`

**Current State:** SEO fields nahi hain, slug lock logic missing.

**Kya update karna hai:**
1. `POST /categories` mein `seo_title`, `seo_desc`, `og_image_url` accept karo
2. `PUT /categories/:id` mein slug change block karo agar products assigned hain — sirf super_admin bypass kar sake
3. `GET /categories` response mein `seo_title`, `seo_desc` return karo
4. Auto-generate meta title format: `"{name} — Handmade Indian Fashion | Kvastram"`

---

## PHASE 4 — ADMIN PANEL UPDATES
### Pre-condition: Phase 2 + Phase 3 complete hona chahiye

### TASK 4.1 — Collections Form: New Fields Add Karo
**Directory:** `admin/src/app/dashboard/collections/`

**Current State:** Collections form mein sirf basic fields hain (title, handle, image).

**Kya add karna hai in form:**
1. **Type dropdown** — `occasion | seasonal | price | fabric | gift | style` (required)
2. **Status toggle** — `draft / active / archived` (with validation message: "3+ products + cover image required for Active")
3. **Rule Type toggle** — Manual / Auto (agar Auto: rule builder show karo — field + operator + value)
4. **Valid From / Valid Until** — date picker (optional)
5. **Show in Mega Menu** — toggle
6. **Homepage Section** — dropdown (Shop by Occasion / Seasonal Edits / Shop by Fabric / Curated Collections)
7. **Display Order** — number input
8. **SEO fields tab** — Meta Title, Meta Description, OG Image
9. **Products tab** — Product count badge, "min 3 required for Active" warning

**Status validation UI:**
```
🟡 Draft: "Add 3+ products and cover image to publish"
🟢 Active: "Live — visible to customers"
⚫ Archived: "Hidden — data preserved"
```

---

### TASK 4.2 — Products Form: price_type Field
**Directory:** `admin/src/app/dashboard/products/`

**Current State:** Products form mein price field hai but `price_type` selector nahi.

**Kya add karna hai:**
1. **Price Type radio/toggle:**
   - "Fixed Price" → price field show hoga (required)
   - "On Request (WhatsApp)" → price field hide hoga, info message: "Customer will see WhatsApp enquiry button"
2. **Conditional price field** — price_type ke according show/hide
3. **Warning banner** — agar current product mein price set hai aur on_request select karo: "Saving will remove the price"

---

### TASK 4.3 — Categories Form: SEO Fields + Slug Lock Warning
**Directory:** `admin/src/app/dashboard/categories/`

**Current State:** Categories form basic hai — SEO fields nahi, slug lock warning nahi.

**Kya add karna hai:**
1. **SEO tab** — Meta Title (auto-populate format), Meta Description, OG Image upload
2. **Slug field** — agar products assigned hain: readonly + yellow warning "Slug locked — products are using this URL. Only super_admin can change."
3. **Category depth validation** — Parent dropdown sirf Level 1 categories dikhaye (no grandchildren)
4. **Products count badge** — "12 active / 15 total products" on edit page header

---

### TASK 4.4 — Admin Audit Log Page
**Directory:** `admin/src/app/dashboard/settings/audit-log/` (naya page)

**Current State:** Koi audit trail view nahi hai.

**Kya banano:**
- Table: Date/Time | User | Action | Entity Type | Entity | Changes
- Filters: by user, by entity_type, by date range
- Pagination
- Read-only (no edit/delete on logs)

---

### TASK 4.5 — Redirects Management Page
**Directory:** `admin/src/app/dashboard/settings/redirects/` (naya page)

**Current State:** Redirects manage karne ka koi UI nahi.

**Kya banano:**
- Table: From Path | To Path | Type (301/302) | Created By | Created At
- Add redirect form
- Delete redirect button
- Bulk import (CSV)

---

### TASK 4.6 — Admin Roles: Editor/Viewer Implementation
**File:** `backend/src/middleware/auth.ts` + `backend/src/db/schema.ts`

**Current State:** `users.role = 'admin'` — sab admin users ko full access hai. Guide mein 3 roles hain.

**Kya update karna hai (guide Section 7.1-7.2):**
1. `users.role` field mein add karo: `'super_admin' | 'editor' | 'viewer'`
2. `verifyAdmin` middleware ko role-aware banao
3. Specific blocks implement karo:
   - `editor`: category slug change block, collection delete block, product delete block
   - `viewer`: sirf GET routes allow

**Migration:** `backend/drizzle/0037_user_roles.sql`
```sql
-- Existing admin users ko super_admin banao:
UPDATE users SET role = 'super_admin' WHERE role = 'admin';
ALTER TABLE users ADD CONSTRAINT role_check 
  CHECK (role IN ('super_admin', 'editor', 'viewer', 'admin'));
```

---

## PHASE 5 — STOREFRONT FIXES
### Pre-condition: Phase 3 complete (API ready hona chahiye)

### TASK 5.1 — ProductView: price_type=on_request Handling (CRITICAL)
**File:** `storefront/src/components/product/ProductView.tsx`

**Current State:** WhatsApp button exist karta hai (`pdp-whatsapp` class) but `price_type` check nahi hai — dono buttons (Add to Bag + WhatsApp) show ho sakte hain.

**Kya fix karna hai (guide Rule P-5):**
```tsx
// product.price_type check karo:
{product.price_type === 'on_request' ? (
  // Show ONLY WhatsApp CTA:
  <a
    href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi, I'm interested in: ${displayTitle}`}
    className="btn btn-whatsapp"
    target="_blank"
    rel="noopener noreferrer"
  >
    Enquire on WhatsApp
  </a>
) : (
  // Show ONLY Add to Cart:
  <button id="pdp-atc-btn" onClick={handleAddToCart}>
    Add to Bag
  </button>
)}

// Price display:
{product.price_type === 'on_request' ? (
  <span className="pdp-enquire-label">Enquire for price</span>
) : (
  <span className="pd-price">{formattedPrice}</span>
)}
```

**Product card mein bhi fix karo (`ProductGrid.tsx`):**
- `price_type=on_request` card pe price ki jagah "Enquire for price" dikhao
- Quick Add button hide karo

---

### TASK 5.2 — Category Pages: Proper Page Instead of Redirect
**File:** `storefront/src/app/categories/[slug]/page.tsx`

**Current State:** `permanentRedirect('/collections/${slug}')` — categories aur collections ka alag URL structure nahi hai.

**Guide Section 10.1 ke according proper category page banao:**

```tsx
// /categories/[slug]/page.tsx — proper page:
// 1. API se category fetch karo (slug se)
// 2. Category ke products fetch karo
// 3. Subcategory pills show karo (agar parent category)
// 4. Filter + Sort bar
// 5. Product grid (4/3/2 col layout)
// 6. Empty state
// 7. JSON-LD: BreadcrumbList + CollectionPage schema
// 8. Metadata: "{Category Name} — Handmade Indian Fashion | Kvastram"
```

**Additional:** `/categories/[parent]/[child]/page.tsx` — subcategory page banao

> **Note:** Existing `/categories/[slug]` redirect temporarily keep karo (bade change — plan mein phased hai)

---

### TASK 5.3 — Breadcrumb Fix: Category Step Missing
**File:** `storefront/src/components/product/ProductView.tsx` (breadcrumb section)

**Current State:** Breadcrumb kaam karta hai lekin check karo: `Home > Category > Product` sahi hai ya nahi. Guide mein currently live bug: `Home > Product Name` (category step missing).

**Kya verify/fix karna hai:**
```tsx
// Correct format:
// Home > Jackets > Kantha Kimono Jacket
// NOT: Home > Kantha Quilted Short Kimono...

// Ensure getCategoryPath() returns non-null category
// Agar primaryCategory null hai — fallback: "Shop" link add karo
```

---

### TASK 5.4 — Footer Links: Dynamic + Fix Broken Links
**File:** `storefront/src/components/layout/Footer.tsx`

**Current State:** Footer links hardcoded hain — 7 broken links hain (guide Section 9.4).

**Two-step fix:**

**Step A (Quick fix — immediately):** Broken links replace karo correct URLs se:
```
/collections/kantha-quilts   → /collections/kantha-essentials  (Phase 7 mein create karunga)
/collections/block-print     → /collections/block-print-edit
/collections/dupattas-stoles → /categories/scarves-wraps
/collections/gifts           → /collections/gifts-under-2000
/collections/shawls          → /categories/scarves-wraps
/collections/kurtis          → /categories/suits-kurtas
/collections/accessories     → /categories/accessories
```

**Step B (Proper fix — optional):** Footer "Shop" links ko API-driven banao:
- Active collections ki list fetch karo
- Featured/homepage collections show karo dynamically
- Fallback: static links agar API fails

---

### TASK 5.5 — Collection Page: Related Collections Section
**File:** `storefront/src/app/collections/[handle]/page.tsx`

**Current State:** Related collections section nahi hai.

**Guide Section 10.2 ke according add karo:**
```tsx
// Page ke bottom mein:
// "Related Collections" — same type ki 2-3 other active collections
// API call: GET /collections?type={current.type}&limit=3&exclude={current.id}
// Show as horizontal scroll on mobile, grid on desktop
```

---

### TASK 5.6 — Filter URL Params Fix (tag_id → named params)
**File:** `storefront/src/components/products/FilterSidebar.tsx`

**Current State:** Filter mein `tag_id=202e7213...` jaise internal UUIDs URL mein jaate hain.

**Guide Section 12.1 Rule:**
```
/products?category=jackets&price_max=5000  ✅
/products?tag_id=202e7213-...              ❌ (internal only)
```

**Kya fix karna hai:**
- Category filter: `?category={slug}` use karo, `?category_id={uuid}` nahi
- Tag filter: `?tag={slug}` use karo
- Multiple: `?category=jackets&category=sarees` (array params)
- FilterSidebar URL read/write logic update karo

---

### TASK 5.7 — Collection Page Admin Preview Mode
**File:** `storefront/src/app/collections/[handle]/page.tsx`

**Current State:** Draft collections ke liye koi preview mechanism nahi.

**Guide Section 10.2:**
- Draft collections customer ko nahi dikhni chahiye (404 ya redirect)
- Admin preview: `?preview=true&token={admin_token}` — draft collection dikhao
- Implement: status === 'draft' aur no preview token → redirect to /collections

---

### TASK 5.8 — Canonical Tags Verify Karo
**File:** `storefront/src/app/products/[handle]/page.tsx`

**Current State:** JSON-LD exist karta hai. Canonical tag check karo.

**Guide Rule U-CANONICAL:**
```html
<!-- Har product page pe, regardless of how user reached: -->
<link rel="canonical" href="https://kvastram.com/products/{handle}" />
```

**Kya verify karna hai:**
- Next.js metadata mein `alternates.canonical` set hai
- Collection page se product pe jaao — canonical URL `/products/{handle}` hai, nahi `/collections/{coll}/products/{handle}`

---

## PHASE 6 — SEO & VALIDATION
### Pre-condition: Phase 3 + Phase 5 mostly complete

### TASK 6.1 — Sitemap Update: Only Active Items
**File:** `storefront/src/app/sitemap.ts`

**Current State:** Sitemap generate hota hai lekin draft/archived items filter nahi ho rahe sure se.

**Guide Rule SEO-SITEMAP ke according verify/fix:**
```typescript
// Categories: sirf is_active = true
// Collections: sirf status = 'active'
// Products: sirf status = 'published'
// Draft/archived: excluded

// Lastmod: product.updated_at use karo
// changeFrequency:
//   categories: 'weekly'
//   collections: 'weekly'  
//   products: 'monthly'
// Priority:
//   homepage: 1.0
//   categories: 0.8
//   products: 0.7
//   collections: 0.6
```

---

### TASK 6.2 — JSON-LD: Category Pages Add Karo
**File:** `storefront/src/app/categories/[slug]/page.tsx`

**Current State:** Product page pe JSON-LD hai. Category pages pe nahi (abhi redirect hai).

**Phase 5.2 ke saath implement karo:**
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Jackets — Handmade Kantha & Kimono Jackets",
  "description": "...",
  "url": "https://kvastram.com/categories/jackets"
}
// + BreadcrumbList
```

---

### TASK 6.3 — Redirects Middleware: Storefront
**File:** `storefront/src/middleware.ts`

**Current State:** Koi redirect middleware nahi hai.

**Kya banano:**
```typescript
// middleware.ts:
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Redirects table se lookup karo (cached):
  const redirect = await fetchRedirect(pathname);
  if (redirect) {
    return NextResponse.redirect(new URL(redirect.to_path, request.url), redirect.status);
  }
  
  return NextResponse.next();
}

// Cache: edge mein 5 min cache — bade traffic pe DB hit mat karo
```

---

### TASK 6.4 — Build Validation CI/CD Integration
**File:** `.github/workflows/deploy.yml` ya `package.json` scripts

**Current State:** Koi pre-deploy validation nahi.

**Kya add karna hai:**
```yaml
# In CI/CD pipeline, before deploy:
- name: Validate Production Data
  run: cd backend && npm run validate:prod
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Local development ke liye bhi:**
```json
// package.json:
"scripts": {
  "predeploy": "npm run validate:prod"
}
```

---

### TASK 6.5 — robots.txt Verify
**File:** `storefront/src/app/robots.ts`

**Current State:** robots.ts exist karta hai — verify karo sab blocked hain.

**Required blocks (guide Rule SEO-ROBOTS):**
```
Disallow: /admin
Disallow: /api
Disallow: /cart
Disallow: /checkout
Disallow: /account
Allow: /
```

Agar `/admin/` alag domain pe hai toh wahan bhi robots.txt add karo.

---

## PHASE 7 — MASTER DATA SETUP
### Pre-condition: Phases 1-6 complete, admin panel updated hai

### TASK 7.1 — Master Categories Create Karo (Guide Section 2.3)

**Admin panel → Categories mein exactly ye categories banao:**

```
Parent Categories (no products — grouping only):
- "Clothing"    slug: clothing    is_active: true
- "Bags & Totes" slug: bags      is_active: true

Clothing Children (assign existing products):
- "Jackets"         slug: jackets        parent: clothing
- "Sarees"          slug: sarees         parent: clothing
- "Suits & Kurtas"  slug: suits-kurtas   parent: clothing
- "Lehengas"        slug: lehengas       parent: clothing
- "T-Shirts & Tops" slug: t-shirts       parent: clothing

Bags Children:
- "Tote Bags"        slug: tote-bags      parent: bags
- "Toiletry Pouches" slug: toiletry-bags  parent: bags
- "Clutches"         slug: clutches       parent: bags

Flat Categories (no parent):
- "Home Textiles"   slug: home-textiles
- "Scarves & Wraps" slug: scarves-wraps
- "Accessories"     slug: accessories
```

**Har category ke liye:**
- Image upload karo (800×1000px portrait webp)
- Description add karo
- SEO title auto-fill karo (Phase 4.3 ke baad available)
- `show_in_header: true` set karo jahan required

---

### TASK 7.2 — Priority 1 Collections Create Karo (Guide Section 14.1)

**Admin panel → Collections mein banao:**

| Name | Slug | Type | Min Products |
|---|---|---|---|
| Kantha Essentials | kantha-essentials | fabric | 3+ |
| Festival Ready | festival-ready | occasion | 3+ |
| Gifts Under ₹2,000 | gifts-under-2000 | price | 3+ |

**Har collection ke liye:**
- Cover image upload (1200×800px landscape webp)
- Description add karo
- Products assign karo (min 3 active)
- Status: Active (3+ products confirm hone ke baad)
- Homepage Section assign karo

---

### TASK 7.3 — Priority 2 Collections Create Karo

| Name | Slug | Type | Rule |
|---|---|---|---|
| Block Print Edit | block-print-edit | fabric | manual |
| For the Home | for-the-home | style | manual |
| New Arrivals | new-arrivals | seasonal | AUTO: created_at > NOW() - 30 days |

> **Note:** "New Arrivals" collection `rule_type = 'auto'` hogi — Phase 3.1 mein auto-rule logic implement karna hai.

---

### TASK 7.4 — All Products ke Category Assignments Verify/Fix

**Checklist:**
```
□ Har product ki exactly ek leaf category assign ho
□ Koi bhi product parent category (clothing, bags) mein assign na ho
□ Category label on product card = product.category.display_name
□ Jackets category mein sirf jackets hain
□ Bags category children mein sirf bags/pouches/clutches hain
□ price_type=on_request: Kantha Kimono Jacket, Velvet Embroidered Short Jacket
□ price_type=fixed: tote bags, toiletry bags, t-shirts
```

---

### TASK 7.5 — Footer Links Final Fix + Verify
**File:** `storefront/src/components/layout/Footer.tsx`

Phase 7.2 mein naye collections create hone ke baad footer links update karo:
- `/collections/kantha-essentials` — created ✓
- `/collections/festival-ready` — created ✓
- `/collections/gifts-under-2000` — created ✓
- `/collections/block-print-edit` — created ✓

Remaining broken links ke liye Phase 2.7 ka redirects table use karo.

---

## CROSS-CUTTING CONCERNS (Har Phase Mein Dhyan Do)

### Testing Checklist (Har Task Ke Baad):
```
□ API response mein naya field return ho raha hai
□ Admin form mein naya field save/load ho raha hai
□ Storefront pe correct data display ho raha hai
□ Mobile pe bhi test karo (bottom nav, mega menu)
□ No 404s on any internal link
□ price_type=on_request product pe "Add to Bag" button kabhi nahi dikhta
□ Draft collections customers ko nahi dikhte
□ Breadcrumb: Home > Category > Product (category step missing nahi)
```

### Breaking Change Risks:
```
⚠️ TASK 2.1 (collections table migration): `image` column rename → `cover_image_url`
   Risk: Admin panel + storefront dono mein image references break ho sakti hain
   Mitigation: image column rakhke cover_image_url add karo, phir migrate, phir old drop
   
⚠️ TASK 5.2 (category page proper): Existing /categories/[slug] redirect hata doge
   Risk: External links ya SEO ranks affect ho sakti hain
   Mitigation: 301 redirect pehle set karo, phir proper page banao

⚠️ TASK 5.6 (filter URL params): tag_id → named params change
   Risk: Bookmarked/shared URLs break ho sakti hain
   Mitigation: Old params bhi support karo (backward compat) ek mahine ke liye
```

---

## EXECUTION ORDER (Recommended Sequence)

```
Week 1:
  Day 1: PHASE 1 (Data cleanup — admin panel)
  Day 2: PHASE 2 Tasks 2.1-2.4 (Core migrations)
  Day 3: PHASE 2 Tasks 2.5-2.7 + PHASE 3 Tasks 3.1-3.2

Week 2:
  Day 4: PHASE 3 Tasks 3.3-3.6 (Audit, redirects, validation)
  Day 5: PHASE 4 Tasks 4.1-4.3 (Admin form updates)
  Day 6: PHASE 4 Tasks 4.4-4.6 (Audit log, redirects UI, roles)

Week 3:
  Day 7: PHASE 5 Tasks 5.1-5.3 (Critical storefront fixes)
  Day 8: PHASE 5 Tasks 5.4-5.8 (Footer, collection page, etc.)
  Day 9: PHASE 6 (SEO + validation + CI/CD)

Week 4:
  Day 10: PHASE 7 (Master data setup via admin panel)
  Buffer: Testing + bug fixes
```

---

## PRIORITY TRIAGE (Agar Time Kam Ho)

### Must Do (Critical — Guide ke unbreakable rules):
1. **TASK 5.1** — price_type=on_request hiding Add to Bag (Rule P-5: "Abhi live store pe yeh broken hai")
2. **TASK 1.1** — Test products delete (production pe test data nahi hona chahiye)
3. **TASK 5.4 Step A** — Footer broken links fix (7 links 404 de rahe hain)
4. **TASK 2.1** — Collections type + status fields (Admin panel functionality ke liye)
5. **TASK 2.4** — price_type DB field (Task 5.1 ke liye required)

### Should Do (Important — System integrity):
6. TASK 2.3 — Auto-draft DB trigger
7. TASK 3.5 — Build-time validation
8. TASK 5.3 — Breadcrumb category step
9. TASK 4.1 — Collections form new fields
10. TASK 7.1 — Master categories create

### Nice to Have (Quality improvements):
11. TASK 2.6 — Admin audit log
12. TASK 2.7 — Redirects table
13. TASK 4.6 — Granular roles
14. TASK 5.5 — Related collections section
15. TASK 5.7 — Admin preview mode

---

*Plan Version: 1.0*  
*Based on: KVASTRAM_COMPLETE_GUIDE_V2.md*  
*Audit Date: May 2026*  
*Execute karne se pehle har task ka "Current State" section padho*
