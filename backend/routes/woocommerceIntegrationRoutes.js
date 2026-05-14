const express = require('express');
const crypto = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const BrandProfile = require('../models/BrandProfile');
const BrandTrackingConnection = require('../models/BrandTrackingConnection');
const { processTrackedPurchase, upsertTrackingConnectionStatus } = require('../services/purchaseTrackingService');
const {
    validateWooCommerceCredentials,
    createWooCommerceWebhook,
    verifyWooCommerceWebhook,
    normalizeWooCommerceOrder,
    extractWooCommerceCouponCodes,
    getWooCommerceWebhookSecret,
    normalizeStoreUrl,
} = require('../services/woocommerceIntegrationService');

const router = express.Router();

function normalizeString(value) {
    return value == null ? '' : String(value).trim();
}

function generateTrackingKey() {
    return `WC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

function getDefaultWebhookSecret() {
    return getWooCommerceWebhookSecret();
}

async function resolveBrandProfile(req) {
    if (req.user?.brandProfileId) {
        const profile = await BrandProfile.findById(req.user.brandProfileId).select('_id userId').lean();
        if (profile) return profile;
    }

    return BrandProfile.findOne({ userId: req.user._id }).select('_id userId').lean();
}

async function resolveWooConnectionForBrand(brandId) {
    if (!brandId) return null;
    return BrandTrackingConnection.findOne({ brandId, platform: 'woocommerce' }).lean();
}

async function resolveWooConnectionForWebhook({ storeUrl, webhookSecret }) {
    const normalizedStoreUrl = storeUrl ? normalizeStoreUrl(storeUrl) : null;
    const query = {
        platform: 'woocommerce',
        $or: [],
    };

    if (normalizedStoreUrl) {
        query.$or.push(
            { storeUrl: normalizedStoreUrl },
            { 'metadata.woocommerce.storeUrl': normalizedStoreUrl }
        );
    }

    if (webhookSecret) {
        query.$or.push(
            { webhookSecret },
            { 'metadata.woocommerce.webhookSecret': webhookSecret }
        );
    }

    if (!query.$or.length) return null;
    return BrandTrackingConnection.findOne(query).lean();
}

function trackingRedirectPath() {
    const base = normalizeString(process.env.FRONTEND_URL || process.env.PORCHEST_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
    return `${base}/dashboard/brand/tracking?woocommerce=connected`;
}

router.post('/connect', authMiddleware, roleMiddleware('brand'), async (req, res) => {
    try {
        const brandProfile = await resolveBrandProfile(req);
        if (!brandProfile) {
            return res.status(404).json({ success: false, error: 'Brand profile not found' });
        }

        const storeUrl = normalizeStoreUrl(req.body?.storeUrl);
        const consumerKey = normalizeString(req.body?.consumerKey);
        const consumerSecret = normalizeString(req.body?.consumerSecret);

        if (!consumerKey || !consumerSecret) {
            return res.status(400).json({ success: false, error: 'consumerKey and consumerSecret are required' });
        }

        const validation = await validateWooCommerceCredentials({
            storeUrl,
            consumerKey,
            consumerSecret,
        });

        if (!validation.valid) {
            return res.status(400).json({ success: false, error: 'Unable to validate WooCommerce credentials' });
        }

        const webhookSecret = normalizeString(req.body?.webhookSecret) || getDefaultWebhookSecret();
        const existing = await BrandTrackingConnection.findOne({ brandId: brandProfile._id, platform: 'woocommerce' }).lean();
        const webhook = await createWooCommerceWebhook({
            storeUrl,
            consumerKey,
            consumerSecret,
            webhookSecret,
        });

        const now = new Date();
        const connection = await BrandTrackingConnection.findOneAndUpdate(
            { brandId: brandProfile._id, platform: 'woocommerce' },
            {
                $set: {
                    brandId: brandProfile._id,
                    platform: 'woocommerce',
                    status: 'connected',
                    salesStatus: 'waiting_for_test',
                    linksStatus: 'active',
                    pixelStatus: 'not_installed',
                    webhookStatus: 'configured',
                    storeUrl,
                    trackingKey: existing?.trackingKey || generateTrackingKey(),
                    webhookSecret,
                    lastEventReceivedAt: null,
                    lastVerifiedAt: null,
                    lastError: null,
                    metadata: {
                        ...(existing?.metadata || {}),
                        woocommerce: {
                            ...(existing?.metadata?.woocommerce || {}),
                            storeUrl,
                            consumerKey,
                            // TODO: encrypt WooCommerce consumerSecret before production.
                            consumerSecret,
                            webhookId: webhook.webhookId || webhook.webhook?.id || null,
                            webhookSecret,
                            connectedAt: now,
                            wooVersion: validation.wooVersion || null,
                        },
                    },
                },
                $setOnInsert: {
                    brandId: brandProfile._id,
                    platform: 'woocommerce',
                },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.json({
            success: true,
            connected: true,
            platform: connection.platform,
            storeUrl: connection.storeUrl,
            webhookStatus: connection.webhookStatus,
            salesStatus: connection.salesStatus,
            status: connection.status,
            lastEventReceivedAt: connection.lastEventReceivedAt || null,
            lastVerifiedAt: connection.lastVerifiedAt || null,
            lastError: connection.lastError || null,
            webhook: webhook.webhook || null,
        });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message || 'Unable to connect WooCommerce' });
    }
});

router.get('/status', authMiddleware, roleMiddleware('brand'), async (req, res) => {
    try {
        const brandProfile = await resolveBrandProfile(req);
        if (!brandProfile) {
            return res.status(404).json({ success: false, error: 'Brand profile not found' });
        }

        const connection = await resolveWooConnectionForBrand(brandProfile._id);
        return res.json({
            success: true,
            connected: Boolean(connection && connection.status !== 'disconnected'),
            platform: connection?.platform || 'woocommerce',
            storeUrl: connection?.storeUrl || connection?.metadata?.woocommerce?.storeUrl || null,
            webhookStatus: connection?.webhookStatus || 'not_configured',
            salesStatus: connection?.salesStatus || 'not_started',
            status: connection?.status || 'not_started',
            lastEventReceivedAt: connection?.lastEventReceivedAt || null,
            lastVerifiedAt: connection?.lastVerifiedAt || null,
            lastError: connection?.lastError || null,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message || 'Unable to read WooCommerce status' });
    }
});

router.post('/disconnect', authMiddleware, roleMiddleware('brand'), async (req, res) => {
    try {
        const brandProfile = await resolveBrandProfile(req);
        if (!brandProfile) {
            return res.status(404).json({ success: false, error: 'Brand profile not found' });
        }

        const existing = await BrandTrackingConnection.findOne({ brandId: brandProfile._id, platform: 'woocommerce' }).lean();
        const connection = await BrandTrackingConnection.findOneAndUpdate(
            { brandId: brandProfile._id, platform: 'woocommerce' },
            {
                $set: {
                    status: 'disconnected',
                    salesStatus: 'not_started',
                    webhookStatus: 'not_configured',
                    lastError: null,
                    metadata: {
                        ...(existing?.metadata || {}),
                        woocommerce: {
                            ...(existing?.metadata?.woocommerce || {}),
                            disconnectedAt: new Date(),
                        },
                    },
                },
            },
            { new: true }
        );

        return res.json({
            success: true,
            connected: false,
            connection: connection || null,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message || 'Unable to disconnect WooCommerce' });
    }
});

router.post('/webhooks/orders', async (req, res) => {
    try {
        const rawBody = req.rawBody || req.body || Buffer.from('');
        const signature = req.headers['x-wc-webhook-signature'];
        const source = normalizeString(req.headers['x-wc-webhook-source'] || req.body?.storeUrl || req.body?.store_url);
        const connection = await resolveWooConnectionForWebhook({
            storeUrl: source,
            webhookSecret: normalizeString(req.headers['x-wc-webhook-secret'] || ''),
        });

        if (!connection) {
            console.warn(`[WooCommerceWebhook] No WooCommerce connection found for ${source || 'unknown store'}`);
            return res.status(200).json({
                success: true,
                matched: false,
                duplicate: false,
                withinWindow: false,
                collaborationId: null,
                purchaseEventId: null,
                message: 'WooCommerce webhook received without a matching connection.',
            });
        }

        const webhookSecret = connection?.metadata?.woocommerce?.webhookSecret || connection?.webhookSecret || getDefaultWebhookSecret();
        if (!verifyWooCommerceWebhook({ payload: rawBody, signature, webhookSecret })) {
            return res.status(401).json({ success: false, error: 'Invalid WooCommerce webhook signature' });
        }

        const normalizedOrder = normalizeWooCommerceOrder({
            storeUrl: source || connection?.storeUrl || connection?.metadata?.woocommerce?.storeUrl,
            order: req.body,
        });
        const couponCodes = extractWooCommerceCouponCodes(req.body);
        const brandId = connection?.brandId ? String(connection.brandId) : null;

        const result = await processTrackedPurchase({
            brandId: brandId || undefined,
            promoCode: normalizedOrder.promoCode || couponCodes[0] || undefined,
            orderId: normalizedOrder.orderId,
            orderValue: normalizedOrder.orderValue,
            currency: normalizedOrder.currency,
            source: 'woocommerce',
            metadata: {
                storeUrl: normalizedOrder.storeUrl,
                wooOrderId: normalizedOrder.orderId,
                discountCodes: couponCodes,
                rawOrder: req.body,
            },
        });

        if (brandId) {
            await upsertTrackingConnectionStatus({
                brandId,
                platform: 'woocommerce',
                updates: {
                    status: result.matched && result.withinWindow ? 'active' : 'issue_detected',
                    salesStatus: result.matched && result.withinWindow ? 'active' : 'issue_detected',
                    webhookStatus: 'active',
                    linksStatus: 'active',
                    lastEventReceivedAt: new Date(),
                    lastVerifiedAt: result.matched && result.withinWindow ? new Date() : connection?.lastVerifiedAt,
                    lastError: result.matched && result.withinWindow
                        ? null
                        : 'WooCommerce order received but no matching Porchest campaign promo code was found.',
                    metadata: {
                        ...(connection?.metadata || {}),
                        woocommerce: {
                            ...(connection?.metadata?.woocommerce || {}),
                            storeUrl: normalizedOrder.storeUrl,
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
        console.error('[WooCommerceWebhook] Error:', error.message);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
