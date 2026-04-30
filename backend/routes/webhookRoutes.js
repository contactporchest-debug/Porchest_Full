const express = require('express');
const PurchaseEvent = require('../models/PurchaseEvent');
const CampaignRequest = require('../models/CampaignRequest');

const router = express.Router();

function normalizeSecret(value) {
    return typeof value === 'string' ? value.trim() : '';
}

router.post('/purchase', async (req, res) => {
    try {
        const { promoCode, orderValue, orderId, currency, webhookSecret } = req.body || {};

        if (normalizeSecret(webhookSecret) !== normalizeSecret(process.env.PORCHEST_WEBHOOK_SECRET)) {
            return res.status(401).json({ error: 'Invalid webhook secret' });
        }

        if (!promoCode || !orderValue || !orderId) {
            return res.status(400).json({ error: 'promoCode, orderValue, and orderId are required' });
        }

        if (typeof orderValue !== 'number' || orderValue <= 0) {
            return res.status(400).json({ error: 'orderValue must be a positive number' });
        }

        const collab = await CampaignRequest.findOne({ 'brief.promoCode': promoCode })
            .select('brandId influencerId campaignStartDate campaignEndDate gracePeriodDays agreedFee metrics')
            .lean();

        if (!collab) {
            return res.status(404).json({ error: 'Promo code not found' });
        }

        const now = new Date();
        const graceDays = Number(collab.gracePeriodDays || 3);
        const windowEnd = collab.campaignEndDate ? new Date(new Date(collab.campaignEndDate).getTime() + graceDays * 24 * 60 * 60 * 1000) : null;
        const withinWindow = !windowEnd || now <= windowEnd;

        try {
            await PurchaseEvent.create({
                collaborationId: collab._id,
                influencerId: collab.influencerId,
                brandId: collab.brandId,
                promoCode,
                orderId,
                orderValue,
                currency: currency || 'USD',
                timestamp: now,
                withinWindow,
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(200).json({ success: true, duplicate: true });
            }
            throw error;
        }

        if (withinWindow) {
            const currentRevenue = Number(collab.metrics?.revenue || 0) + orderValue;
            const currentConversions = Number(collab.metrics?.conversions || 0) + 1;
            const agreedFee = Number(collab.agreedFee || 0);
            const roas = agreedFee > 0 ? Number((currentRevenue / agreedFee).toFixed(2)) : 0;
            const cpa = currentConversions > 0 ? Number((agreedFee / currentConversions).toFixed(2)) : 0;

            await CampaignRequest.findByIdAndUpdate(
                collab._id,
                {
                    $inc: {
                        'metrics.conversions': 1,
                        'metrics.revenue': orderValue,
                    },
                    $set: {
                        'metrics.roas': roas,
                        'metrics.cpa': cpa,
                        'metrics.lastUpdatedAt': now,
                    },
                },
                { strict: false, new: true }
            );
        }

        return res.status(200).json({
            success: true,
            withinWindow,
            message: withinWindow
                ? 'Purchase recorded and attributed'
                : 'Purchase recorded but outside campaign window — not counted in metrics',
        });
    } catch (error) {
        console.error('[PurchaseWebhook] Error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/verify', (req, res) => {
    const { webhookSecret } = req.query || {};
    if (normalizeSecret(webhookSecret) !== normalizeSecret(process.env.PORCHEST_WEBHOOK_SECRET)) {
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
