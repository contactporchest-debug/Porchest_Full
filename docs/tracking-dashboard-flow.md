# Tracking Dashboard Flow

## 1. Current Architecture

Porchest remains collaboration-first.

- Collaboration requests live in `CampaignRequest` / `collaboration_requests`.
- Campaign tracking links live in `brief.trackingLink`.
- Promo codes live in `brief.promoCode`.
- Clicks are stored in `ClickEvent` / `click_events`.
- Purchases are stored in `PurchaseEvent` / `purchase_events`.
- Brand tracking setup state is stored in `BrandTrackingConnection`.

The purchase pipeline is shared through `purchaseTrackingService`, so the same processor can handle:

- pixel purchases
- webhook purchases
- Shopify order webhook purchases
- future WooCommerce adapters

## 2. Dashboard Flow

The brand dashboard shows a tracking status card with:

- Campaign Links status
- Sales Tracking status
- Pixel status
- Webhook status
- Platform
- Last event received
- Last verified
- Last error

The card links into:

- tracking setup page
- test campaign opener
- tracking activity page

## 3. Tracking Verification Flow

1. Brand opens the dashboard.
2. Brand clicks `Open Test Campaign`.
3. Porchest opens the latest active collaboration tracking link.
4. Brand completes a test order on the website.
5. Brand returns and clicks `Check Test Status`.
6. Porchest checks the latest `PurchaseEvent` and updates tracking status.
7. The dashboard switches to `Tracking Active` when a valid purchase is matched.

## 4. Status Lifecycle

- `not_started` - tracking has not been set up yet
- `waiting_for_test` - links are ready, but no valid test purchase has been received
- `active` - a valid purchase was matched and verified
- `issue_detected` - a purchase arrived but could not be matched to a campaign
- `disconnected` - tracking was intentionally disconnected

## 5. Troubleshooting States

Common messages:

- `Waiting For Test Order`
- `Tracking Active`
- `Tracking Issue Detected`
- `No Campaign Links Are Available Yet`

Typical causes of an issue:

- the tracking link was not used
- promo code was missing
- attribution token was missing
- the order was outside the campaign window

## 6. Manual QA Process

Use this checklist to verify the tracking stack:

1. Accept or create a collaboration.
2. Confirm `brief.trackingLink` is generated.
3. Open the tracking link.
4. Confirm the redirect contains `pc_attrib`.
5. Confirm `ClickEvent` is created.
6. Place a test order through the pixel route or webhook route.
7. Confirm `PurchaseEvent` is created.
8. Confirm `CampaignRequest.metrics` updates.
9. Confirm the brand dashboard shows `Tracking Active`.
10. Confirm the recent activity page shows the click and purchase.
11. Confirm duplicate `orderId` values do not double count.
12. Confirm `issue_detected` appears when an order cannot be matched.
