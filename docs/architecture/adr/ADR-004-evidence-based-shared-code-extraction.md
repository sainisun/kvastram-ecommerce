# ADR-004: Extract shared code only after tested cross-application equivalence

**Status:** Accepted  
**Date:** 12 August 2026

## Context

Storefront, admin, and wholesale contain similarly named API, SEO, utility, and media modules. Similar names do not guarantee equivalent behavior. Premature package extraction can spread an incomplete abstraction and slow down feature work.

## Decision

Code is extracted into a shared internal module only when at least two consumers have a documented, behaviorally equivalent contract, focused tests, a named maintainer, and no application-specific environment coupling. The initial candidates are pure SEO, product-display, and media helpers; API clients remain feature-owned until their transport and DTO contracts stabilize.

Existing source files continue to own behavior during evaluation. Shared extraction uses a compatibility adapter, migrates one consumer at a time, and deletes local copies only after zero-import verification.

## Consequences

The team avoids forced reuse and gains small, tested common utilities where they create genuine leverage. The current differing storefront and wholesale SEO modules are treated as a comparison task rather than an immediate deduplication target.

## Rejected alternatives

Creating a broad shared package immediately was rejected because it would mix UI, API, and domain concerns before stable contracts exist. Copying one application’s helper over another was rejected because it risks silent behavior loss.
