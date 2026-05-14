const express = require('express');
const BrandTrackingConnection = require('../models/BrandTrackingConnection');
const { processTrackedPurchase, upsertTrackingConnectionStatus } = require('../services/purchaseTrackingService');
const {
    verifyShopifyWebhookHmac,
    normalizeShopifyOrderPayload,
    extractDiscountCodes,
} = require('../services/shopifyIntegrationService');

const router = express.Router();

function normalizeString(value) {
    return value == null ? '' : String(value).trim();
}

async function findShopifyConnectionByShop(shopDomain) {
    const normalizedShop = normalizeString(shopDomain).toLowerCase();
    if (!normalizedShop) return null;

    return BrandTrackingConnection.findOne({
        platform: 'shopify',
        $or: [
            { storeUrl: normalizedShop },
            { 'metadata.shopify.shopDomain': normalizedShop },
        ],
    }).lean();
}

router.post('/', async (req, res) => {
    try {
        const rawBody = req.rawBody || req.body || Buffer.from('');
        const hmacHeader = req.headers['x-shopify-hmac-sha256'];
        if (!verifyShopifyWebhookHmac({ rawBody, hmacHeader })) {
            return res.status(401).json({ success: false, error: 'Invalid Shopify webhook HMAC' });
        }

        const shopDomain = normalizeString(req.headers['x-shopify-shop-domain'] || req.body?.shop_domain || req.body?.shopDomain).toLowerCase();
        const connection = await findShopifyConnectionByShop(shopDomain);
        const normalizedOrder = normalizeShopifyOrderPayload({
            shop: shopDomain || connection?.metadata?.shopify?.shopDomain || connection?.storeUrl,
            order: req.body,
        });
        const discountCodes = extractDiscountCodes(req.body);

        if (!shopDomain && !connection) {
            return res.status(200).json({
                success: true,
                matched: false,
                duplicate: false,
                withinWindow: false,
                collaborationId: null,
                purchaseEventId: null,
                message: 'Shopify webhook received without a shop domain',
            });
        }

        const result = await processTrackedPurchase({
            brandId: connection?.brandId ? String(connection.brandId) : undefined,
            promoCode: normalizedOrder.promoCode || discountCodes[0] || undefined,
            orderId: normalizedOrder.orderId,
            orderValue: normalizedOrder.orderValue,
            currency: normalizedOrder.currency,
            source: 'shopify',
            metadata: {
                shopDomain: normalizedOrder.shopDomain,
                discountCodes,
                shopifyOrderId: normalizedOrder.orderId,
                rawOrder: req.body,
            },
        });

        if (connection?.brandId) {
            await upsertTrackingConnectionStatus({
                brandId: String(connection.brandId),
                platform: 'shopify',
                updates: {
                    status: result.matched && result.withinWindow ? 'active' : 'issue_detected',
                    salesStatus: result.matched && result.withinWindow ? 'active' : 'issue_detected',
                    webhookStatus: 'active',
                    linksStatus: 'active',
                    lastEventReceivedAt: new Date(),
                    lastVerifiedAt: result.matched && result.withinWindow ? new Date() : connection?.lastVerifiedAt,
                    lastError: result.matched && result.withinWindow
                        ? null
                        : 'Shopify order received but no matching Porchest campaign promo code was found.',
                    metadata: {
                        ...(connection?.metadata || {}),
                        shopify: {
                            ...(connection?.metadata?.shopify || {}),
                            shopDomain: normalizedOrder.shopDomain,
                            webhookTopic: connection?.metadata?.shopify?.webhookTopic || 'orders/paid',
                            lastWebhookAt: new Date(),
                        },
                    },
                },
            });
        }

        return res.status(200).json({
            success: true,
            matched: result.matched,
            duplicate: result.duplicate,
            withinWindow: result.withinWindow,
            collaborationId: result.collaborationId,
            purchaseEventId: result.purchaseEventId,
            message: result.message,
        });
    } catch (error) {
        console.error('[ShopifyWebhookAlias] Error:', error.message);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
