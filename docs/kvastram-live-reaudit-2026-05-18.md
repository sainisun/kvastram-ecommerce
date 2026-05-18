# Kvastram Live Re-Audit

Date: 2026-05-18
Audited URL: https://kvastram.com/
GitHub latest: `583cee1 Complete storefront design audit fixes`
Live VPS deployed commit: `ec946e8 Fix storefront conversion blockers`

## Executive Result

The codebase fixes for P0, P1, and P2 are pushed to GitHub, but the live VPS is still running the older `ec946e8` build. This means the live storefront currently has the P0 batch only; the P1/P2 homepage redesign and cleanup are not live yet.

## Deployment Status

- GitHub `main`: `583cee1`
- VPS `/root/kvastram-ecommerce`: `ec946e8`
- Storefront container: `kvastram-storefront-1`, healthy
- Verdict: live site needs pull/rebuild/restart to deploy the latest fixes.

## Live Re-Audit Matrix

| Area | Live Status | Evidence |
| --- | --- | --- |
| P0 cart product handle links | Pass | Injected cart item linked to `/products/test-jacket`. |
| P0 search results route | Partial | Direct `/search?q=jacket` works, but desktop search button did not reveal a usable search input in the live browser smoke. |
| P0 checkout totals | Pass | Checkout showed consistent currency totals and did not show `$2,000`. |
| P0 checkout gift fee label | Pass after deploy | Final live smoke showed a currency-consistent gift wrapping fee. |
| P1 conversion hero CTA | Fail on live | Live homepage does not show latest `Shop New Arrivals` hero CTA. |
| P1 trust bar | Fail on live | Live homepage does not show the latest `Secure checkout` + `Handmade craft` trust bar. |
| P1 public fallback copy cleanup | Fail on live | Live homepage still contains `Use this design language` and `popup frequency`. |
| P2 old deployment drift | Fail on live | VPS is still behind latest GitHub commit. |

## Live Functionality Notes

- Routes returning 200: `/`, `/search?q=jacket`, `/checkout`, `/products`.
- Recent storefront logs still show `getProduct failed` errors for product fetches, likely from stale/broken product URL attempts or unavailable product handles.
- Desktop search interaction needs another verification after deploying `583cee1`, because the latest code aligns desktop search to `/search?q=...`.

## Post-Fix Status

Completed after this re-audit:

- VPS was pulled from `ec946e8` to `583cee1`, then to `6d9d83a`.
- Storefront/admin Docker images were rebuilt and restarted.
- Live homepage now shows the P1 conversion hero CTA and trust bar.
- Live homepage no longer exposes placeholder copy such as `Use this design language` or `popup frequency`.
- Desktop search icon now works as a real `/search` link, so it is not dependent on the animated search bar hydration path.
- Live cart item link still resolves to `/products/test-jacket`.
- Live checkout summary is currency-consistent. In the final browser smoke, the test session selected GBP and showed GBP item/total and gift wrapping values, with no `$2,000` mismatch.

Final live smoke:

| Area | Final Status |
| --- | --- |
| Homepage hero CTA | Pass |
| Homepage trust bar | Pass |
| Public placeholder copy | Pass |
| Search icon link | Pass: `https://kvastram.com/search` |
| Direct search query route | Pass: `https://kvastram.com/search?q=jacket` |
| Cart product handle link | Pass: `/products/test-jacket` |
| Checkout currency consistency | Pass |

## Remaining Notes

- Live is now deployed to the latest audited fix commit.
- Currency display depends on the shopper's detected/selected currency; the final smoke verified consistency, not a forced INR-only display.
- Backend logs should still be monitored for `getProduct failed` events from old or invalid product URLs.
