# Storefront Visual Art Direction Plan V5

Status: `LOCKED_PENDING_ARCHITECTURE_V4_CERTIFICATION`

V5 is visual work only. It starts from the exact user-approved V4 SHA and cannot modify V4 architecture.

## Architecture freeze guard

At branch creation, record hashes for token source/artifacts, public exports/prop types, cascade order, route schema/registry, exception registry, audits, chrome mode, and architecture certificate. `audit:architecture-freeze` compares V5 to the certified SHA. A protected change sets `BLOCKED_FOR_ARCHITECTURE_REVIEW`.

Allowed: route composition through existing primitives, internal presentation recipes without API/behavior changes, approved CMS copy/media, lab fixtures, visual tests/screenshots, and art-direction docs. V5 cannot add tokens, containers, exceptions, or architecture APIs.

## Visual source of truth and identity

`storefront-visual-art-direction-v1.md` will define distinctive Odhvica editorial luxury, ShopMulmul quality benchmarking without cloning, composition, photography/crops, typography recipes, merchandising, motion, blueprints, mobile adaptation, copy, accessibility, and performance. Identity is monochrome UI, textile-rich imagery, high contrast, low noise, strong editorial hierarchy, and spacious but commerce-efficient composition.

## Mandatory approval stages

1. Moodboard and competitor benchmark.
2. Photography contact sheet.
3. Homepage desktop `1440px`.
4. Homepage mobile `375px`.
5. Catalog template.
6. PDP template.
7. Cart/checkout template.
8. Remaining route families.
9. Full screenshot matrix.

If homepage direction is rejected, later route work does not begin.

## Asset contract

Hero desktop ≥`1920×1080`; hero mobile ≥`1080×1350`; product/collection `4:5` ≥`1600×2000`; category `1:1` ≥`800×800`; social `1:1` ≥`1080×1080`; reels `9:16` ≥`1080×1920`. No baked copy/price/CTA, stretching, unrelated duplication, or inaccurate product color. Every slot has crop/focal-point verification and an approved placeholder. Existing CMS payload is snapshotted; assets upload inactive; manifest/contact sheet require approval; activation follows final deployment only.

## Page direction

Homepage retains compact categories, full-bleed hero, editorial categories, asymmetric curation, best sellers, new arrivals, Watch & Buy, brand story, social, and newsletter/footer. One focal point per viewport, alternating commerce/editorial density, one heading recipe, full desktop rails, next-card mobile affordance, no admin text, empty sections render nothing, and no invented container/heading.

Discovery shares page header, filters/sort, card geometry, four-column desktop grid, pricing/badges/hover/wishlist. PDP is image-led `60/40`, stable gallery, sticky buy box, clear purchase hierarchy. Cart/wishlist/checkout share product rows/totals/actions; checkout stays chrome-free. Auth/account share a narrow form shell. Reels remain immersive without an independent design language. Wholesale keeps dedicated chrome with shared typography, controls, surfaces, and accessibility.

Typography roles/tokens cannot change: one H1, two-line hero/card limits, sentence-case body, short verb-led CTAs, controlled metadata uppercase, purposeful italics only. Motion uses V4 tokens: feedback `150–220ms`, drawers `220–320ms`, editorial media ≤`600ms`, no layout shift, reduced-motion support, and pause/play for autoplay.

## Quality, testing, and certificate

Odhvica and a dated ShopMulmul capture are scored 1–10 for distinctiveness, hierarchy, photography, typography, composition, merchandising, mobile, polish, conversion, accessibility/performance. Odhvica must score ≥9 in every category and higher in aggregate without sacrificing accessibility/performance; user approval decides acceptance.

Test `375/768/1024/1440` across populated/empty/loading/error/missing media/long copy, auth states, cart states, sale/wholesale/multi-currency. Require ≤`0.1%` approved screenshot drift, green freeze audit, unchanged roles, WCAG AA, ≥`44×44`, LCP ≤`2.5s`, CLS ≤`0.1`, INP ≤`200ms`, no overflow/unexpected console/network failures, and keyboard/reduced-motion.

The visual certificate records V4 base SHA, freeze hashes, V5 SHA, benchmark date, asset manifest, CMS rollback snapshot, lab/route screenshots, accessibility/performance and console/network results, plus user approval status.

## State machine and release lock

Allowed states: `ARCHITECTURE_V4_PENDING`, `ARCHITECTURE_V4_IN_PROGRESS`, `ARCHITECTURE_V4_AWAITING_USER_APPROVAL`, `ARCHITECTURE_V4_CERTIFIED`, `VISUAL_V5_IN_PROGRESS`, `VISUAL_V5_AWAITING_USER_APPROVAL`, `READY_FOR_FINAL_DEPLOYMENT`, `DEPLOYED_AND_VERIFIED`.

No V5 before certification; no protected edits, hidden baseline updates, feature removal, main push before approvals, manual VPS deployment, or agent self-approval. After both approvals merge once to main, GitHub Actions deploys, `/health` SHA is verified, approved CMS assets activate, and live visual/network/performance checks run. Mismatch restores CMS snapshot and reverts through GitHub.

Only `DEPLOYED_AND_VERIFIED` permits: “Storefront Architecture V4 and Visual Art Direction V5 are certified, user-approved, deployed, and live-verified.”
