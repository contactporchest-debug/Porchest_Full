const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { requireCompleteProfile } = require('../middleware/profileCompleteCheck');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');
const { computeAudienceBrandFitScore } = require('../services/metricsService');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('brand', 'admin'));

function isInfluencerDiscoverable(profile) {
    if (!profile) return false;

    const igConnected = profile.instagramConnected || profile.instagramConnectionStatus === 'connected';
    const profileComplete = Boolean(profile.profileComplete || profile.profileCompletionStatus || profile.isSearchable)
        || Boolean(profile.fullName || profile.displayName);

    return Boolean(igConnected && profileComplete);
}

router.get('/influencers', requireCompleteProfile, async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
        // Show only complete profiles with connected Instagram accounts
        const filter = {
            $and: [
                {
                    $or: [
                        { profileCompletionStatus: true },
                        { profileComplete: true },
                    ],
                },
                {
                    $or: [
                        { instagramConnected: true },
                        { instagramConnectionStatus: 'connected' },
                    ],
                },
            ],
        };

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

        const [influencers, total] = await Promise.all([
            InfluencerProfile.find(filter)
                .sort({ porchestScore: -1, influencerScore: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            InfluencerProfile.countDocuments(filter),
        ]);

        const visibleInfluencers = influencers.filter(isInfluencerDiscoverable);

        return res.json({
            influencers: visibleInfluencers,
            total: visibleInfluencers.length,
            page,
            pages: Math.ceil(visibleInfluencers.length / limit),
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
