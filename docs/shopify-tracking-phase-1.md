# Shopify Tracking Phase 1

## What Phase 1 Supports

- Shopify OAuth install flow
- Shopify connection storage in `BrandTrackingConnection`
- Shopify order webhook registration
- Shopify webhook HMAC verification
- Order normalization into the existing Porchest purchase processor
- Promo-code based order matching into `processTrackedPurchase()`
- Brand tracking status updates in the dashboard

## What Phase 1 Does Not Support

- Shopify App Pixel
- Checkout attribution persistence inside Shopify storefronts
- WooCommerce integration
- Full Shopify order line-item attribution beyond promo codes
- Per-order browser session attribution from `pc_attrib`

## Required Environment Variables

- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SHOPIFY_SCOPES`
- `SHOPIFY_APP_URL`
- `SHOPIFY_REDIRECT_URI`

Recommended defaults:

- `SHOPIFY_SCOPES=read_orders,read_customers`

## OAuth Install Flow

1. Brand enters a `*.myshopify.com` domain in the tracking setup UI.
2. Porchest redirects the browser to Shopify OAuth.
3. Shopify approves the app and sends the user back to the callback URL.
4. Porchest verifies the OAuth HMAC and state token.
5. Porchest exchanges the authorization code for an access token.
6. Porchest registers the Shopify order webhook.
7. Porchest stores the connection in `BrandTrackingConnection`.

## Webhook Flow

1. Shopify sends order events to `/api/integrations/shopify/webhooks/orders`.
2. Porchest verifies the `X-Shopify-Hmac-Sha256` header against the raw request body.
3. Porchest normalizes the order payload.
4. Porchest extracts promo/discount codes.
5. Porchest passes the normalized order into `processTrackedPurchase()`.
6. Porchest updates the brand tracking status.

Phase 1 matching is primarily promo-code based.

## Status Lifecycle

- `not_started` - Shopify is not connected yet
- `connected` - OAuth install completed
- `waiting_for_test` - connected, but no matching test order has arrived
- `active` - a matching Shopify order was received
- `issue_detected` - an order was received but no matching Porchest campaign could be found
- `disconnected` - the connection was marked inactive

## Manual QA Checklist

1. Set the Shopify env vars.
2. Start the backend.
3. Open the brand tracking setup page.
4. Enter a valid `myshopify.com` domain.
5. Click `Connect Shopify`.
6. Approve the app install in Shopify.
7. Confirm `BrandTrackingConnection` was created.
8. Confirm the webhook was registered.
9. Create or accept a collaboration with a promo code.
10. Place a Shopify test order using that promo code.
11. Confirm the Shopify webhook reaches the backend.
12. Confirm `PurchaseEvent` is created.
13. Confirm `CampaignRequest.metrics` updates.
14. Confirm the dashboard shows `Tracking Active`.
15. Place an order without a promo code.
16. Confirm the issue is handled gracefully and marked as `issue_detected`.

## Troubleshooting

- If OAuth fails, check `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, and `SHOPIFY_REDIRECT_URI`.
- If webhook verification fails, confirm the raw body capture is enabled and the secret matches.
- If orders are received but not matched, confirm the promo code exists on the collaboration.
- If the dashboard still shows waiting, click `Check Test Status` after placing the order.
