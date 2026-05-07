# Carrier Integration Execution Plan

Date: 2026-05-07

## Goal

Complete the remaining post-order carrier workflow so Kvastram can move beyond manual label uploads into a real provider-backed shipping flow:

- validate buyer address
- fetch live carrier rates
- purchase/create a shipping label
- store label PDF and tracking details
- print/download label from admin
- void/refund labels when needed
- sync tracking status after shipment

## Current Status

The admin already has the foundation:

- Manual label workflow with label status, URL, file name, cost, currency, package weight, package dimensions, and carrier service.
- PDF label upload flow via `/upload/order-label`.
- Carrier readiness panel for Shiprocket, Delhivery, EasyPost, and Shippo.
- Carrier rate endpoint shape at `/orders/:id/carrier/rates`.
- Tracking save flow through the Complete order modal.
- Fulfillment dashboard metrics and missing-tracking alerts.

Current limitation:

- Carrier service is readiness-only.
- `getRates()` returns no live rates.
- No provider adapter exists for rate fetch, label purchase, label PDF retrieval, void/refund, or tracking sync.

## Provider Decision

Start with one provider first.

Recommended first provider: `Shiprocket`

Why:

- Strong India shipping coverage.
- Common for Indian D2C brands.
- Supports courier/service selection, order shipment creation, label generation, and tracking workflows.

Fallback provider: `Delhivery`

Use Delhivery first only if Shiprocket credentials/API access are not available.

Do not wire EasyPost/Shippo first unless the business priority is international multi-carrier shipping.

## Required Environment Variables

For Shiprocket:

- `SHIPROCKET_API_TOKEN`
- or `SHIPROCKET_EMAIL`
- `SHIPROCKET_PASSWORD`

Optional configuration:

- `SHIPROCKET_PICKUP_LOCATION`
- `SHIPROCKET_DEFAULT_LENGTH_CM`
- `SHIPROCKET_DEFAULT_WIDTH_CM`
- `SHIPROCKET_DEFAULT_HEIGHT_CM`
- `SHIPROCKET_DEFAULT_WEIGHT_GRAMS`

For Delhivery fallback:

- `DELHIVERY_API_TOKEN`
- `DELHIVERY_PICKUP_LOCATION`

## Data Model Strategy

Start by storing carrier data in `orders.metadata` under workflow metadata. Avoid a database migration unless the workflow becomes too large.

Add metadata fields:

- `carrier_provider`
- `carrier_shipment_id`
- `carrier_order_id`
- `carrier_awb`
- `carrier_rate_id`
- `carrier_service`
- `carrier_label_url`
- `carrier_label_public_id`
- `carrier_label_created_at`
- `carrier_label_voided_at`
- `carrier_refund_status`
- `carrier_tracking_status`
- `carrier_tracking_synced_at`
- `carrier_last_error`

Reuse existing label fields where possible:

- `label_status`
- `label_url`
- `label_file_name`
- `label_cost`
- `label_currency`
- `package_weight_grams`
- `package_length_cm`
- `package_width_cm`
- `package_height_cm`
- `carrier_service`

## Backend Architecture

Create provider adapter interface:

```ts
interface CarrierAdapter {
  provider: CarrierProvider;
  validateAddress(order: CarrierOrder): CarrierAddressValidation;
  getRates(order: CarrierOrder): Promise<CarrierRate[]>;
  purchaseLabel(order: CarrierOrder, rateId: string): Promise<CarrierLabelPurchase>;
  voidLabel(order: CarrierOrder): Promise<CarrierVoidResult>;
  syncTracking(order: CarrierOrder): Promise<CarrierTrackingResult>;
}
```

Add files:

- `backend/src/services/carriers/types.ts`
- `backend/src/services/carriers/shiprocket-adapter.ts`
- `backend/src/services/carriers/delhivery-adapter.ts`
- `backend/src/services/carriers/index.ts`

Refactor:

- Keep `backend/src/services/carrier-service.ts` as the public service layer.
- Move provider-specific HTTP calls into adapter files.
- Keep readiness logic in `carrier-service.ts`, but delegate live actions to adapters.

## Backend API Endpoints

Existing:

- `GET /orders/:id/carrier/readiness`
- `POST /orders/:id/carrier/rates`

Add:

- `POST /orders/:id/carrier/label`
  - body: `{ provider, rate_id }`
  - creates shipment/label
  - saves label URL, tracking number/AWB, provider IDs, label status

- `POST /orders/:id/carrier/void`
  - voids or cancels label/shipment where provider supports it
  - sets label status to `voided`

- `POST /orders/:id/carrier/refund`
  - starts refund where supported
  - stores refund status

- `POST /orders/:id/carrier/tracking-sync`
  - fetches latest tracking status
  - updates carrier tracking metadata
  - optionally moves order to delivered when carrier confirms delivery

## Admin UI Plan

Update order detail Carrier integration panel:

- Provider selector: Shiprocket, Delhivery, EasyPost, Shippo.
- Rate list with courier/service name, cost, ETA, COD/prepaid support if available.
- `Buy label` button per rate.
- Label purchase loading/error states.
- Label purchase success summary:
  - carrier
  - AWB/tracking number
  - service
  - cost
  - label link
- `Void label` button when label is created/printed and provider supports void.
- `Sync tracking` button for shipped orders.

Update fulfillment dashboard:

- Add alert for `carrier_label_error`.
- Add alert for `label_created_missing_tracking` if provider creates label but no tracking is saved.

## Phase Breakdown

### Phase 1: Adapter Contracts And Metadata

- Add carrier adapter types.
- Add normalized result types for rates, label purchase, void, refund, and tracking sync.
- Extend workflow metadata parsing/merging for provider fields.
- Add backend tests for metadata hydration.

Acceptance:

- Backend build passes.
- Existing manual label workflow still works.
- Metadata persists and reloads in order workflow summary.

### Phase 2: Shiprocket Readiness And Auth

- Implement Shiprocket auth/client helper.
- Support token-based auth first.
- Support email/password token fetch if token is absent.
- Keep failures non-fatal and return actionable admin messages.

Acceptance:

- Missing credentials show clear readiness error.
- Valid credentials allow adapter initialization.
- No secrets leak into API responses.

### Phase 3: Live Rate Fetch

- Implement Shiprocket rate fetch.
- Map package dimensions, weight, pickup location, destination pincode, and order value.
- Return normalized rates to admin.
- Keep manual label fallback visible.

Acceptance:

- `POST /orders/:id/carrier/rates` returns real rates when credentials/address/package are valid.
- Invalid address/package returns validation issues.
- Admin shows returned rates.

### Phase 4: Label Purchase

- Add `POST /orders/:id/carrier/label`.
- Create provider shipment/order.
- Purchase or generate label.
- Save AWB/tracking number, carrier service, cost, label URL, provider IDs, and label status.
- Update order tracking fields when provider returns tracking.

Acceptance:

- Admin can buy label from a rate.
- Order detail reload shows label link and tracking number.
- Fulfillment dashboard no longer counts that order as missing tracking.

### Phase 5: Label Void And Refund

- Add void/cancel endpoint.
- Add refund initiation endpoint only if provider supports it.
- Save void/refund timestamps and statuses.
- Prevent void after delivered unless provider allows it.

Acceptance:

- Admin can void eligible labels.
- Label state changes to `voided`.
- Errors are shown clearly without corrupting existing label metadata.

### Phase 6: Tracking Sync

- Add tracking sync endpoint.
- Pull latest carrier status by AWB/tracking number.
- Save normalized tracking state.
- If delivered, optionally update workflow/order status to `delivered`.

Acceptance:

- Admin can manually sync tracking from order detail.
- Tracking status persists in workflow metadata.
- Delivered tracking can update order status.

### Phase 7: Automation

- Add scheduled tracking sync for shipped orders with provider metadata.
- Add retry/backoff for transient carrier API failures.
- Add dashboard alert for repeated sync failures.

Acceptance:

- Shipped carrier labels are synced automatically.
- Failed syncs are visible in admin metrics.
- Manual sync still works.

## Testing Plan

Backend unit tests:

- adapter result normalization
- readiness with missing credentials
- metadata merge/hydration
- rate fetch failure handling
- label purchase response mapping
- tracking sync response mapping

Backend integration tests with mocked provider:

- `POST /orders/:id/carrier/rates`
- `POST /orders/:id/carrier/label`
- `POST /orders/:id/carrier/void`
- `POST /orders/:id/carrier/tracking-sync`

Admin verification:

- order detail carrier panel loads
- rates render
- buy label button updates label/tracking
- void button updates label state
- sync tracking updates status
- manual label upload still works

Deployment verification:

- backend health
- admin health
- admin bundle markers:
  - `Buy label`
  - `Sync tracking`
  - `Void label`
  - `carrier_label_error`
- protected endpoints reject unauthenticated requests

## Error Handling Rules

- Never overwrite an existing manual label unless admin confirms label purchase.
- Never clear tracking number on provider error.
- Store provider errors in `carrier_last_error`.
- Show admin-friendly messages, not raw provider stack traces.
- Do not expose API tokens or provider secrets in readiness responses.

## Security Notes

- Carrier endpoints must stay behind admin/MCP auth.
- Label URLs should be stored only after provider or Cloudinary upload succeeds.
- PDF label upload must remain PDF-only.
- Provider webhooks, if added later, need signature verification.

## Remaining Business Decision

Before Phase 2 implementation, confirm:

- first provider: Shiprocket or Delhivery
- pickup location name/code
- default package dimensions and weight
- whether orders are prepaid only or COD is needed later
- whether automatic delivered-status updates are allowed

## Recommended Next Execution

Start with:

1. Shiprocket adapter contracts and metadata.
2. Shiprocket auth/readiness.
3. Live rate fetch.
4. Label purchase.

Only after this is stable, add void/refund and scheduled tracking sync.
