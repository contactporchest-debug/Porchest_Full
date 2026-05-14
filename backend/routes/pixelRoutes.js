const express = require('express');
const BrandTrackingConnection = require('../models/BrandTrackingConnection');
const { processTrackedPurchase } = require('../services/purchaseTrackingService');

const router = express.Router();

function normalizeString(value) {
    return value == null ? '' : String(value).trim();
}

router.post('/purchase', async (req, res) => {
    try {
        const body = req.body || {};
        const attributionToken = normalizeString(body.attributionToken || body.pc_attrib);
        const trackingKey = normalizeString(body.trackingKey);

        let brandId = normalizeString(body.brandId);
        if (trackingKey && !brandId) {
            const connection = await BrandTrackingConnection.findOne({ trackingKey }).select('brandId platform').lean();
            if (connection) {
                brandId = String(connection.brandId);
            }
        }

        const result = await processTrackedPurchase({
            brandId: brandId || undefined,
            collaborationId: body.collaborationId || body.cid,
            influencerId: body.influencerId || body.iid,
            promoCode: body.promoCode,
            attributionToken: attributionToken || undefined,
            orderId: body.orderId,
            orderValue: body.orderValue,
            currency: body.currency || 'USD',
            source: 'pixel',
            metadata: body,
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
        console.error('[PixelPurchase] Error:', error.message);
        return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
});

module.exports = router;
