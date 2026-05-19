const express = require('express');
const router = express.Router();
const influencerController = require('../controllers/influencerController');
const financeController = require('../controllers/influencerFinanceController');
const instagramController = require('../controllers/instagramController');
const campaignRequestController = require('../controllers/campaignRequestController');
const notificationController = require('../controllers/notificationController');
const CampaignRequest = require('../models/CampaignRequest');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const { getInfluencerAnalytics } = require('../services/brandInfluencerAnalyticsService');
const { buildInfluencerPerformanceReport } = require('../services/influencerPerformanceService');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public callback — handles redirect from Meta/Facebook
router.get('/instagram/callback', instagramController.handleCallback);

router.use(authMiddleware, roleMiddleware('influencer'));

// Profile
router.get('/dashboard', influencerController.getDashboard);
router.get('/profile', influencerController.getProfile);
router.put('/profile', influencerController.updateProfile);

// ── Instagram OAuth ──
router.get('/instagram/connect', instagramController.initiateConnect);
router.post('/instagram/disconnect', instagramController.disconnect);
router.post('/instagram/refresh', instagramController.refreshSync);

// ── Instagram Data ──
router.get('/instagram/profile', instagramController.getProfile);
router.get('/instagram/analytics', instagramController.getAnalytics);
router.get('/instagram/analytics/60', async (req, res, next) => {
    try {
        const profile = await InfluencerProfile.findOne({
            $or: [
                { userId: req.user._id },
                req.user?.influencerProfileId ? { _id: req.user.influencerProfileId } : null,
            ].filter(Boolean),
        }).select('_id userId').lean();
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Influencer profile not found' });
        }

        const result = await getInfluencerAnalytics({
            id: profile._id,
            period: 60,
        });

        return res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
});
router.get('/instagram/media', instagramController.getMedia);
router.post('/instagram/post-lookup', instagramController.lookupPostByUrl);

router.get('/performance', async (req, res, next) => {
    try {
        const profile = await InfluencerProfile.findOne({
            $or: [
                { userId: req.user._id },
                req.user?.influencerProfileId ? { _id: req.user.influencerProfileId } : null,
            ].filter(Boolean),
        }).select('_id userId').lean();
        if (!profile) {
            return res.status(404).json({ success: false, error: 'Influencer profile not found' });
        }

        const report = await buildInfluencerPerformanceReport({
            influencerProfileId: profile._id,
            influencerUserId: profile.userId,
        });

        return res.json({
            success: true,
            ...report,
        });
    } catch (error) {
        next(error);
    }
});

function normalizeInProductionCampaign(campaign, brandProfile) {
    const agreedFee = Number(
        campaign?.pricing?.agreedFee
        ?? campaign?.pricing?.brandOffer
        ?? campaign?.agreedFee
        ?? campaign?.agreedPrice
        ?? campaign?.brandOfferedFee
        ?? 0
    ) || 0;
    return {
        ...campaign,
        brandProfile: brandProfile || null,
        pricing: {
            ...(campaign.pricing || {}),
            agreedFee,
            brandOffer: Number(campaign?.pricing?.brandOffer ?? campaign?.brandOfferedFee ?? agreedFee) || agreedFee,
            currency: campaign?.pricing?.currency || campaign?.currency || 'USD',
        },
        brief: {
            ...(campaign.brief || {}),
            trackingLink: campaign?.brief?.trackingLink || campaign?.trackingLink || '',
            promoCode: campaign?.brief?.promoCode || campaign?.promoCode || '',
        },
        content: {
            driveLink: campaign?.content?.driveLink || campaign?.draftDriveLink || '',
            driveSubmittedAt: campaign?.content?.driveSubmittedAt || campaign?.draftSubmittedAt || null,
            brandApprovedDrive: campaign?.content?.brandApprovedDrive ?? Boolean(campaign?.draftApprovedAt),
            brandApprovedAt: campaign?.content?.brandApprovedAt || campaign?.draftApprovedAt || null,
            postLink: campaign?.content?.postLink || campaign?.postLink || '',
            postSubmittedAt: campaign?.content?.postSubmittedAt || campaign?.postSubmittedAt || null,
            brandVerifiedPost: campaign?.content?.brandVerifiedPost ?? campaign?.brandVerifiedPost ?? false,
            brandVerifiedAt: campaign?.content?.brandVerifiedAt || campaign?.brandVerifiedAt || null,
            adminVerified: campaign?.content?.adminVerified ?? campaign?.adminVerifiedPost ?? false,
            adminVerifiedAt: campaign?.content?.adminVerifiedAt || campaign?.adminVerifiedAt || null,
        },
        payment: {
            ...(campaign.payment || {}),
            status: campaign?.payment?.status || 'pending',
        },
        trackingEnabledForCampaign: Boolean(campaign?.trackingEnabledForCampaign),
        trackingAcceptedByInfluencer: Boolean(campaign?.trackingAcceptedByInfluencer),
        trackingDetails: campaign?.trackingDetails || {},
    };
}

router.get('/campaigns/in-production', async (req, res, next) => {
    try {
        const profile = await InfluencerProfile.findOne({
            $or: [
                { userId: req.user._id },
                req.user?.influencerProfileId ? { _id: req.user.influencerProfileId } : null,
            ].filter(Boolean),
        }).select('_id userId').lean();
        if (!profile) {
            return res.status(404).json({ success: false, error: 'Influencer profile not found' });
        }

        const statuses = ['brand_payment_pending', 'brand_paid_work_can_start', 'content_submitted', 'content_approved', 'posted'];
        const campaigns = await CampaignRequest.find({
            $and: [
                {
                    $or: [
                        { influencerId: profile._id },
                        { influencerUserId: req.user._id },
                        { influencerProfileId: profile._id },
                    ],
                },
                { status: { $in: statuses } },
            ],
        })
            .sort({ acceptedAt: -1, createdAt: -1 })
            .lean();

        const brandIds = [...new Set(campaigns.map((item) => String(item.brandId || item.brandProfileId || '')).filter(Boolean))];
        const brandProfiles = brandIds.length
            ? await BrandProfile.find({ _id: { $in: brandIds } })
                .select('businessName igUsername igProfileUrl logo website userId')
                .lean()
            : [];
        const brandMap = new Map(brandProfiles.map((brand) => [String(brand._id), brand]));

        return res.json({
            success: true,
            campaigns: campaigns.map((campaign) => normalizeInProductionCampaign(campaign, brandMap.get(String(campaign.brandId || campaign.brandProfileId)))),
        });
    } catch (error) {
        next(error);
    }
});

// ── Campaign Requests (incoming) ──
router.get('/requests', campaignRequestController.getInfluencerRequests);
router.patch('/requests/:id', campaignRequestController.respondToRequest);
router.post('/verify', campaignRequestController.submitInfluencerVerification);

// ── Verifications (Completed Collaborations) ───────────────────────
router.get('/verifications', campaignRequestController.getInfluencerVerifications);

// ── Earnings & Cashouts ───────────────────────────────────────────
router.get('/earnings', financeController.getEarnings);
router.get('/cashouts', financeController.getCashouts);
router.post('/cashout', financeController.requestCashout);

// ── Notifications ──
router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/count', notificationController.getUnreadCount);
router.patch('/notifications/:id/read', notificationController.markAsRead);
router.patch('/notifications/read-all', notificationController.markAllAsRead);

module.exports = router;
