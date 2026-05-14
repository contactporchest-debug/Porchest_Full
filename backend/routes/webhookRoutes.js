const express = require('express');
const BrandTrackingConnection = require('../models/BrandTrackingConnection');
const { processTrackedPurchase } = require('../services/purchaseTrackingService');

const router = express.Router();

function normalizeSecret(value) {
    return typeof value === 'string' ? value.trim() : '';
}

async function resolveConnectionFromTrackingKey(trackingKey, brandId) {
    if (trackingKey) {
        const query = { trackingKey };
        if (brandId) query.brandId = brandId;
        return BrandTrackingConnection.findOne(query).lean();
    }

    if (brandId) {
        return BrandTrackingConnection.findOne({ brandId }).lean();
    }

    return null;
}

router.post('/purchase', async (req, res) => {
    try {
        const { promoCode, orderValue, orderId, currency, webhookSecret, brandId, trackingKey } = req.body || {};
        const normalizedSecret = normalizeSecret(webhookSecret);
        const normalizedBrandId = brandId ? String(brandId).trim() : '';
        const normalizedTrackingKey = trackingKey ? String(trackingKey).trim() : '';

        const connection = await resolveConnectionFromTrackingKey(normalizedTrackingKey, normalizedBrandId);
        const envSecret = normalizeSecret(process.env.PORCHEST_WEBHOOK_SECRET);
        const connectionSecret = normalizeSecret(connection?.webhookSecret);
        const secretMatchesConnection = connectionSecret && normalizedSecret === connectionSecret;
        const secretMatchesEnv = envSecret && normalizedSecret === envSecret;

        if (!normalizedSecret || (!secretMatchesConnection && !secretMatchesEnv)) {
            return res.status(401).json({ error: 'Invalid webhook secret' });
        }

        if (!promoCode || !orderValue || !orderId) {
            return res.status(400).json({ error: 'promoCode, orderValue, and orderId are required' });
        }

        const result = await processTrackedPurchase({
            brandId: normalizedBrandId || connection?.brandId || undefined,
            promoCode,
            orderId,
            orderValue,
            currency: currency || 'USD',
            source: 'webhook',
            metadata: req.body,
        });

        const status = result.success ? 200 : (result.matched ? 200 : 400);
        return res.status(status).json({
            success: result.success,
            matched: result.matched,
            duplicate: result.duplicate,
            withinWindow: result.withinWindow,
            collaborationId: result.collaborationId,
            purchaseEventId: result.purchaseEventId,
            message: result.message,
        });
    } catch (error) {
        console.error('[PurchaseWebhook] Error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/verify', async (req, res) => {
    const { webhookSecret, brandId, trackingKey } = req.query || {};
    const normalizedBrandId = brandId ? String(brandId).trim() : '';
    const normalizedTrackingKey = trackingKey ? String(trackingKey).trim() : '';
    const normalizedSecret = normalizeSecret(webhookSecret);
    const connection = await resolveConnectionFromTrackingKey(normalizedTrackingKey, normalizedBrandId);

    const envSecret = normalizeSecret(process.env.PORCHEST_WEBHOOK_SECRET);
    const connectionSecret = normalizeSecret(connection?.webhookSecret);
    const secretMatchesConnection = connectionSecret && normalizedSecret === connectionSecret;
    const secretMatchesEnv = envSecret && normalizedSecret === envSecret;

    if (!normalizedSecret || (!secretMatchesConnection && !secretMatchesEnv)) {
        return res.status(401).json({ error: 'Invalid webhook secret' });
    }

    return res.status(200).json({ success: true, message: 'Webhook endpoint is reachable' });
});

router.get('/docs', (req, res) => {
    res.json({
        success: true,
        docs: {
            purchaseWebhook: '/api/webhook/purchase',
            verify: '/api/webhook/verify?webhookSecret=...',
        },
    });
});

module.exports = router;
