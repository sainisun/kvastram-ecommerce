# Kvastram Premium Storefront Design System

## Objective

Transform the storefront from a functional but visually inconsistent interface into a cohesive, editorial luxury-commerce experience that feels credible for a multi-million-dollar brand. This work is a presentation and experience refactor: customer journeys, API contracts, route URLs, commerce behavior, and accessibility semantics must remain stable.

## Design direction

The visual direction is **Contemporary Indian Craft Luxury**. It combines restrained editorial typography with warm material tones, generous whitespace, high-quality product imagery, and precise commerce controls. The experience should feel composed rather than decorated: fewer competing accents, clearer hierarchy, consistent surfaces, and a deliberate rhythm from discovery to purchase.

The visual language uses deep ink for authority, parchment for warmth, terracotta for primary action, muted brass for craft cues, and a quiet sage/green semantic state for trust and success. Terracotta is reserved for decisive actions and selected states; brass is an accent, not a competing CTA color. Surfaces use warm off-whites rather than default white wherever a section needs separation.

## Experience principles

1. **Editorial first, commerce always.** Large imagery and story-led section openings create aspiration, while product title, price, availability, and action remain immediately legible.
2. **One hierarchy per viewport.** Each section has one dominant message and one primary action. Secondary actions are visually quieter and never compete with the purchase path.
3. **Material consistency.** Page backgrounds, product media, controls, cards, drawers, and overlays consume semantic tokens rather than route-specific colors or arbitrary values.
4. **Premium restraint.** Use borders and shadows sparingly. Prefer whitespace, tonal contrast, typography, and image cropping over excessive cards or decoration.
5. **Fast confidence.** Loading, empty, error, success, focus, hover, and disabled states are designed as part of the component contract—not added after the happy path.
6. **Responsive continuity.** Mobile is not a compressed desktop. Navigation, product grids, filter controls, checkout summaries, and editorial compositions are designed for touch and narrow widths first.
7. **Accessible luxury.** Contrast, focus visibility, keyboard reachability, target sizing, reduced motion, semantic headings, and screen-reader labels are non-negotiable.

## Canonical design tokens

The token source remains `design-system/tokens.json`; generated files must continue to be produced by `scripts/generate-design-system.mjs`. The token contract will be normalized into these roles:

| Role | Direction |
|---|---|
| Display type | High-contrast editorial serif for hero and section headings |
| Body type | Readable serif/sans pairing with stable line length and rhythm |
| UI type | Compact, legible, medium-weight controls and metadata |
| Page surface | Warm parchment rather than pure white |
| Elevated surface | Paper tone with subtle tonal separation |
| Primary action | Jaipur terracotta with a darker hover state |
| Craft accent | Muted brass for labels, badges, and quiet highlights |
| Ink | Deep warm near-black for text and navigation |
| Border | Low-contrast warm line; strong border only for focus or emphasis |
| Radius | Small-to-medium editorial corners; pill only for chips/status controls |
| Motion | 140–220ms state transitions; reduced-motion fallback |

## Shared primitive contract

The foundation layer will establish one implementation for each of the following primitives: `PageContainer`, `Section`, `SectionHeader`, `Eyebrow`, `Button`, `IconButton`, `Link`, `Badge`, `Chip`, `ProductCard`, `ProductMedia`, `Price`, `Rating`, `Drawer`, `Modal`, `Input`, `Select`, `QuantityControl`, `EmptyState`, `ErrorState`, `Skeleton`, and `TrustItem`.

Each primitive must expose typed variants, consume semantic tokens, preserve keyboard/focus behavior, and support the responsive states used by the storefront. Route-specific components may compose these primitives, but they must not redefine their visual contract.

## Migration sequence

### Phase A — Foundation

Normalize token roles and generated artifacts. Repair the button variant contract, remove duplicate primitive definitions, consolidate typography roles, and define the canonical container/section rhythm. Add visual smoke tests for the shared primitives.

### Phase B — Global shell

Recompose announcement bar, header, navigation, mobile menu, search entry, account actions, cart affordance, footer, and global overlays around the foundation primitives. Preserve all existing links and authentication/cart behavior.

### Phase C — Discovery

Redesign homepage, product listing, category, collection, search, campaign, and editorial routes. Establish a single product-card contract, coherent image ratios, filter/sort behavior, result states, and editorial section rhythm.

### Phase D — Product and purchase

Redesign product detail, quick view, cart, checkout, login, account order history, and order detail. Keep the existing API client and state behavior, but move presentation into feature components with consistent form, summary, trust, and error patterns.

### Phase E — Quality

Run lint, unit tests, design-system generation checks, architecture audits, accessibility checks, responsive route matrix, visual Playwright tests, and production builds. No redesign slice is complete until its behavior and visual regression gates pass.

## Success criteria

The redesign is complete when the storefront has one token source, one shared primitive contract, no missing button variants, no duplicate shared primitive declarations, consistent page containers and section rhythm, stable typography roles, responsive layout parity across required routes, accessible interaction states, and passing existing commerce/API/E2E tests.

## Non-goals

This work does not change product data, pricing, checkout calculations, authentication, payment provider behavior, route URLs, API response contracts, or backend business rules. New imagery or copy is introduced only where approved as a presentation asset and must not replace real product data.
