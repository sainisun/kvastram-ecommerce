# Core Web Vitals Baseline

Date: 2026-05-09

## Targets

| Page type | LCP | CLS | INP |
| --- | --- | --- | --- |
| Homepage | < 2.5s | < 0.1 | < 200ms |
| Product page | < 2.5s | < 0.1 | < 200ms |
| Collection page | < 2.5s | < 0.1 | < 200ms |

## Current Measurement Status

Live Lighthouse measurement still needs to be rerun after the SEO deployment because this environment could not reach `https://kvastram.com` during the audit pass.

Record the production values here after deployment:

| URL | LCP | CLS | INP | Notes |
| --- | --- | --- | --- | --- |
| `https://kvastram.com` | TBD | TBD | TBD | Run Lighthouse mobile preset. |
| `https://kvastram.com/products/rajasthani-block-print-quilted-toiletry-bag-set-of-3-cotton-cosmetic-pouches` | TBD | TBD | TBD | Verify Cloudinary image priority and preconnect. |
| `https://kvastram.com/collections/block-print-dresses` | TBD | TBD | TBD | Verify no layout shift from SEO content blocks. |
