# Kvastram Workflow Audit Report

Date: 2026-04-23
Scope: Admin to backend to storefront workflows for categories, collections, product listing, homepage/category banners, and hero slider behavior.

## Executive Summary

The reported behavior is real. The biggest issue is not one isolated API failure; it is a workflow design split:

- Admin has multiple similarly named content systems: `Categories`, `Collections`, `Homepage Categories`, `Category Circles`, `Hero Banners`, and `Homepage Banners`.
- Only `Categories` and `Collections` are product taxonomy data used by the product listing form.
- `Homepage Categories` and `Category Circles` are visual shortcut/card systems. They can appear on the storefront, but they do not become selectable product categories in product creation/editing.
- Hero banners are saved correctly, but the storefront homepage intentionally selects only the first active hero banner, so the slider never uses the rest.
- The banner system is duplicated/misnamed: "Homepage Banners" in admin is rendered as category page banners, not as the homepage hero.

In short: content is being saved, but different screens are reading different tables and endpoint contracts.

## Actual Desired Workflow

This is the intended product/homepage workflow based on the clarified requirement:

1. Homepage should have two separate category-driven sections:
   - Mobile/top circle categories.
   - `Shop by Category` section like `shopmulmul.com`, shown as a slider/carousel.
2. Both sections should be configured separately in admin.
   - Admin should be able to choose which real catalog category appears in circle categories.
   - Admin should separately choose which real catalog category appears in the Shop by Category slider.
   - These should not be loose text/image cards without catalog relationships.
3. Product listing/create/edit should clearly decide where a product belongs:
   - Normal catalog category assignment should decide which category pages the product appears in.
   - Homepage product placements should decide if the product appears in `New Arrivals`, `Bestsellers`, or other homepage product sections.
4. Homepage Collections section should be a slider/carousel, not only a fixed 3-card grid.
5. `Bestsellers` and `New Arrivals` should be admin-curated product sections, not just automatic slices from the newest products response.
6. When admin creates or edits a category or collection, the same screen should include product selection so products can immediately appear in that new category/collection.

## Target Data Model

Recommended clean model:

### Real Catalog Taxonomy

Keep using existing tables:

- `categories`
- `product_categories`
- `product_collections`
- `products.collection_id`

These decide product browse/category/collection membership.

Add missing collection-product join support:

Current schema supports only one `products.collection_id` per product. That works for a single collection dropdown, but it is limiting for admin collection management.

Recommended:

```text
product_collection_members
- product_id
- collection_id
- sort_order
- created_at
```

Why:

- Admin can add many products to one collection from the collection edit screen.
- One product can belong to multiple collections if needed.
- Collection pages can preserve curated product order.

If keeping the current one-collection-per-product model, collection create/edit can still update `products.collection_id`, but it will remove the product from any previous collection. That is simpler but weaker.

### Homepage Category Slots

Use category-backed slots instead of free-form homepage category cards.

Option A, preferred:

Create one table:

```text
homepage_category_slots
- id
- section_key: "circle" | "shop_by_category"
- category_id
- custom_label
- custom_image_url
- is_active
- sort_order
- created_at
- updated_at
```

Why: one system can power both circle categories and Shop by Category slider while still keeping both sections separate through `section_key`.

Option B:

Reuse existing tables with new columns:

- Add `category_id` to `category_circles`.
- Add `category_id` and rename usage of `homepage_categories` to `shop_by_category_slots`.

This is less clean but lower migration effort.

### Homepage Collection Slots

Create or extend collection placement:

```text
homepage_collection_slots
- id
- collection_id
- custom_title
- custom_image_url
- description
- is_active
- sort_order
- created_at
- updated_at
```

This powers the homepage collection slider. The collection page itself still comes from `product_collections`.

### Homepage Product Placements

Create a generalized product placement table:

```text
homepage_product_placements
- id
- section_key: "new_arrivals" | "bestsellers" | "spotlight"
- product_id
- custom_image_url
- badge_text
- is_active
- sort_order
- created_at
- updated_at
```

This replaces the current overloaded `featured_products` workflow, or `featured_products` can be migrated/extended with `section_key`.

## Target Admin UX

### Product Create/Edit

Add a right-side or bottom panel named `Homepage Placement`.

Controls:

- `Catalog Categories`: existing real category multi-select.
- `Collection`: existing collection dropdown.
- `Show in New Arrivals`: checkbox.
- `New Arrivals sort order`: number input shown only when checked.
- `Show in Bestsellers`: checkbox.
- `Bestsellers sort order`: number input shown only when checked.
- Optional `Homepage badge`: text input.

Expected behavior:

- Selecting catalog categories controls category/collection browsing.
- Checking New Arrivals/Bestsellers creates or updates rows in `homepage_product_placements`.

### Category Create/Edit

The category form should include a product assignment panel.

Controls:

- Search products by title/SKU.
- Multi-select products.
- Show currently assigned products.
- Allow remove/reorder assigned products.
- Save updates to `product_categories`.

Expected behavior:

- Creating a new category and selecting products immediately makes those products appear on `/collections/{category.slug}`.
- Editing a category can add/remove products without opening each product separately.
- Product edit page should still show the category checkboxes, synced with these category assignments.

### Collection Create/Edit

The collection form should include product selection.

Controls:

- Search products by title/SKU.
- Multi-select products.
- Show selected/assigned products.
- Allow remove/reorder assigned products.
- Optional: mark collection as active for homepage collection slider.

Expected behavior:

- Creating a collection and selecting products immediately makes those products appear on `/collections/{collection.handle}`.
- If using `product_collection_members`, products can be in multiple collections.
- If using current `products.collection_id`, selecting products updates their `collection_id` to this collection, with a warning if they already belong to another collection.

### Homepage Circle Categories Admin

Replace free-form `Link URL` with:

- `Catalog Category`: dropdown/search picker from `categories`.
- `Label override`: optional.
- `Image override`: optional, default to category image/header image.
- `Active`
- `Sort order`

Output:

- Storefront links to `/collections/{category.slug}`.
- Products shown on that category page come from `product_categories`.

### Shop by Category Admin

Separate screen/section from circle categories.

Controls:

- `Catalog Category`: dropdown/search picker.
- `Card image override`.
- `Title override`.
- `Active`
- `Sort order`

Output:

- Homepage `Shop by Category` slider uses this list.
- Each slide links to `/collections/{category.slug}`.

### Homepage Collections Admin

Controls:

- `Collection`: dropdown/search picker from `product_collections`.
- `Image override`.
- `Description override`.
- `Active`
- `Sort order`

Output:

- Homepage Collections section renders as a slider/carousel.

### Homepage Product Sections Admin

Either add a new screen called `Homepage Products` or extend existing `Spotlight Products`.

Controls:

- Tabs: `New Arrivals`, `Bestsellers`, `Spotlight`.
- Search product by name/SKU.
- Active/inactive.
- Sort order.
- Optional custom image and badge.

Output:

- `NewArrivals` reads only active `section_key = "new_arrivals"` products.
- `BestSellers` reads only active `section_key = "bestsellers"` products.
- Fallback to automatic products only if a section has no curated entries.

## Workflow Map

| Admin screen | Backend table/endpoint | Storefront consumer | Product listing selectable? | Status |
| --- | --- | --- | --- | --- |
| `Products > Add/Edit` | `/products`, `products`, `product_categories`, `product_collections` | Product pages, catalog | Yes | Mostly working |
| `Categories` | `/categories`, `categories` | Header, collection/category pages, product form | Yes | Working, but needs cache/revalidation fixes |
| `Collections` | `/collections`, `product_collections` | Collections pages, product form | Yes | Working, but needs cache/revalidation fixes |
| `Homepage Categories` | `/admin/homepage-categories`, `homepage_categories` | Homepage category grid | No | Misleading name/workflow |
| `Category Circles` | `/admin/category-circles`, `category_circles` | Mobile circle shortcuts | No | Visual shortcut only |
| `Hero Banners` | `/admin/hero-banners`, `hero_banners` | Homepage hero | Partially | Storefront uses only first banner |
| `Homepage Banners` | `/admin/homepage-banners`, `homepage_banners` | Category/collection banner carousel via `/banners` | No | Misnamed and not target-specific |

## Findings

### 1. Critical: "Homepage Categories" are not real product categories

Evidence:

- Admin navigation has both `Homepage Categories` and real `Categories`, which creates a natural expectation that both affect product categorization: `admin/src/components/layout/navigation.ts:101` and `admin/src/components/layout/navigation.ts:119`.
- `HomepageCategoriesManager` saves only `name`, `link_url`, image, sort order, and active state: `admin/src/components/HomepageCategoriesManager.tsx:138`.
- Backend writes those records into `homepage_categories`, not `categories`: `backend/src/routes/admin/homepage-categories.ts:114`.
- Storefront homepage renders them through `api.getHomepageCategories()` and `CategoriesGrid`: `storefront/src/app/page.tsx:69`, `storefront/src/app/page.tsx:330`.
- Product creation reads only real taxonomy and collections: `admin/src/app/dashboard/products/new/page.tsx:163`.
- Product creation submits `category_ids` and `collection_id`, not homepage category IDs: `admin/src/app/dashboard/products/new/page.tsx:234` and `admin/src/app/dashboard/products/new/page.tsx:236`.

Impact:

If an admin adds "categories" under `Homepage Categories`, they can appear on the storefront homepage, but they will not appear in product listing category checkboxes. This matches the user's complaint.

Recommendation:

- Rename `Homepage Categories` to `Homepage Category Cards`.
- Add helper text: "This only creates storefront cards. To assign products, create a real category under Catalog > Categories."
- Better fix: replace free-text `link_url` with a target selector: `Category`, `Collection`, or custom URL. Store `target_type` and `target_id`, then generate `link_url`.

### 2. Critical: Hero banner slider is not wired on homepage

Evidence:

- Storefront homepage fetches active hero banners: `storefront/src/app/page.tsx:71`.
- It filters and sorts banners, but then selects only the first item: `storefront/src/app/page.tsx:290` through `storefront/src/app/page.tsx:312`.
- It passes that one banner into `HeroSection`: `storefront/src/app/page.tsx:329`.
- `HeroSection` accepts a single `fallbackBanner`, not an array: `storefront/src/components/home/HeroSection.tsx:23`.
- There is an Embla-based `HeroCarousel`, but it is not used by the homepage: `storefront/src/components/hero/HeroCarousel.tsx:65`.

Impact:

Admin can save 3-4 hero banners, but only the first active/sorted banner appears. Slider dots in `HeroSection` are static decoration, not carousel state.

Recommendation:

- Replace `heroBanner` with `heroBanners`.
- Either render `HeroCarousel` on the homepage or convert `HeroSection` into a client carousel that accepts `banners[]`.
- Preserve existing homepage settings as fallback only when no active hero banners exist.

### 3. High: "Homepage Banners" are actually category page banners

Evidence:

- Admin nav labels the screen `Homepage Banners`: `admin/src/components/layout/navigation.ts:74`.
- The manager title says `Category Page Banners`: `admin/src/components/HomepageBannersManager.tsx:204`.
- Backend writes to `homepage_banners`: `backend/src/routes/admin/homepage-banners.ts:114`.
- Storefront homepage does not call `getHomepageBanners`.
- Collection/category landing pages call `api.getBanners()`: `storefront/src/app/collections/[handle]/page.tsx:139`.
- `/banners` is backed by `homepage_banners`, not the legacy `banners` table: `backend/src/routes/banners.ts:4`.
- Product catalog has `categoryPageBanners` props, but the product page never passes banner data, so it defaults to empty: `storefront/src/components/products/CatalogClient.tsx:47` and `storefront/src/components/products/CatalogClient.tsx:99`.

Impact:

Admin thinks they are managing homepage banners, but those banners are used as global category/collection page banners. They are not targeted to a specific category/collection and are not shown on the homepage.

Recommendation:

- Rename admin UI and nav to `Category Page Banners`.
- Add target fields: all pages, category ID, collection ID.
- If the intended behavior is homepage banners, add `api.getHomepageBanners()` to `storefront/src/app/page.tsx` and render a proper carousel section.

### 4. High: Homepage shortcut systems use free-form links instead of real catalog relationships

Evidence:

- `homepage_categories` stores `link_url` as free text and only validates that it is a storefront href: `backend/src/routes/homepage-categories.ts:23`.
- `category_circles` also stores free-form `link_url`, and the public route filters only URL/image validity: `backend/src/routes/category-circles.ts:23`.
- `CategoryCirclesManager` calls collections and builds links like `/collections/{handle}` even though the feature is named Category Circles: `admin/src/components/CategoryCirclesManager.tsx:92` and `admin/src/components/CategoryCirclesManager.tsx:478`.

Impact:

The visual category shortcut workflows are not connected to the real `categories` table. Links can point to collections, product filters, or any valid storefront path. This makes content appear on storefront while still being invisible to product assignment.

Recommendation:

- Use a shared "catalog target picker" component across homepage cards, category circles, and banners.
- Store `target_type` and `target_id` instead of only `link_url`.
- Generate links from real category/collection data so UI copy and data behavior stay aligned.

### 5. Medium: Category and collection saves do not trigger storefront revalidation

Evidence:

- Product writes trigger storefront revalidation: `backend/src/routes/products.ts:200`, `backend/src/routes/products.ts:232`, `backend/src/routes/products.ts:274`, `backend/src/routes/products.ts:313`, `backend/src/routes/products.ts:340`.
- Category and collection create/update/delete routes do not call `triggerStorefrontRevalidation`: `backend/src/routes/categories.ts:88`, `backend/src/routes/categories.ts:162`, `backend/src/routes/categories.ts:190`, `backend/src/routes/collections.ts:72`, `backend/src/routes/collections.ts:100`, `backend/src/routes/collections.ts:128`.
- Storefront category and collection fetches are cached for 1 hour: `storefront/src/lib/api.ts:283` and `storefront/src/lib/api.ts:304`.

Impact:

New or edited categories/collections may be stale on storefront pages for up to an hour. Admin product forms fetch from the backend client-side, but storefront navigation and collection pages can lag.

Recommendation:

- Add revalidation after category and collection create/update/delete.
- Revalidate `/`, `/products`, `/collections`, `/collections/{slug-or-handle}`, and cache tags like `categories`, `collections`, `products`.

### 6. Medium: Storefront catalog has mixed product filter and landing-page behavior

Evidence:

- `/products?category_id=...` and `/products?collection_id=...` are immediately redirected to `/collections/{slug}`: `storefront/src/app/products/page.tsx:45` through `storefront/src/app/products/page.tsx:78`.
- `CatalogClient` still has category/collection filter UI that pushes those query params: `storefront/src/components/products/CatalogClient.tsx:113`, `storefront/src/components/products/CatalogClient.tsx:236`, `storefront/src/components/products/CatalogClient.tsx:145`.
- Backend product filtering by category/collection exists and works: `backend/src/routes/products.ts:34`, `backend/src/routes/products.ts:36`, `backend/src/services/product/product-query-service.ts:76`, `backend/src/services/product/product-query-service.ts:84`.

Impact:

The backend supports filtering products directly, but the storefront route model redirects category/collection filters into collection landing pages. This is not necessarily broken, but it makes QA and admin mental models confusing.

Recommendation:

- Choose one public model:
  - Keep `/products` as a filterable catalog and stop redirecting category/collection params.
  - Or make all category/collection buttons direct links to `/collections/{handle}` and remove dead filter expectations from `/products`.

### 7. Medium: Admin product form hides API failures and gives weak diagnostics

Evidence:

- New product form catches taxonomy loading failures and ignores them: `admin/src/app/dashboard/products/new/page.tsx:163` and `admin/src/app/dashboard/products/new/page.tsx:169`.
- The UI then shows "No categories found" even if the backend failed, auth/cookie failed, or the admin created only homepage category cards: `admin/src/app/dashboard/products/new/page.tsx:561`.

Impact:

Admins cannot tell the difference between "no real categories exist" and "the category API failed" and "you created homepage category cards instead."

Recommendation:

- Show a visible load error if `api.getCategories()` or `api.getCollections()` fails.
- Add empty-state CTA links: `Create product category` and `Create collection`.
- Add note in the product form: "Only Catalog > Categories and Catalog > Collections appear here."

## Suggested Fix Order

1. Add real homepage placement models:
   - Category slots for `circle` and `shop_by_category`.
   - Collection slots for homepage collection slider.
   - Product placements for `new_arrivals` and `bestsellers`.
2. Add product assignment to Category create/edit.
3. Add product assignment to Collection create/edit.
4. Update admin product create/edit with homepage placement controls for New Arrivals and Bestsellers.
5. Update circle categories and Shop by Category admin to select real catalog categories.
6. Convert homepage Shop by Category into a slider/carousel.
7. Convert homepage Collections section into a slider/carousel.
8. Make `NewArrivals` and `BestSellers` read curated placements first, fallback to automatic products only if empty.
9. Fix hero homepage rendering so active hero banners become a real slider.
10. Rename confusing admin screens:
   - `Homepage Categories` -> `Homepage Category Cards`
   - `Homepage Banners` -> `Category Page Banners`
11. Add category/collection/homepage placement revalidation on backend writes.
12. Improve product form empty/error states.
13. Decide whether `/products` should be filterable or whether category/collection browsing should live only under `/collections/{handle}`.

## Acceptance Checklist

- Creating a real category under `Dashboard > Categories` appears in product create/edit categorization.
- Creating a real collection under `Dashboard > Collections` appears in product create/edit collection dropdown.
- Creating a homepage category card does not pretend to be product taxonomy, or it is backed by a real category/collection target.
- Adding 3 active hero banners shows a working homepage slider with all 3 slides.
- Adding category page banners shows them only where intended.
- Storefront reflects category/collection edits immediately after admin save.

## Desired Homepage Acceptance Checklist

- Admin can choose separate categories for the top circle category section.
- Admin can choose separate categories for the homepage `Shop by Category` section.
- A product assigned to a chosen real catalog category appears when that category is opened.
- Homepage `Shop by Category` renders as a slider/carousel, not a fixed grid only.
- Homepage Collections renders as a slider/carousel.
- Admin can select products for `New Arrivals`.
- Admin can select products for `Bestsellers`.
- Homepage `New Arrivals` shows admin-selected products in configured order.
- Homepage `Bestsellers` shows admin-selected products in configured order.
- Product create/edit clearly exposes catalog category, collection, New Arrivals placement, and Bestseller placement without mixing them with visual homepage category cards.
- Category create/edit lets admin select products for that category.
- Collection create/edit lets admin select products for that collection.
- Newly selected products appear on the new category/collection storefront page after save.

## Execution Status

Implemented on 2026-04-23:

- Added `category_id` links to `homepage_categories` and `category_circles`.
- Added `section_key` to `featured_products` so the same table can power `spotlight`, `new_arrivals`, and `bestsellers`.
- Added backend admin/public APIs for section-filtered homepage products.
- Added backend APIs to read/update assigned products for categories and collections.
- Added reusable admin product assignment picker.
- Added product selection to category create/edit.
- Added product selection to collection create/edit.
- Added New Arrivals and Bestsellers placement controls to product create/edit.
- Updated Homepage Categories admin so Shop by Category cards can choose a real catalog category.
- Updated Category Circles admin so circle shortcuts can choose a real catalog category.
- Updated storefront Shop by Category section to render as a horizontal slider.
- Updated storefront Collections section to render as a horizontal slider.
- Updated storefront New Arrivals and Bestsellers to use admin-curated products first, then fallback to automatic product lists.

Verification:

- `backend`: `npm.cmd run build` passed.
- `backend`: `npm.cmd run lint` passed.
- `admin`: targeted ESLint on touched files passed.
- `admin`: `npx.cmd tsc --noEmit --pretty false` passed.
- `admin`: `npm.cmd run build` passed after allowing Next/Turbopack to spawn workers outside the sandbox.
- `storefront`: targeted ESLint on touched files passed.
- `storefront`: `npx.cmd tsc --noEmit --pretty false` passed.
- `storefront`: `npm.cmd run build` passed after allowing network access for `next/font` Google Fonts.

Notes:

- A database migration was added at `backend/drizzle/0029_homepage_merchandising_slots.sql`; it must be applied before using the new admin fields in production.
- Collection product assignment currently uses the existing `products.collection_id` model, so one product can belong to one collection at a time. A many-to-many collection membership table is still recommended for a fuller collection workflow.
- The original hero banner slider issue is now fixed: homepage passes all active hero banners into a real Embla slider, and mobile hero height is constrained to fit the visible mobile viewport below the header.

## Pre-Push Reverification

Re-audited on 2026-04-23 before GitHub push.

Issues found during re-audit and fixed:

- Storefront spotlight fetch could accidentally include all active featured rows when no `section` was passed. Fixed by making spotlight fetch explicitly use `section = "spotlight"` and making the public backend route default to active spotlight rows only.
- Homepage Collections slider was still limited to 3 collections before the slider component received data. Fixed by passing the full collection list to the slider component.
- Category edit could clear all assigned products if product assignments failed to load before save. Fixed by blocking save until assigned products load.
- Collection edit could clear all assigned products if product assignments failed to load before save. Fixed by blocking save until assigned products load.
- Product edit could clear New Arrivals/Bestsellers placements if placement loading failed. Fixed by only syncing homepage placements after placement data loads successfully.
- Product placement updates could leave duplicate New Arrivals/Bestsellers rows if duplicates already existed. Fixed by replacing all rows for that product in those two sections during product placement save.
- Homepage was still rendering only the first active hero banner. Fixed by passing the full active hero banner list into `HeroSection` and converting `HeroSection` into a real autoplay carousel.
- Mobile hero height could overflow the visible mobile screen below the header. Fixed with a mobile height based on `100svh - 73px`.

Final verification commands:

- `backend`: `npm.cmd run build` passed.
- `backend`: `npm.cmd run lint` passed.
- `backend`: `npm.cmd run test:run` passed: 69 passed, 33 skipped.
- `admin`: `npx.cmd tsc --noEmit --pretty false` passed.
- `admin`: targeted ESLint on touched files passed.
- `admin`: `npm.cmd run build` passed.
- `storefront`: `npx.cmd tsc --noEmit --pretty false` passed.
- `storefront`: targeted ESLint on touched files passed.
- `storefront`: `npm.cmd run test:unit -- --run` passed: 2 passed.
- `storefront`: `npm.cmd run build` passed.
- Repo hygiene: `git diff --check` passed.

Remaining non-blocking warnings observed:

- Next.js warns about multiple lockfiles and inferred workspace root for both admin and storefront.
- Storefront build logs CSRF-token fetch warnings during static generation.
- Storefront build logs a Windows-only standalone traced-file copy warning for `node:inspector`, but the build exits successfully.
- Backend full `tsc --noEmit` still runs out of memory in this workspace; the backend's configured core typecheck (`npm.cmd run lint`) passes.
