# Odhvica Storefront Studio to Production Migration Map

## Purpose

The separate studio is a design reference and interaction benchmark. Production migration must preserve the existing Next.js route structure, API-backed state, authenticated flows, payment integrations, and domain contracts. Studio-local arrays, browser-only cart state, mock checkout confirmation, and placeholder account/support data must not be copied into production.

## Route and Contract Mapping

| Production surface | Existing production source | Live contract | Studio concepts to migrate | Guardrail |
|---|---|---|---|---|
| Home | `src/app/page.tsx`, `components/home/*` | `api.getHomepage()`, testimonials | Campaign rhythm, editorial section hierarchy, colour chapters, material-story framing | Keep `HomepagePayload` and `HomepageFallback` behavior intact. |
| Catalog and collections | `components/products/CatalogClient.tsx`, `components/listing/*` | `catalogApi`, catalog filter policy | Collection campaign banner, dense cards, filter framing, product media hierarchy | Preserve URL filter state, pagination, search, and live inventory results. |
| Product detail | `components/product/ProductView.tsx` | catalog, cart, wishlist, reviews, delivery endpoints | Dossier composition, gallery rhythm, material/care/dispatch panels, related discovery | Preserve variants, stock availability, buy-now, wishlist, and rich-text sanitization. |
| Cart | `components/layout/CartDrawer.tsx`, `app/cart/*` | `sessionCartApi`, cart context | Editorial receipt framing and mobile order summary | Preserve server/session cart merging, quantity mutations, and recovery. |
| Checkout | `app/checkout/page.tsx`, `components/checkout/*` | checkout, shipping/tax, payment, order APIs | Visual order dossier, step hierarchy, payment confidence layout | Preserve pricing policy, stale-response guards, Stripe/PayPal/Razorpay paths, and order state. |
| Account and tracking | `app/account/*`, `app/track/*` | auth/account/order/tracking endpoints | Editorial utility framing and service navigation | Never replace authenticated data with local demo state. |
| Support, content, policies | `app/contact/*`, `app/help/*`, `app/pages/*`, `app/journal/*` | engagement/content APIs and static CMS pages | Hierarchy, service modules, material imagery, reading rhythm | Keep contact submission, policy content, accessibility, and SEO metadata intact. |

## Migration Order

The safe order is home and catalog first, then product detail, then cart/checkout, followed by account and service pages. Each slice must retain its existing API response contracts and E2E coverage. New visual assets must be Odhvica-owned or properly licensed and loaded through the production image pipeline.

## Explicitly Excluded Studio Behaviors

Studio mock products, client-only localStorage cart and wishlist, fake checkout confirmation, placeholder customer accounts, static tracking, static contact success states, and sample policies are not production features. They are visual prototypes only.
