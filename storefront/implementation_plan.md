# Storefront Prototype Redesign Parity Execution Plan

The goal is to update the production Next.js storefront (`storefront/`) to match the exact visual design of `storefront-redesign-prototype.html` while wiring everything up to the existing backend APIs (real database).

## User Review Required

> [!IMPORTANT]
> The database schema migrations for the backend (adding `mobile_image_url` for heroes, `category` for reels, and `homepage_merchandising_slots`) have already been applied to the database. We will now focus entirely on updating the Storefront (Next.js) code and the Backend API routes to serve this data correctly.

## Proposed Changes

### 1. Update Design System Tokens and Fonts
- Remove old Amiri/Cardo fonts and black/white tokens.
- Add Playfair Display and Lato fonts to `storefront/src/app/layout.tsx` (or equivalent).
- Inject new Sienna/Sage/Cream color variables and `--radius-` utilities into `storefront/src/app/globals.css` or `tailwind.config.ts`.
- Replace old `*-prem` CSS classes with the new prototype utilities (`.kv-card`, `.kv-btn`, etc.).

---

### 2. Backend API Extensions (To Serve Real Data)
Before updating UI components, we must ensure the storefront API fetches the new DB fields:
- Update `GET /api/homepage/hero` to include `mobile_image_url`.
- Update `GET /api/reels` (or equivalent) to expose `category`, `caption`, and linked `product_id`.
- Create a new endpoint `GET /api/homepage/merchandising` to fetch `homepage_merchandising_slots` for sections like "Shop the Look", "Seasonal Edits".
- Update Collection endpoint to return product counts.

#### [MODIFY] `backend/src/routes/homepage.ts` (or similar)
#### [MODIFY] `backend/src/routes/trending-reels.ts`

---

### 3. Header, Drawer & Navigation Shell
Rebuild the main layout wrapper to exactly match the prototype's compact, mobile-first design.
- Implement the Sienna announcement bar using data from `getHomepageSettings()`.
- Rebuild `Header` component to be sticky, with centered logo and clean icon buttons.
- Update Mobile Drawer with the prototype's smooth sliding animation and correct route links.

#### [MODIFY] `storefront/src/components/layout/Header.tsx`
#### [MODIFY] `storefront/src/components/layout/MobileMenu.tsx`
#### [MODIFY] `storefront/src/app/globals.css`

---

### 4. Product Cards & Grids
The old `ProductGrid` uses `.prod-card-prem` and a "Quick Add" behavior.
- Build the exact Prototype Product Card: Rounded white card, real thumbnail image, Wishlist bubble, Quick View button, Price/Compare Price, Mini Cart (+) button.
- Ensure the compact mode matches the horizontal card design.
- Wire the "Mini Cart" to `useCart` state for real-time addition.

#### [MODIFY] `storefront/src/components/ProductCard.tsx`
#### [MODIFY] `storefront/src/components/ProductGrid.tsx`

---

### 5. Homepage (1:1 Parity)
Rebuild homepage sections using the new design system and data from the backend APIs.
- **Hero Section:** Clean image slider supporting `mobile_image_url`.
- **Circular Categories:** Ensure horizontal scrollability and fetch from `category_circles`.
- **Curated Sections (New Arrivals, Bestsellers):** Render 2-up mobile product grids.
- **Watch & Buy (Reels):** 2-column mobile reel preview fetching real trending reels.
- **Merchandising Slots (Seasonal Edits, Shop by Fabric):** Render real data from `homepage_merchandising_slots`.

#### [MODIFY] `storefront/src/app/page.tsx`
#### [MODIFY] `storefront/src/components/homepage/...`

---

### 6. Catalog, Collections, and Reels Pages
- **Catalog (`/products`):** Rebuild the layout with horizontal category chips, full-screen mobile filter sheet, sticky desktop filter sidebar. Ensure no fake counts.
- **Collections (`/collections`):** Redesign collection cards to show real product counts and gradient backgrounds.
- **Reels (`/reels`):** Rebuild the Watch & Buy reels page. Fetch real reels, display categories as chips, and open the Reel Viewer Modal on click with the linked Product CTA.

#### [MODIFY] `storefront/src/app/products/page.tsx`
#### [MODIFY] `storefront/src/app/collections/page.tsx`
#### [MODIFY] `storefront/src/app/reels/page.tsx`

**Status:** Completed.
- `/products` now has horizontal chips, a mobile filter sheet, a sticky desktop filter sidebar, and syncs product state after server-side filter changes.
- `/collections` uses backend `product_count` values directly and renders gradient-backed collection cards.
- `/reels` uses only backend reels, derives category chips from real reel categories, removes placeholder reel data, and opens the reel viewer with the linked product CTA.

---

### 7. Product Detail Page
- Rebuild the image gallery and details layout (single column mobile, two-column desktop).
- Keep the real variants and option selectors. Do not fake any sizes or colors.
- Build the sticky mobile "Buy Bar" that is linked to the real `useCart` state.

#### [MODIFY] `storefront/src/app/products/[handle]/page.tsx`

**Status:** Completed.
- Product detail keeps the real gallery, variants, option selectors, inventory state, and cart integration.
- Sticky mobile buy bar now reflects selected variant and quantity before adding the real selected variant to cart.

---

## Verification Plan

### Automated Tests
- Run `npm run lint` and `npm run build` in the `storefront/` directory.

### Manual Verification
- Test viewport behavior around 390px width for mobile-first layout.
- Verify the following pages for visual parity and accurate data fetching:
  - `/` (Home)
  - `/products` (Shop All, check filters)
  - `/collections` (Check counts)
  - `/reels` (Check categories, viewer modal, real products)
  - Product Detail Page (Check gallery, variants, add to cart, sticky buy bar)
- Ensure no dummy arrays from `prototype.html` exist in the codebase.
