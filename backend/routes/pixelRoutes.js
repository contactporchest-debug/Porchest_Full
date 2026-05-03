const express = require('express');
const Collaboration = require('../models/Collaboration');
const PurchaseEvent = require('../models/PurchaseEvent');

const router = express.Router();

function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

router.post('/purchase', async (req, res) => {
    try {
        const { cid, iid, orderId, orderValue, currency } = req.body || {};
        const amount = toNumber(orderValue);

        if (!cid || !iid || !orderId || amount == null || amount <= 0) {
            return res.status(400).json({ success: false, error: 'cid, iid, orderId, and orderValue are required' });
        }

        const collab = await Collaboration.findById(cid)
            .select('brandId influencerId campaignStartDate campaignEndDate gracePeriodDays agreedFee metrics status')
            .lean();

        if (!collab) {
            return res.status(404).json({ success: false, error: 'Collaboration not found' });
        }

        if (String(collab.influencerId) !== String(iid)) {
            return res.status(400).json({ success: false, error: 'Influencer mismatch' });
        }

        const now = new Date();
        const campaignStart = collab.campaignStartDate ? new Date(collab.campaignStartDate) : null;
        const campaignEnd = collab.campaignEndDate ? new Date(collab.campaignEndDate) : null;
        const graceDays = Number(collab.gracePeriodDays || 3);
        const windowEnd = campaignEnd ? new Date(campaignEnd.getTime() + graceDays * 24 * 60 * 60 * 1000) : null;
        const withinWindow = Boolean(campaignStart && campaignEnd) && now >= campaignStart && now <= windowEnd;

        try {
            await PurchaseEvent.create({
                collaborationId: collab._id,
                influencerId: collab.influencerId,
                brandId: collab.brandId,
                promoCode: String(collab.brief?.promoCode || `PIXEL-${String(collab._id).slice(-8).toUpperCase()}`),
                orderId,
                orderValue: amount,
                currency: currency || 'USD',
                source: 'pixel',
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
            const currentRevenue = Number(collab.metrics?.revenue || 0) + amount;
            const currentConversions = Number(collab.metrics?.conversions || 0) + 1;
            const agreedFee = Number(collab.agreedFee || 0);
            const roas = agreedFee > 0 ? Number((currentRevenue / agreedFee).toFixed(2)) : 0;
            const cpa = currentConversions > 0 ? Number((agreedFee / currentConversions).toFixed(2)) : 0;

            await Collaboration.findByIdAndUpdate(
                collab._id,
                {
                    $inc: {
                        'metrics.conversions': 1,
                        'metrics.revenue': amount,
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

        return res.json({
            success: true,
            withinWindow,
            message: withinWindow
                ? 'Purchase tracked and attributed'
                : 'Purchase recorded but outside campaign window',
        });
    } catch (error) {
        console.error('[PixelPurchase] Error:', error.message);
        return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
});

module.exports = router;
