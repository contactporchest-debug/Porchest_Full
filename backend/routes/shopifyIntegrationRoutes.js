const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const BrandProfile = require('../models/BrandProfile');
const BrandTrackingConnection = require('../models/BrandTrackingConnection');
const { processTrackedPurchase, upsertTrackingConnectionStatus } = require('../services/purchaseTrackingService');
const {
    buildShopifyInstallUrl,
    exchangeCodeForAccessToken,
    verifyShopifyOAuthCallback,
    registerShopifyOrderWebhook,
    verifyShopifyWebhookHmac,
    normalizeShopifyOrderPayload,
    extractDiscountCodes,
    signShopifyStateToken,
    verifyShopifyStateToken,
} = require('../services/shopifyIntegrationService');

const router = express.Router();

function normalizeString(value) {
    return value == null ? '' : String(value).trim();
}

async function resolveBrandProfile(req) {
    if (req.user?.brandProfileId) {
        const profile = await BrandProfile.findById(req.user.brandProfileId).select('_id userId').lean();
        if (profile) return profile;
    }

    return BrandProfile.findOne({ userId: req.user._id }).select('_id userId').lean();
}

async function findShopifyConnectionByShop(shopDomain, brandId) {
    const query = {
        platform: 'shopify',
        $or: [
            { storeUrl: shopDomain },
            { 'metadata.shopify.shopDomain': shopDomain },
        ],
    };

    if (brandId) {
        query.brandId = brandId;
    }

    return BrandTrackingConnection.findOne(query).lean();
}

function trackingRedirectPath() {
    const base = normalizeString(process.env.FRONTEND_URL || process.env.PORCHEST_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
    return process.env.SHOPIFY_SUCCESS_REDIRECT || `${base}/dashboard/brand/tracking?shopify=connected`;
}

async function startShopifyInstall(req, res) {
    try {
        const brandProfile = await resolveBrandProfile(req);
        if (!brandProfile) {
            return res.status(404).json({ success: false, error: 'Brand profile not found' });
        }

        const shop = normalizeString(req.body?.shopDomain || req.body?.shop || req.query?.shop);
        const state = signShopifyStateToken({
            brandId: String(brandProfile._id),
        });
        const installUrl = buildShopifyInstallUrl({ shop, state });

        const wantsJson =
            String(req.headers.accept || '').includes('application/json') ||
            String(req.headers['x-requested-with'] || '').toLowerCase() === 'xmlhttprequest';

        if (wantsJson) {
            return res.json({
                success: true,
                installUrl,
                shop,
            });
        }

        return res.redirect(302, installUrl);
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message || 'Unable to start Shopify install' });
    }
}

router.get('/install', authMiddleware, roleMiddleware('brand'), startShopifyInstall);

router.post('/connect', authMiddleware, roleMiddleware('brand'), startShopifyInstall);

router.get('/callback', async (req, res) => {
    try {
        const callback = verifyShopifyOAuthCallback({
            ...req.query,
            __rawQuery: req.originalUrl.includes('?') ? req.originalUrl.split('?').slice(1).join('?') : '',
        });
        const state = verifyShopifyStateToken(callback.state);
        if (!state?.brandId) {
            return res.status(400).send('Invalid Shopify state token');
        }

        const brandProfile = await BrandProfile.findById(state.brandId).select('_id userId').lean();
        if (!brandProfile) {
            return res.status(404).send('Brand profile not found');
        }

        const tokenResponse = await exchangeCodeForAccessToken({
            shop: callback.shop,
            code: callback.code,
        });

        const registration = await registerShopifyOrderWebhook({
            shop: callback.shop,
            accessToken: tokenResponse.access_token,
        });

        const now = new Date();
        const existingConnection = await BrandTrackingConnection.findOne({ brandId: brandProfile._id, platform: 'shopify' }).lean();
        await BrandTrackingConnection.findOneAndUpdate(
            { brandId: brandProfile._id, platform: 'shopify' },
            {
                $set: {
                    brandId: brandProfile._id,
                    platform: 'shopify',
                    status: 'connected',
                    salesStatus: 'waiting_for_test',
                    linksStatus: 'active',
                    pixelStatus: 'not_installed',
                    webhookStatus: 'configured',
                    storeUrl: callback.shop,
                    lastEventReceivedAt: null,
                    lastVerifiedAt: null,
                    lastError: null,
                    metadata: {
                        ...(existingConnection?.metadata || {}),
                        shopify: {
                            ...(existingConnection?.metadata?.shopify || {}),
                            shopDomain: callback.shop,
                            accessToken: tokenResponse.access_token,
                            scopes: tokenResponse.scope || process.env.SHOPIFY_SCOPES || 'read_orders,read_customers',
                            installedAt: now,
                            webhookId: registration?.webhook?.id || null,
                            webhookTopic: registration?.topic || 'orders/paid',
                        },
                    },
                },
                $setOnInsert: {
                    brandId: brandProfile._id,
                    platform: 'shopify',
                },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.redirect(302, trackingRedirectPath());
    } catch (error) {
        console.error('[ShopifyCallback] Error:', error.message);
        return res.status(400).send(error.message || 'Unable to complete Shopify install');
    }
});

router.get('/status', authMiddleware, roleMiddleware('brand'), async (req, res) => {
    try {
        const brandProfile = await resolveBrandProfile(req);
        if (!brandProfile) {
            return res.status(404).json({ success: false, error: 'Brand profile not found' });
        }

        const connection = await BrandTrackingConnection.findOne({ brandId: brandProfile._id, platform: 'shopify' }).lean();
        return res.json({
            success: true,
            connected: Boolean(connection && connection.status !== 'disconnected'),
            connection: connection || null,
            shopDomain: connection?.metadata?.shopify?.shopDomain || connection?.storeUrl || null,
            status: connection?.status || 'not_started',
            salesStatus: connection?.salesStatus || 'not_started',
            webhookStatus: connection?.webhookStatus || 'not_configured',
            pixelStatus: connection?.pixelStatus || 'not_installed',
            lastEventReceivedAt: connection?.lastEventReceivedAt || null,
            lastVerifiedAt: connection?.lastVerifiedAt || null,
            lastError: connection?.lastError || null,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message || 'Unable to read Shopify status' });
    }
});

router.post('/disconnect', authMiddleware, roleMiddleware('brand'), async (req, res) => {
    try {
        const brandProfile = await resolveBrandProfile(req);
        if (!brandProfile) {
            return res.status(404).json({ success: false, error: 'Brand profile not found' });
        }

        const existing = await BrandTrackingConnection.findOne({ brandId: brandProfile._id, platform: 'shopify' }).lean();
        const connection = await BrandTrackingConnection.findOneAndUpdate(
            { brandId: brandProfile._id, platform: 'shopify' },
            {
                $set: {
                    status: 'disconnected',
                    salesStatus: 'not_started',
                    webhookStatus: 'not_configured',
                    pixelStatus: 'not_installed',
                    lastError: null,
                    metadata: {
                        ...(existing?.metadata || {}),
                        shopify: {
                            ...(existing?.metadata?.shopify || {}),
                            disconnectedAt: new Date(),
                        },
                    },
                },
            },
            { new: true, upsert: false }
        );

        return res.json({
            success: true,
            message: 'Shopify disconnected',
            connection: connection || null,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message || 'Unable to disconnect Shopify' });
    }
});

router.post('/webhooks/orders', async (req, res) => {
    try {
        const rawBody = req.rawBody || req.body || Buffer.from('');
        const hmacHeader = req.headers['x-shopify-hmac-sha256'];
        if (!verifyShopifyWebhookHmac({ rawBody, hmacHeader })) {
            return res.status(401).json({ success: false, error: 'Invalid Shopify webhook HMAC' });
        }

        const shopDomain = normalizeString(req.headers['x-shopify-shop-domain'] || req.body?.shop_domain || req.body?.shopDomain);
        const connection = await findShopifyConnectionByShop(shopDomain);
        if (!shopDomain && !connection) {
            console.warn('[ShopifyWebhook] Shopify shop domain missing from webhook payload');
            return res.status(200).json({ success: true, matched: false, duplicate: false, withinWindow: false, collaborationId: null, purchaseEventId: null, message: 'Shopify webhook received without a shop domain' });
        }

        const normalizedOrder = normalizeShopifyOrderPayload({
            shop: shopDomain || connection?.metadata?.shopify?.shopDomain || connection?.storeUrl,
            order: req.body,
        });
        const discountCodes = extractDiscountCodes(req.body);

        const brandId = connection?.brandId ? String(connection.brandId) : null;

        if (!connection) {
            console.warn(`[ShopifyWebhook] No Shopify connection found for ${normalizedOrder.shopDomain}`);
        }

        const result = await processTrackedPurchase({
            brandId: brandId || undefined,
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

        if (brandId) {
            await upsertTrackingConnectionStatus({
                brandId,
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
        console.error('[ShopifyWebhook] Error:', error.message);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
