const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { requireCompleteProfile } = require('../middleware/profileCompleteCheck');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');
const { computeAudienceBrandFitScore } = require('../services/metricsService');
const { buildInfluencerProfileChecklist } = require('../utils/influencerProfileCompletion');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('brand', 'admin'));

function isInfluencerDiscoverable(profile) {
    if (!profile) return false;

    const igConnected = profile.instagramConnected || profile.instagramConnectionStatus === 'connected';
    const profileComplete = buildInfluencerProfileChecklist(profile).isComplete;

    return Boolean(igConnected && profileComplete);
}

router.get('/influencers', requireCompleteProfile, async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
        const filter = {};

        if (req.query.niche) filter.niche = { $in: String(req.query.niche).split(',').map((n) => n.trim()).filter(Boolean) };
        if (req.query.search) {
            const search = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [
                { igUsername: search },
                { instagramUsername: search },
                { displayName: search },
                { fullName: search },
                { niche: search },
                { country: search },
                { city: search },
                { bio: search },
                { instagramBiography: search },
                { influencerProfileId: search },
            ];
        }

        const influencers = await InfluencerProfile.find(filter)
            .sort({ porchestScore: -1, influencerScore: -1 })
            .lean();
        const visibleInfluencers = influencers.filter(isInfluencerDiscoverable);
        const total = visibleInfluencers.length;
        const pages = Math.ceil(total / limit);
        const paginated = visibleInfluencers.slice((page - 1) * limit, page * limit);

        return res.json({
            influencers: paginated,
            total,
            page,
            pages,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/influencers/:influencerId', requireCompleteProfile, async (req, res) => {
    try {
        const influencer = await InfluencerProfile.findById(req.params.influencerId).lean()
            || await InfluencerProfile.findOne({ userId: req.params.influencerId }).lean();
        if (!influencer || !isInfluencerDiscoverable(influencer)) {
            return res.status(404).json({ success: false, error: 'Influencer not found' });
        }

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
