const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getInfluencerAnalytics } = require('../services/brandInfluencerAnalyticsService');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('brand', 'admin'));

router.get('/:influencerId/analytics', async (req, res, next) => {
    try {
        const period = Number(req.query.period || 60);
        const result = await getInfluencerAnalytics({
            id: req.params.influencerId,
            period,
        });

        return res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
