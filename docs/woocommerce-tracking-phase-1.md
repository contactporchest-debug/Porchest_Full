# WooCommerce Tracking Phase 1

## What Phase 1 Supports

WooCommerce Phase 1 is a thin adapter on top of Porchest tracking.

- Connect a WooCommerce store with REST API credentials.
- Validate credentials against WooCommerce.
- Register a WooCommerce order webhook.
- Verify webhook signatures.
- Normalize WooCommerce orders into Porchest purchase data.
- Match purchases using Porchest promo/coupon codes.
- Feed matched purchases into `purchaseTrackingService`.
- Update existing `CampaignRequest.metrics`.
- Reflect WooCommerce connection state in the brand dashboard.

## What Phase 1 Does Not Support

- WordPress plugin packaging
- Storefront attribution scripts
- Browser-side checkout tracking
- Google Tag Manager
- Separate WooCommerce metrics
- Historical order sync
- Multi-store sync

## Required Environment Variables

- `WOOCOMMERCE_WEBHOOK_SECRET`
- `WOOCOMMERCE_APP_NAME`
- `PORCHEST_PUBLIC_API_URL`
- `FRONTEND_URL`

## Setup Flow

1. Brand opens the Porchest tracking setup page.
2. Brand enters:
   - WooCommerce store URL
   - Consumer Key
   - Consumer Secret
3. Porchest validates the store credentials.
4. Porchest creates an order webhook on the WooCommerce store.
5. Porchest stores the connection in `BrandTrackingConnection`.
6. Brand creates or opens a collaboration that contains a promo code.
7. Brand places a test order using that promo code.
8. WooCommerce sends the order webhook to Porchest.
9. Porchest matches the order to the campaign and updates tracking status.

## Webhook Flow

- Webhook endpoint: `/api/integrations/woocommerce/webhooks/orders`
- Verification method: `x-wc-webhook-signature`
- Matching strategy: promo code / coupon code first
- Processing path:
  - normalize order
  - extract coupon codes
  - call `processTrackedPurchase()`
  - update tracking state

## Promo-Code Matching

Phase 1 uses coupon and promo codes as the primary matching signal.

- If a WooCommerce order includes a coupon code that matches a Porchest collaboration promo code, the purchase is matched.
- If no matching promo code exists, Porchest marks the tracking state as `issue_detected`.
- No separate WooCommerce attribution model is introduced in Phase 1.

## Troubleshooting

- `Waiting For Test Order`
  - no valid purchase event has arrived yet
- `Tracking Active`
  - a matching order was received and verified
- `Tracking Issue Detected`
  - an order arrived, but Porchest could not match it to a campaign

Common causes of an issue:

- coupon code missing
- wrong coupon code used
- order outside the campaign window
- store credentials not configured correctly
- webhook not registered on the store

## Manual QA Checklist

1. Create WooCommerce API credentials.
2. Open the Porchest tracking setup page.
3. Connect the WooCommerce store.
4. Confirm `BrandTrackingConnection` was created.
5. Confirm the WooCommerce webhook was created.
6. Create a Porchest collaboration with a promo code.
7. Place a WooCommerce order using that promo code.
8. Confirm the webhook hits Porchest.
9. Confirm `PurchaseEvent` is created.
10. Confirm `CampaignRequest.metrics` updates.
11. Confirm the dashboard status becomes `Active`.
12. Place an order without a promo code.
13. Confirm unmatched or `issue_detected` behavior is handled gracefully.

## Notes

- Keep `consumerSecret` out of frontend responses.
- Encrypt WooCommerce secrets before production if encryption support is added later.
- Keep WooCommerce as an adapter into `purchaseTrackingService`, not a separate tracking system.
