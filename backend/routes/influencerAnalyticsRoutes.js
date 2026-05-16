const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getInfluencer60DayAnalytics } = require('../services/brandInfluencerAnalyticsService');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('brand', 'admin'));

router.get('/:influencerId/analytics', async (req, res, next) => {
    try {
        const period = Number(req.query.period || 60);
        const result = await getInfluencer60DayAnalytics({
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
