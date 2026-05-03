const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { requireCompleteProfile } = require('../middleware/profileCompleteCheck');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');
const { computeAudienceBrandFitScore } = require('../services/metricsService');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('brand', 'admin'));

function buildRateFilter(maxRate) {
    const value = Number(maxRate);
    if (!Number.isFinite(value)) return null;
    return {
        $or: [
            { 'rates.storyPrice': { $lte: value } },
            { 'rates.reelPrice': { $lte: value } },
            { 'rates.postPrice': { $lte: value } },
            { avgPostPrice: { $lte: value } },
            { avgReelPrice: { $lte: value } },
        ],
    };
}

router.get('/influencers', requireCompleteProfile, async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
        // Show all influencer profiles — synced ones surface first via sort
        const filter = {};

        if (req.query.niche) filter.niche = { $in: String(req.query.niche).split(',').map((n) => n.trim()).filter(Boolean) };
        if (req.query.tier) filter.followerTier = req.query.tier;
        if (req.query.country) filter.country = new RegExp(String(req.query.country), 'i');
        if (req.query.minER) filter.avgEngagementRate = { $gte: Number(req.query.minER) };
        if (req.query.minScore) {
            const scoreVal = Number(req.query.minScore);
            filter.$or = [
                { porchestScore: { $gte: scoreVal } },
                { influencerScore: { $gte: scoreVal } },
            ];
        }
        if (req.query.search) {
            const search = new RegExp(String(req.query.search), 'i');
            filter.$or = [{ igUsername: search }, { displayName: search }, { fullName: search }];
        }

        const rateFilter = buildRateFilter(req.query.maxRate);
        const query = rateFilter ? { $and: [filter, rateFilter] } : filter;

        const [influencers, total] = await Promise.all([
            InfluencerProfile.find(query)
                .sort({ porchestScore: -1, influencerScore: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            InfluencerProfile.countDocuments(query),
        ]);

        return res.json({
            influencers,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/influencers/:influencerId', requireCompleteProfile, async (req, res) => {
    try {
        const influencer = await InfluencerProfile.findById(req.params.influencerId).lean()
            || await InfluencerProfile.findOne({ userId: req.params.influencerId }).lean();
        if (!influencer) return res.status(404).json({ success: false, error: 'Influencer not found' });

        const brandProfile = await BrandProfile.findOne({ userId: req.user._id }).select('targetAudience').lean();
        const audienceBrandFitScore = computeAudienceBrandFitScore(
            influencer.audienceDemographics || influencer.audience || {},
            brandProfile?.targetAudience || {}
        );

        return res.json({ ...influencer, audienceBrandFitScore });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
