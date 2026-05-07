# Etsy-Style Post-Order Workflow Execution Plan

Date: 2026-05-07

## Goal

Build a post-order workflow for Kvastram that keeps Etsy's operational clarity for sellers while adding a warmer personal-brand experience for buyers.

## Product Direction

Kvastram should not copy Etsy blindly. Etsy is optimized for a marketplace seller managing many orders, labels, tracking, refunds, buyer messages, and service metrics. Kvastram should use the same fulfillment discipline, but the buyer-facing language and workflow should feel boutique, careful, and personal.

## Current Baseline

The admin panel already has:

- Orders list with filters, status updates, export, tracking state, ship-by column, and attention flags.
- Order detail timeline for pending, processing, shipped, and delivered.
- Workflow details for ship-by date, ETA start/end, customer note, and internal note.
- Fulfillment/tracking form for tracking number, carrier, and tracking URL.
- Backend routes for order status, tracking, and workflow metadata.

## Phase 1: Stabilize Current Workflow

- Fix order detail API so workflow metadata persists and reloads correctly.
- Select `metadata`, `payment_status`, and `fulfillment_status` in single-order reads.
- Restrict admin status dropdowns to valid workflow transitions.
- Normalize empty workflow form values before saving.
- Refresh order detail from the server after workflow and tracking updates.
- Keep list, detail, and stats aligned on normalized workflow status.

## Phase 2: Fulfillment Workspace

- Add a focused `Fulfillment` view under Orders or as a sidebar item.
- Add tabs: `New`, `Due Today`, `Ready to Ship`, `In Transit`, `Delivered`, `Issues`.
- Show order number, buyer, item summary, ship-by date, tracking state, and primary next action.
- Add attention filters: overdue, missing tracking, delayed, address issue.

## Phase 3: Complete Order Modal

- Add `Complete order` as the primary action for processing orders.
- Modal fields:
  - Ship date
  - Carrier/provider
  - Tracking number
  - Tracking URL
  - Note to buyer
  - Internal note
  - Notify buyer toggle
- On submit:
  - Save tracking
  - Mark status as shipped
  - Add timeline event
  - Send buyer notification when enabled

## Phase 4: Manual Label Workflow

- Add `Create label` / `Upload label` workflow.
- Start with manual label mode before carrier integration:
  - Upload label PDF
  - Enter label cost
  - Enter package weight and dimensions
  - Store carrier/service
  - Print/download label from admin
- Add label states: draft, created, printed, voided, refunded.

## Phase 5: Carrier Integration

- Evaluate carrier/provider options for India and international shipping:
  - Shiprocket
  - Delhivery
  - India Post integrations if available
  - Shippo or EasyPost for multi-carrier labels
- Add rate fetch, label purchase, label PDF storage, tracking sync, and label refund/void flow.
- Validate buyer address before label purchase.

## Phase 6: Buyer Communication

- Add message templates:
  - Order received
  - Processing started
  - Packed with care
  - Shipped
  - Delayed
  - Delivered
  - Review request
  - Return/refund update
- Separate buyer note and internal note clearly.
- Add communication timeline to order detail.
- Add `Send update` action from order detail.

## Phase 7: Personal Brand Experience

- Add packaging checklist:
  - Product quality checked
  - Size/color verified
  - Care card included
  - Thank-you note included
  - Gift wrap applied
  - Invoice included or hidden
- Add buyer-facing copy that feels personal, not robotic.
- Add delivery follow-up with care instructions, support contact, and review request.
- Segment post-order follow-up for first-time, repeat, high-value, and gift buyers.

## Phase 8: Metrics And Automation

- Add fulfillment dashboard counters:
  - Due today
  - Overdue
  - Missing tracking
  - Delivered awaiting follow-up
  - Delayed orders
- Add metrics:
  - On-time shipping percentage
  - Average processing time
  - Tracking coverage
  - Issue/refund rate
  - Repeat purchase after delivery follow-up
- Add alerts for ship-by due soon, missed ship-by, and missing tracking after shipment.

## Acceptance Criteria

- Admin can move an order through the workflow without invalid transitions.
- Workflow dates and notes persist after page reload.
- Admin can complete an order with ship date, carrier, tracking, and buyer note.
- Buyer receives a clear shipped notification when enabled.
- Admin can upload or generate a label and later print/download it.
- Fulfillment workspace makes overdue and missing-tracking orders obvious.
- Post-delivery follow-up can be sent from the order timeline.
