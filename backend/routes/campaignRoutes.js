const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const BrandProfile = require('../models/BrandProfile');
const CampaignRequest = require('../models/CampaignRequest');
const InfluencerProfile = require('../models/InfluencerProfile');
const { ensureTrackingAssets } = require('../services/trackingService');
const { buildCampaignPerformanceReport } = require('../services/campaignPerformanceService');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('brand'));

async function resolveBrandProfile(req) {
    if (req.user?.brandProfileId) {
        const profile = await BrandProfile.findById(req.user.brandProfileId).select('_id userId').lean();
        if (profile) return profile;
    }

    return BrandProfile.findOne({ userId: req.user._id }).select('_id userId').lean();
}

function normalizeStatus(status) {
    const value = String(status || '').toLowerCase();
    if (['completed', 'deal_closed'].includes(value)) return 'completed';
    if (['accepted', 'brand_approved'].includes(value)) return 'accepted';
    if (['brand_paid_work_can_start', 'campaign_active', 'content_submitted', 'content_approved', 'posted', 'active', 'live_post_submitted'].includes(value)) return 'active';
    return 'requested';
}

function resolveInfluencerName(campaign, influencer) {
    return influencer?.fullName
        || influencer?.displayName
        || influencer?.igUsername
        || influencer?.username
        || campaign?.influencerName
        || campaign?.influencerUsername
        || 'Influencer';
}

function resolveCampaignName(campaign) {
    return campaign?.campaignTitle || campaign?.brief?.campaignObjective || 'Campaign';
}

function resolveDeadline(campaign) {
    return campaign?.campaignEndAt
        || campaign?.campaignEndDate
        || campaign?.timeline?.campaignEndDate
        || campaign?.postingDeadline
        || campaign?.brief?.postingDeadline
        || null;
}

function resolvePrice(campaign) {
    const value = campaign?.pricing?.agreedFee
        ?? campaign?.agreedPrice
        ?? campaign?.agreedFee
        ?? campaign?.pricing?.brandOffer
        ?? campaign?.brandOfferedFee
        ?? 0;
    return Number(value) || 0;
}

function resolveTrackingState(campaign) {
    const enabled = Boolean(campaign?.trackingEnabledForCampaign);
    const accepted = Boolean(campaign?.trackingAcceptedByInfluencer);
    const link = campaign?.brief?.trackingLink || null;
    const visible = enabled && accepted && link;
    return {
        trackingEnabledForCampaign: enabled,
        trackingAcceptedByInfluencer: accepted,
        trackingLinkGenerated: Boolean(link),
        trackingLink: visible ? link : null,
        promoCode: visible ? (campaign?.brief?.promoCode || null) : null,
        trackingDetails: campaign?.trackingDetails || {},
    };
}

router.get('/:campaignId/tracking-link', async (req, res) => {
    try {
        const brandProfile = await resolveBrandProfile(req);
        if (!brandProfile) {
            return res.status(404).json({ success: false, error: 'Brand profile not found' });
        }

        const campaignId = req.params.campaignId;
        const existing = await CampaignRequest.findOne({ _id: campaignId, brandId: brandProfile._id })
            .select('_id brandId influencerId campaignTitle brief pricing agreedPrice agreedFee brandOfferedFee campaignEndAt campaignEndDate timeline postingDeadline status trackingEnabledForCampaign trackingAcceptedByInfluencer trackingDetails')
            .lean();

        if (!existing) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }

        const trackingState = resolveTrackingState(existing);
        let campaign = existing;
        if (!trackingState.trackingLink) {
            if (!trackingState.trackingEnabledForCampaign) {
                return res.status(400).json({ success: false, error: 'Tracking is not enabled for this campaign yet' });
            }
            if (!trackingState.trackingAcceptedByInfluencer) {
                return res.status(400).json({ success: false, error: 'Influencer has not accepted tracking for this campaign yet' });
            }
            const generated = await ensureTrackingAssets(campaignId);
            if (!generated?.success) {
                return res.status(400).json({ success: false, error: generated?.error || 'Unable to generate tracking link' });
            }
            campaign = await CampaignRequest.findOne({ _id: campaignId, brandId: brandProfile._id })
                .select('_id brandId influencerId campaignTitle brief pricing agreedPrice agreedFee brandOfferedFee campaignEndAt campaignEndDate timeline postingDeadline status trackingEnabledForCampaign trackingAcceptedByInfluencer trackingDetails')
                .lean();
            if (!resolveTrackingState(campaign).trackingLink) {
                return res.status(400).json({ success: false, error: 'Tracking link is not ready yet' });
            }
        }

        const influencer = campaign?.influencerId
            ? await InfluencerProfile.findById(campaign.influencerId).select('fullName username igUsername displayName').lean()
            : null;

        return res.json({
            success: true,
            campaignId: String(campaign._id),
            trackingLink: resolveTrackingState(campaign).trackingLink,
            name: resolveCampaignName(campaign),
            influencer: resolveInfluencerName(campaign, influencer),
            price: resolvePrice(campaign),
            deadline: resolveDeadline(campaign),
            status: normalizeStatus(campaign.status),
            ...resolveTrackingState(campaign),
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message || 'Unable to load tracking link' });
    }
});

router.get('/:campaignId/tracking/status', async (req, res) => {
    try {
        const brandProfile = await resolveBrandProfile(req);
        if (!brandProfile) {
            return res.status(404).json({ success: false, error: 'Brand profile not found' });
        }

        const campaign = await CampaignRequest.findOne({ _id: req.params.campaignId, brandId: brandProfile._id })
            .select('_id brief trackingEnabledForCampaign trackingAcceptedByInfluencer trackingDetails')
            .lean();
        if (!campaign) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }

        return res.json({
            success: true,
            campaignId: String(campaign._id),
            ...resolveTrackingState(campaign),
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message || 'Unable to load tracking status' });
    }
});

router.post('/:campaignId/tracking/enable', async (req, res) => {
    try {
        const brandProfile = await resolveBrandProfile(req);
        if (!brandProfile) {
            return res.status(404).json({ success: false, error: 'Brand profile not found' });
        }

        const campaign = await CampaignRequest.findOne({ _id: req.params.campaignId, brandId: brandProfile._id })
            .select('_id brandId influencerId brief trackingEnabledForCampaign trackingAcceptedByInfluencer trackingDetails')
            .lean();
        if (!campaign) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }

        const enable = req.body?.enable !== false;
        const updates = {
            trackingEnabledForCampaign: enable,
            trackingAcceptedByInfluencer: enable ? Boolean(campaign.trackingAcceptedByInfluencer) : false,
            trackingDetails: {
                ...(campaign.trackingDetails || {}),
                enabled: enable,
                platform: req.body?.platform || campaign.trackingDetails?.platform || 'shopify',
                enabledAt: enable ? new Date() : null,
                disabledAt: enable ? null : new Date(),
            },
        };

        if (enable) {
            const generated = await ensureTrackingAssets(campaign._id);
            if (generated?.success === false && generated?.error) {
                return res.status(400).json({ success: false, error: generated.error });
            }
            updates.trackingDetails = {
                ...(updates.trackingDetails || {}),
                trackingLinkGenerated: true,
                promoCodeGenerated: true,
            };
        }

        const updated = await CampaignRequest.findByIdAndUpdate(
            campaign._id,
            { $set: updates },
            { new: true, strict: false }
        ).lean();

        return res.json({
            success: true,
            ...resolveTrackingState(updated),
            campaignId: String(updated._id),
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message || 'Unable to update tracking status' });
    }
});

router.get('/performance', async (req, res) => {
    try {
        const brandProfile = await resolveBrandProfile(req);
        if (!brandProfile) {
            return res.status(404).json({ success: false, error: 'Brand profile not found' });
        }

        const report = await buildCampaignPerformanceReport({ brandProfileId: brandProfile._id });
        return res.json({
            success: true,
            ...report,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message || 'Unable to load campaign performance' });
    }
});

module.exports = router;
