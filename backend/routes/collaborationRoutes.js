const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const CampaignRequest = require('../models/CampaignRequest');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const Notification = require('../models/Notification');
const { generateUniqueCode } = require('../utils/generateCode');
const { ensureTrackingAssets, takeFollowerBaseline } = require('../services/trackingService');
const { syncCollaborationMetrics } = require('../services/syncService');

const router = express.Router();

router.use(authMiddleware);

function isAdmin(user) {
    return ['owner', 'admin-marketing', 'admin-software', 'employee-marketing', 'employee-software', 'admin'].includes(user?.role);
}

function toArray(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

function compact(value) {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));
}

async function getProfilesForUser(user) {
    const [brandProfile, influencerProfile] = await Promise.all([
        BrandProfile.findOne({ userId: user._id }).lean(),
        InfluencerProfile.findOne({ userId: user._id }).lean(),
    ]);
    return { brandProfile, influencerProfile };
}

async function enrichCollaboration(c) {
    const [brandProfile, influencerProfile] = await Promise.all([
        BrandProfile.findById(c.brandId || c.brandProfileId).select('businessName brandName igUsername igProfileUrl logo website targetAudience userId').lean(),
        InfluencerProfile.findById(c.influencerId || c.influencerProfileId).select('displayName fullName igUsername igProfileUrl avatar followerTier niche country userId rates avgPostPrice avgReelPrice porchestScore avgEngagementRate authenticityScore').lean(),
    ]);

    return {
        ...c,
        brandProfile,
        influencerProfile,
        pricing: {
            brandOffer: c.financials?.brandOfferedFee ?? c.brandOfferedFee ?? c.agreedPrice,
            influencerCounter: c.financials?.influencerCounterFee ?? c.influencerCounterFee ?? c.counterOfferPrice,
            agreedFee: c.financials?.agreedFee ?? c.agreedFee ?? c.agreedPrice,
            currency: c.financials?.currency || c.currency || 'USD',
        },
        content: {
            driveLink: c.draftDriveLink,
            driveSubmittedAt: c.draftSubmittedAt,
            brandApprovedDrive: Boolean(c.draftApprovedAt),
            brandApprovedAt: c.draftApprovedAt,
            postLink: c.postLink,
            postSubmittedAt: c.postSubmittedAt,
            adminVerified: c.adminVerifiedPost,
            adminVerifiedAt: c.adminVerifiedAt,
            adminVerifiedBy: c.adminVerifiedByFK,
        },
        timeline: {
            campaignStartDate: c.campaignStartDate,
            campaignEndDate: c.campaignEndDate,
            gracePeriodDays: c.gracePeriodDays,
        },
    };
}

function canAccess(collab, user, brandProfile, influencerProfile) {
    if (isAdmin(user)) return true;
    const brandIds = [collab.brandId, collab.brandProfileId, collab.brandUserId].filter(Boolean).map(String);
    const influencerIds = [collab.influencerId, collab.influencerProfileId, collab.influencerUserId].filter(Boolean).map(String);
    return brandIds.includes(String(user._id))
        || influencerIds.includes(String(user._id))
        || (brandProfile && brandIds.includes(String(brandProfile._id)))
        || (influencerProfile && influencerIds.includes(String(influencerProfile._id)));
}

async function runPostAccept(collaborationId) {
    await ensureTrackingAssets(collaborationId);
    await takeFollowerBaseline(collaborationId);
    return CampaignRequest.findById(collaborationId).lean();
}

router.post('/', roleMiddleware('brand'), async (req, res) => {
    try {
        const brandProfile = await BrandProfile.findOne({ userId: req.user._id }).lean();
        if (!brandProfile) return res.status(400).json({ success: false, error: 'Complete brand profile first' });

        const influencerProfile = await InfluencerProfile.findById(req.body.influencerId).lean()
            || await InfluencerProfile.findOne({ userId: req.body.influencerId }).lean();
        if (!influencerProfile) return res.status(404).json({ success: false, error: 'Influencer not found' });

        const brief = req.body.brief || {};
        const brandOffer = Number(req.body.pricing?.brandOffer || req.body.brandOffer || 0);
        const requestCode = await generateUniqueCode('REQ', CampaignRequest, 'requestCode');

        const created = await CampaignRequest.create({
            requestCode,
            brandId: brandProfile._id,
            influencerId: influencerProfile._id,
            brandProfileId: brandProfile._id,
            influencerProfileId: influencerProfile._id,
            brandUserId: req.user._id,
            influencerUserId: influencerProfile.userId,
            status: 'pending',
            campaignTitle: brief.campaignObjective || 'Collaboration request',
            campaignDescription: brief.productDetails,
            campaignType: brief.campaignObjective,
            brandMessage: brief.brandIntro,
            postingDeadline: brief.postingDeadline ? new Date(brief.postingDeadline) : undefined,
            deliverables: brief.deliverables,
            hashtags: brief.hashtags,
            disclosureRequirements: brief.disclosureRequirements,
            brandName: brandProfile.businessName || brandProfile.brandName,
            influencerName: influencerProfile.displayName || influencerProfile.fullName,
            influencerUsername: influencerProfile.igUsername,
            influencerProfilePic: influencerProfile.igProfileUrl || influencerProfile.avatar,
            influencerNiche: influencerProfile.niche,
            brandOfferedFee: brandOffer,
            agreedPrice: brandOffer,
            financials: {
                brandOfferedFee: brandOffer,
                currency: req.body.pricing?.currency || 'USD',
            },
            brief: compact({
                brandIntro: brief.brandIntro,
                campaignObjective: brief.campaignObjective,
                productDetails: brief.productDetails,
                targetAudience: brief.targetAudience,
                keyMessage: brief.keyMessage,
                contentTypes: toArray(brief.contentType || brief.contentTypes),
                creativeDirection: brief.creativeDirection,
                mandatoryTalkingPoints: toArray(brief.mandatoryPoints || brief.mandatoryTalkingPoints),
                captionGuidelines: brief.captionGuidelines,
                requiredHashtags: toArray(brief.hashtags || brief.requiredHashtags),
                callToAction: brief.callToAction,
                visualRequirements: brief.visualRequirements,
                postingSchedule: brief.postingDeadline ? new Date(brief.postingDeadline) : undefined,
                deliverables: toArray(brief.deliverables),
                disclosureRequired: brief.disclosureRequirements,
            }),
        });

        Notification.create({
            recipientUserId: influencerProfile.userId,
            type: 'collaboration_request',
            title: 'New Collaboration Request',
            message: `${brandProfile.businessName || 'A brand'} sent you a collaboration request.`,
            campaignRequestId: created._id,
        }).catch(() => {});

        return res.status(201).json(await enrichCollaboration(created.toObject()));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const { brandProfile, influencerProfile } = await getProfilesForUser(req.user);
        const filter = {};
        if (req.query.status) filter.status = { $in: String(req.query.status).split(',') };

        if (req.user.role === 'brand') {
            filter.$or = [{ brandId: brandProfile?._id }, { brandProfileId: brandProfile?._id }, { brandUserId: req.user._id }];
        } else if (req.user.role === 'influencer') {
            filter.$or = [{ influencerId: influencerProfile?._id }, { influencerProfileId: influencerProfile?._id }, { influencerUserId: req.user._id }];
        } else if (!isAdmin(req.user)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const collabs = await CampaignRequest.find(filter).sort({ createdAt: -1 }).lean();
        const enriched = await Promise.all(collabs.map(enrichCollaboration));
        return res.json({ collaborations: enriched });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        const profiles = await getProfilesForUser(req.user);
        if (!canAccess(collab, req.user, profiles.brandProfile, profiles.influencerProfile)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        return res.json(await enrichCollaboration(collab));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/accept', roleMiddleware('influencer'), async (req, res) => {
    try {
        const { influencerProfile } = await getProfilesForUser(req.user);
        const collab = await CampaignRequest.findOne({ _id: req.params.id, $or: [{ influencerId: influencerProfile?._id }, { influencerProfileId: influencerProfile?._id }, { influencerUserId: req.user._id }] });
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        const fee = collab.financials?.brandOfferedFee ?? collab.brandOfferedFee ?? collab.agreedPrice ?? 0;
        await CampaignRequest.findByIdAndUpdate(req.params.id, {
            $set: {
                status: 'accepted',
                acceptedAt: new Date(),
                campaignStartDate: new Date(),
                campaignEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                agreedFee: fee,
                agreedPrice: fee,
                'financials.agreedFee': fee,
            },
        }, { strict: false });
        return res.json(await enrichCollaboration(await runPostAccept(req.params.id)));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/counter', roleMiddleware('influencer'), async (req, res) => {
    try {
        const amount = Number(req.body.counterAmount);
        if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, error: 'counterAmount must be positive' });
        const updated = await CampaignRequest.findByIdAndUpdate(req.params.id, {
            $set: {
                status: 'countered',
                counterOfferPrice: amount,
                counterOfferMessage: req.body.message || '',
                'financials.influencerCounterFee': amount,
            },
            $push: { negotiationHistory: { offeredBy: 'influencer', amount, message: req.body.message || '', timestamp: new Date() } },
        }, { new: true, strict: false }).lean();
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/accept-counter', roleMiddleware('brand'), async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        const fee = collab.financials?.influencerCounterFee ?? collab.counterOfferPrice;
        await CampaignRequest.findByIdAndUpdate(req.params.id, {
            $set: {
                status: 'accepted',
                acceptedAt: new Date(),
                campaignStartDate: new Date(),
                campaignEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                agreedFee: fee,
                agreedPrice: fee,
                'financials.agreedFee': fee,
            },
        }, { strict: false });
        return res.json(await enrichCollaboration(await runPostAccept(req.params.id)));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/decline', async (req, res) => {
    try {
        const updated = await CampaignRequest.findByIdAndUpdate(req.params.id, { $set: { status: 'declined', rejectedAt: new Date() } }, { new: true, strict: false }).lean();
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/submit-drive', roleMiddleware('influencer'), async (req, res) => {
    try {
        const updated = await CampaignRequest.findByIdAndUpdate(req.params.id, {
            $set: { status: 'content_submitted', draftDriveLink: req.body.driveLink, draftSubmittedAt: new Date(), 'content.driveLink': req.body.driveLink, 'content.driveSubmittedAt': new Date() },
        }, { new: true, strict: false }).lean();
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/approve-drive', roleMiddleware('brand'), async (req, res) => {
    try {
        const updated = await CampaignRequest.findByIdAndUpdate(req.params.id, {
            $set: { status: 'content_approved', draftApprovedAt: new Date(), 'content.brandApprovedDrive': true, 'content.brandApprovedAt': new Date() },
        }, { new: true, strict: false }).lean();
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/submit-post', roleMiddleware('influencer'), async (req, res) => {
    try {
        await CampaignRequest.findByIdAndUpdate(req.params.id, {
            $set: { status: 'posted', postLink: req.body.postLink, postSubmittedAt: new Date(), 'content.postLink': req.body.postLink, 'content.postSubmittedAt': new Date() },
        }, { strict: false });
        await syncCollaborationMetrics(req.params.id);
        const updated = await CampaignRequest.findById(req.params.id).lean();
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/verify-post', roleMiddleware('admin'), async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        const fee = Number(collab.financials?.agreedFee || collab.agreedFee || collab.agreedPrice || 0);
        const now = new Date();
        const updated = await CampaignRequest.findByIdAndUpdate(req.params.id, {
            $set: {
                status: 'completed',
                adminVerifiedPost: true,
                adminVerifiedAt: now,
                adminVerifiedByFK: req.user._id,
                'payment.tranche1.amount': Number((fee * 0.5).toFixed(2)),
                'payment.tranche1.releasedAt': now,
                'payment.tranche1.status': 'released',
                'payment.tranche2.amount': Number((fee * 0.5).toFixed(2)),
                'payment.tranche2.releasedAt': new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                'payment.tranche2.status': 'pending',
                'payment.status': 'partial',
            },
        }, { new: true, strict: false }).lean();
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
