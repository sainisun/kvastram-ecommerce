# Prototype Other Pages Execution Plan

Date: 2026-04-20
Goal: Make the remaining prototype pages visually match the mockup while keeping real API wiring, real admin-managed content, and the existing Next.js route structure.

## Non-Negotiable Rules

- Use the existing storefront API client.
- Use the existing backend/admin data models first.
- Do not build duplicate product, collection, or reel systems.
- Do not introduce mock data into production routes.
- Every page must stay build-safe when data is empty.
- Keep SEO and metadata in route files or shared SEO helpers.

## Page Target Map

| Prototype page | Current route | Plan |
| --- | --- | --- |
| Homepage | `/` | Keep the prototype core exact and append extra features after it. |
| Collections listing | `/collections` | Rebuild as a collection hub using real collections, categories, and tags. |
| Shop page | `/products` | Restyle the existing catalog client to prototype layout. |
| Bestsellers | new thin route | Add a curated bestsellers route backed by admin-managed tags or collections. |
| Reels grid | `/reels` | Re-skin the existing reels route to the prototype shell. |

## Phase 0: Verify Data Ownership

Purpose: confirm which admin sources should power each page.

Tasks:

- Collections page:
  - use `product_collections`
  - use `categories` or `tags` only if the filter chips are truly editable
- Shop page:
  - use `products`, `categories`, `collections`, `tags`
- Bestsellers:
  - choose one real source: curated tag or curated collection
- Reels:
  - keep `trending_reels`
- Social proof:
  - reuse existing settings/stat fields if needed

Exit criteria:

- Every prototype block has a real backend or admin source.

## Phase 1: Collections Page Parity

Purpose: match the prototype collections page without duplicating collection logic.

Files likely touched:

- `storefront/src/app/collections/page.tsx`
- `storefront/src/components/products/ProductGrid.tsx` or a thin wrapper
- `storefront/src/lib/seo.ts`

Tasks:

- Replace the current story-row layout with:
  - featured collection strip
  - filter chips backed by real taxonomy
  - collection tiles/grid
  - load more or browse more control
- Keep the current `/collections/[handle]` resolver.
- If a chip is only visual and not backed by API/admin data, hide it until it is real.
- Keep all collection images and handles admin-managed.

Verification:

- `storefront npm run lint`
- `storefront npm run build`
- Playwright coverage for `/collections`

Exit criteria:

- The page shell matches the prototype order and uses real data only.

## Phase 2: Shop Page Parity

Purpose: make `/products` look like the prototype `Shop All` page.

Files likely touched:

- `storefront/src/app/products/page.tsx`
- `storefront/src/components/products/CatalogClient.tsx`
- `storefront/src/components/products/FilterSidebar.tsx`
- `storefront/src/lib/api.ts` only if a real backend filter is missing

Tasks:

- Add a prototype-style hero block with product count.
- Render category tabs and filter bar from real filter sources.
- Keep pagination/load-more behavior tied to real product results.
- Remove or hide any filter that is only client state.
- Keep the current canonical route, do not add a second shop implementation.

Backend follow-up if needed:

- If price sort is exposed, make sure backend ordering is correct.
- If a filter is not supported, do not fake it in the UI.

Verification:

- `storefront npm run lint`
- `storefront npm run build`
- Playwright coverage for `/products`

Exit criteria:

- The shop page looks like the prototype and remains fully data-driven.

## Phase 3: Bestsellers Route

Purpose: add the missing bestseller page from the prototype.

Recommended route:

- `storefront/src/app/bestsellers/page.tsx`

Data source options:

1. Curated tag
2. Curated collection
3. Admin-managed featured products

Recommendation:

- Use a curated tag or collection first.
- Do not wait for sales analytics before shipping the UI.

Tasks:

- Build a hero with social proof stats.
- Build a minimal filter row.
- Render a 3-up product grid using the existing product card system.
- Add breadcrumbs and SEO metadata.
- Keep the data source admin-manageable.

Admin requirements:

- Products must remain editable in admin.
- The curation source must be editable in admin.
- Social proof numbers should come from settings or another real source, not hardcoded mock text.

Verification:

- `storefront npm run lint`
- `storefront npm run build`
- Playwright coverage for `/bestsellers`

Exit criteria:

- The page exists, is real-data-backed, and does not duplicate `/products`.

## Phase 4: Reels Grid Parity

Purpose: make `/reels` match the prototype shell more closely.

Files likely touched:

- `storefront/src/app/reels/page.tsx`
- `storefront/src/components/reels/ReelsExperience.tsx`
- `storefront/src/components/home/TrendingReels.tsx`
- `storefront/src/app/trending-now/page.tsx`

Tasks:

- Keep `/reels` canonical.
- Add hero, filter chips, 4-up desktop grid, 2-up mobile grid, and load more behavior.
- Keep the current trending-reels table and admin manager.
- Preserve view tracking, deep links, and playback safety.

Compatibility:

- Keep `/trending-now` working as a redirect or alias.

Verification:

- `storefront npm run lint`
- `storefront npm run build`
- Playwright coverage for `/reels` and `/trending-now`

Exit criteria:

- The reels experience is prototype-like and still admin-manageable.

## Phase 5: Safety Pass

Purpose: make sure the redesign does not break real usage.

Tasks:

- Verify empty-state behavior on all redesigned pages.
- Verify images use the existing optimized image path.
- Verify metadata and breadcrumbs exist on new routes.
- Verify route redirects do not split canonical URLs.
- Verify no page depends on hardcoded sample commerce data.

Verification:

- `storefront npm run lint`
- `storefront npm run build`
- Playwright smoke suite for homepage, collections, shop, bestsellers, and reels

## Recommended Work Order

1. Collections page
2. Shop page
3. Bestsellers route
4. Reels grid refinement
5. Safety and SEO pass

## Refactor Guidance

Allowed:

- Thin wrappers around existing product/collection/reel components
- Shared filter and hero helpers
- Route aliases and redirects

Not allowed:

- A second product database layer
- A second reels data model
- Mock collections or mock bestseller lists in production
- Rebuilding cart or wishlist logic

## Final Decision

The right redesign strategy is reuse-first and admin-driven.

We should:

- keep real APIs as the source of truth
- keep admin as the content manager
- shape the UI to the prototype
- add only the smallest route wrappers needed for parity

