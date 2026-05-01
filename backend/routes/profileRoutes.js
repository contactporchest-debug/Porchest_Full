const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');
const { generateUniqueCode } = require('../utils/generateCode');

const router = express.Router();

function numberOrUndefined(value) {
    if (value === '' || value == null) return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
}

router.get('/influencer/me', authMiddleware, roleMiddleware('influencer'), async (req, res) => {
    try {
        const profile = await InfluencerProfile.findOne({ userId: req.user._id }).lean();
        if (!profile) return res.status(404).json({ success: false, error: 'Influencer profile not found' });
        return res.json(profile);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/influencer', authMiddleware, roleMiddleware('influencer'), async (req, res) => {
    try {
        const rates = req.body?.rates || {};
        const update = {
            displayName: req.body.displayName,
            bio: req.body.bio,
            niche: Array.isArray(req.body.niche) ? req.body.niche : [],
            country: req.body.country,
            city: req.body.city,
            contactEmail: req.body.contactEmail,
            languages: Array.isArray(req.body.languages) ? req.body.languages : [],
            contentStyleTags: Array.isArray(req.body.contentStyleTags) ? req.body.contentStyleTags : [],
            rates: {
                storyPrice: numberOrUndefined(rates.storyPrice),
                reelPrice: numberOrUndefined(rates.reelPrice),
                postPrice: numberOrUndefined(rates.postPrice),
            },
            avgReelPrice: numberOrUndefined(rates.reelPrice),
            avgPostPrice: numberOrUndefined(rates.postPrice),
            profileComplete: true,
            profileCompletionStatus: true,
        };

        let profile = await InfluencerProfile.findOne({ userId: req.user._id });
        if (!profile) {
            profile = await InfluencerProfile.create({
                userId: req.user._id,
                influencerProfileId: await generateUniqueCode('INF', InfluencerProfile, 'influencerProfileId'),
                fullName: req.user.fullName || req.user.email?.split('@')[0] || 'Influencer',
                displayName: update.displayName || req.user.fullName || req.user.email?.split('@')[0] || 'Influencer',
            });
        }

        const updated = await InfluencerProfile.findOneAndUpdate(
            { userId: req.user._id },
            { $set: update },
            { new: true, upsert: true, strict: false }
        ).lean();

        return res.json(updated);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/brand/me', authMiddleware, roleMiddleware('brand'), async (req, res) => {
    try {
        const profile = await BrandProfile.findOne({ userId: req.user._id }).lean();
        if (!profile) return res.status(404).json({ success: false, error: 'Brand profile not found' });
        return res.json(profile);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/brand', authMiddleware, roleMiddleware('brand'), async (req, res) => {
    try {
        let profile = await BrandProfile.findOne({ userId: req.user._id });
        if (!profile) {
            profile = await BrandProfile.create({
                userId: req.user._id,
                brandProfileId: await generateUniqueCode('BRD', BrandProfile, 'brandProfileId'),
                businessName: req.body.businessName || req.user.companyName || req.user.email?.split('@')[0] || 'Brand',
                brandName: req.body.businessName || req.user.companyName || req.user.email?.split('@')[0] || 'Brand',
            });
        }

        const update = {
            businessName: req.body.businessName,
            brandName: req.body.businessName,
            industry: req.body.industry,
            website: req.body.website,
            bio: req.body.description,
            description: req.body.description,
            budgetRange: req.body.budgetRange || {},
            targetAudience: req.body.targetAudience || {},
            profileComplete: true,
        };

        const updated = await BrandProfile.findOneAndUpdate(
            { userId: req.user._id },
            { $set: update },
            { new: true, upsert: true, strict: false }
        ).lean();

        return res.json(updated);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
