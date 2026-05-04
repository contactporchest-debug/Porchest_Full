const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const CampaignRequest = require('../models/CampaignRequest');
const BrandProfile = require('../models/BrandProfile');
const InfluencerProfile = require('../models/InfluencerProfile');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { generateUniqueCode } = require('../utils/generateCode');
const {
    generateTrackingLink,
    generatePromoCode,
    takeFollowerBaseline,
} = require('../services/trackingService');
const { syncCollaborationMetrics } = require('../services/syncService');
const { isAdminRole } = require('../utils/accessRoles');
const { requireCompleteProfile } = require('../middleware/profileCompleteCheck');

const router = express.Router();
router.use(authMiddleware);

const EXPLICIT_STATUSES = [
    'pending',
    'countered',
    'accepted',
    'content_submitted',
    'content_approved',
    'posted',
    'completed',
    'declined',
    'cancelled',
];

function isAdmin(user) {
    return isAdminRole(user?.role);
}

function toArray(value) {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    if (typeof value === 'string') {
        return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
}

function normalizeContentTypes(value) {
    return toArray(value).filter((item) => String(item).toLowerCase() !== 'story');
}

function toNumber(value, fallback = undefined) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function inStatusList(status, list) {
    return list.map(String).includes(String(status));
}

function throwStatusError(currentStatus, res) {
    return res.status(400).json({
        success: false,
        error: `Action not allowed in current status: ${currentStatus}`,
    });
}

function parseHashtags(value) {
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'string') {
        return value.split(/\s+/).map((item) => item.trim()).filter(Boolean);
    }
    return [];
}

function normalizeBriefInput(brief = {}) {
    const contentType = normalizeContentTypes(brief.contentType || brief.contentTypes);
    const hashtags = parseHashtags(brief.hashtags || brief.requiredHashtags);
    const mandatoryPoints = brief.mandatoryPoints || (Array.isArray(brief.mandatoryTalkingPoints) ? brief.mandatoryTalkingPoints.join('\n') : brief.mandatoryTalkingPoints || '');
    const dos = Array.isArray(brief.dos) ? brief.dos.join('\n') : brief.dos || '';
    const donts = Array.isArray(brief.donts) ? brief.donts.join('\n') : brief.donts || '';
    const usageRightsText = typeof brief.usageRightsText === 'string'
        ? brief.usageRightsText
        : (typeof brief.usageRights === 'string' ? brief.usageRights : '');

    return {
        brandIntro: brief.brandIntro || '',
        campaignObjective: brief.campaignObjective || '',
        productDetails: brief.productDetails || '',
        targetAudienceDesc: brief.targetAudienceDesc || brief.targetAudience || '',
        keyMessage: brief.keyMessage || '',
        contentType,
        contentTypes: contentType,
        creativeDirection: brief.creativeDirection || '',
        mandatoryPoints,
        mandatoryTalkingPoints: mandatoryPoints ? [mandatoryPoints] : [],
        dosAndDonts: brief.dosAndDonts || [dos, donts].filter(Boolean).join('\n'),
        dos: dos ? dos.split('\n').filter(Boolean) : [],
        donts: donts ? donts.split('\n').filter(Boolean) : [],
        captionGuidelines: brief.captionGuidelines || '',
        hashtags,
        requiredHashtags: hashtags,
        callToAction: brief.callToAction || '',
        trackingLink: brief.trackingLink || '',
        promoCode: brief.promoCode || '',
        visualRequirements: brief.visualRequirements || '',
        postingDeadline: brief.postingDeadline ? new Date(brief.postingDeadline) : undefined,
        postingSchedule: brief.postingDeadline ? new Date(brief.postingDeadline) : undefined,
        approvalProcess: brief.approvalProcess || '',
        revisionRoundsAllowed: toNumber(brief.revisionRoundsAllowed, 1),
        deliverables: brief.deliverables || '',
        usageRights: false,
        usageRightsText,
        disclosureRequirements: brief.disclosureRequirements || brief.disclosureRequired || '',
        disclosureRequired: brief.disclosureRequirements || brief.disclosureRequired || '',
        porchestContact: brief.porchestContact || '',
    };
}

function normalizePricingInput(pricing = {}, legacy = {}) {
    const brandOffer = toNumber(pricing.brandOffer ?? legacy.brandOfferedFee ?? legacy.agreedPrice, 0);
    const influencerCounter = toNumber(pricing.influencerCounter ?? legacy.influencerCounterFee ?? legacy.counterOfferPrice, 0);
    const agreedFee = toNumber(pricing.agreedFee ?? legacy.agreedFee ?? legacy.agreedPrice, 0);
    const currency = pricing.currency || legacy.currency || 'USD';

    return {
        brandOffer,
        influencerCounter,
        agreedFee,
        currency,
    };
}

function calculatePaymentSplit(agreedFee) {
    const agreed = toNumber(agreedFee, 0);
    const platformFeePercent = 15;
    const platformFeeAmount = Number((agreed * 0.15).toFixed(2));
    const influencerNetAmount = Number((agreed - platformFeeAmount).toFixed(2));
    const firstPayoutAmount = Number((influencerNetAmount * 0.5).toFixed(2));
    const secondPayoutAmount = Number((influencerNetAmount - firstPayoutAmount).toFixed(2));
    return {
        platformFeePercent,
        platformFeeAmount,
        influencerNetAmount,
        firstPayoutAmount,
        secondPayoutAmount,
    };
}

function normalizeTimelineInput(timeline = {}, legacy = {}) {
    const campaignStartDate = timeline.campaignStartDate || legacy.campaignStartDate || null;
    const campaignEndDate = timeline.campaignEndDate || legacy.campaignEndDate || null;
    const gracePeriodDays = toNumber(timeline.gracePeriodDays ?? legacy.gracePeriodDays, 3);
    return {
        campaignStartDate,
        campaignEndDate,
        gracePeriodDays,
    };
}

function normalizeContentForResponse(doc) {
    return {
        driveLink: doc.content?.driveLink || doc.draftDriveLink || '',
        driveSubmittedAt: doc.content?.driveSubmittedAt || doc.draftSubmittedAt || null,
        brandApprovedDrive: doc.content?.brandApprovedDrive ?? Boolean(doc.draftApprovedAt),
        brandApprovedAt: doc.content?.brandApprovedAt || doc.draftApprovedAt || null,
        revisionsUsed: doc.content?.revisionsUsed ?? doc.revisionsUsed ?? 0,
        postLink: doc.content?.postLink || doc.postLink || '',
        postSubmittedAt: doc.content?.postSubmittedAt || doc.postSubmittedAt || null,
        brandVerifiedPost: doc.content?.brandVerifiedPost ?? doc.brandVerifiedPost ?? false,
        brandVerifiedAt: doc.content?.brandVerifiedAt || doc.brandVerifiedAt || null,
        adminVerified: doc.content?.adminVerified ?? doc.adminVerifiedPost ?? false,
        adminVerifiedAt: doc.content?.adminVerifiedAt || doc.adminVerifiedAt || null,
        adminVerifiedBy: doc.content?.adminVerifiedBy || doc.adminVerifiedByFK || null,
    };
}

function normalizePaymentForResponse(doc) {
    const payment = doc.payment || {};
    const portion1 = payment.portion1 || payment.tranche1 || {};
    const portion2 = payment.portion2 || payment.tranche2 || {};

    return {
        status: payment.status || 'pending',
        portion1: {
            amount: portion1.amount ?? null,
            releasedAt: portion1.releasedAt || null,
            status: portion1.status || 'pending',
        },
        portion2: {
            amount: portion2.amount ?? null,
            releasedAt: portion2.releasedAt || null,
            status: portion2.status || 'pending',
        },
        brandPaymentStatus: doc.brandPaymentStatus || 'pending',
        brandPaymentReceivedAt: doc.brandPaymentReceivedAt || null,
        brandPaymentIntentId: doc.brandPaymentIntentId || null,
        platformFeePercent: doc.platformFeePercent ?? 15,
        platformFeeAmount: doc.platformFeeAmount ?? 0,
        influencerNetAmount: doc.influencerNetAmount ?? 0,
        firstPayoutAmount: doc.firstPayoutAmount ?? 0,
        secondPayoutAmount: doc.secondPayoutAmount ?? 0,
        firstPayoutReleasedAt: doc.firstPayoutReleasedAt || null,
        secondPayoutReleasedAt: doc.secondPayoutReleasedAt || null,
        verifiedLiveAt: doc.verifiedLiveAt || null,
        campaignStartAt: doc.campaignStartAt || null,
        campaignEndAt: doc.campaignEndAt || null,
        campaignActiveAt: doc.campaignActiveAt || null,
        campaignCompletedAt: doc.campaignCompletedAt || null,
    };
}

function normalizeMetricsForResponse(doc) {
    const metrics = doc.metrics || {};
    return {
        clicks: metrics.clicks || 0,
        visits: metrics.visits || 0,
        conversions: metrics.conversions || 0,
        revenue: metrics.revenue || 0,
        roas: metrics.roas ?? 0,
        cpa: metrics.cpa ?? 0,
        reach: metrics.reach || 0,
        impressions: metrics.impressions || 0,
        engagementRate: metrics.engagementRate ?? 0,
        lastUpdatedAt: metrics.lastUpdatedAt || null,
    };
}

function normalizeFollowerSnapshot(doc) {
    const snap = doc.followerSnapshot || {};
    return {
        baseline: snap.baseline || { count: 0, timestamp: null },
        dailyReadings: Array.isArray(snap.dailyReadings) ? snap.dailyReadings : [],
        currentCount: snap.currentCount || 0,
        netNewFollowers: snap.netNewFollowers || 0,
        growthRate: snap.growthRate || 0,
        lastPolledAt: snap.lastPolledAt || null,
    };
}

async function getUserProfiles(userId) {
    const [brandProfile, influencerProfile] = await Promise.all([
        BrandProfile.findOne({ userId }).lean(),
        InfluencerProfile.findOne({ userId }).lean(),
    ]);
    return { brandProfile, influencerProfile };
}

async function resolveContactName(brandProfile) {
    const employeeId = brandProfile?.assignedEmployee || brandProfile?.assignedEmployeeFK;
    if (!employeeId) return '';
    const employee = await User.findById(employeeId).select('email userCode').lean();
    return employee?.email || employee?.userCode || String(employeeId);
}

async function getBrandAndInfluencerProfiles(collab) {
    const [brandProfile, influencerProfile] = await Promise.all([
        BrandProfile.findById(collab.brandId || collab.brandProfileId).select('businessName igUsername igProfileUrl logo website targetAudience userId assignedEmployee assignedEmployeeFK').lean(),
        InfluencerProfile.findById(collab.influencerId || collab.influencerProfileId).select('igUsername igProfileUrl followerTier rates displayName fullName avatar userId').lean(),
    ]);
    return { brandProfile, influencerProfile };
}

function buildResponseCollab(doc, brandProfile, influencerProfile) {
    const brief = normalizeBriefInput(doc.brief || {});
    const usageRightsText =
        (doc.brief && typeof doc.brief.usageRightsText === 'string' && doc.brief.usageRightsText) ||
        (doc.brief && typeof doc.brief.usageRights === 'string' && doc.brief.usageRights) ||
        (doc.brief && doc.brief.usageRights ? 'Usage rights included' : '');
    brief.usageRightsText = usageRightsText;
    brief.usageRights = usageRightsText;
    const pricing = normalizePricingInput(doc.pricing || {}, doc);
    const timeline = normalizeTimelineInput(doc.timeline || {}, doc);
    const content = normalizeContentForResponse(doc);
    const payment = normalizePaymentForResponse(doc);
    const metrics = normalizeMetricsForResponse(doc);
    const followerSnapshot = normalizeFollowerSnapshot(doc);

    return {
        ...doc,
        brandProfile: brandProfile || null,
        influencerProfile: influencerProfile || null,
        brief,
        pricing,
        timeline,
        content,
        payment,
        metrics,
        followerSnapshot,
    };
}

async function enrichCollaboration(doc) {
    if (!doc) return null;
    const [brandProfile, influencerProfile] = await Promise.all([
        BrandProfile.findById(doc.brandId || doc.brandProfileId).select('businessName igUsername igProfileUrl logo website targetAudience userId').lean(),
        InfluencerProfile.findById(doc.influencerId || doc.influencerProfileId).select('igUsername igProfileUrl followerTier rates displayName fullName avatar userId').lean(),
    ]);
    return buildResponseCollab(doc, brandProfile, influencerProfile);
}

function canAccessCollaboration(collab, reqUser, brandProfile, influencerProfile) {
    if (isAdmin(reqUser)) return true;
    const userId = String(reqUser._id);
    const brandUserIds = [collab.brandUserId, brandProfile?.userId, brandProfile?._id, collab.brandId, collab.brandProfileId].filter(Boolean).map(String);
    const influencerUserIds = [collab.influencerUserId, influencerProfile?.userId, influencerProfile?._id, collab.influencerId, collab.influencerProfileId].filter(Boolean).map(String);
    return brandUserIds.includes(userId) || influencerUserIds.includes(userId);
}

async function verifyAdminFinalization(collabId, collab, reqUser) {
    const agreedFee = toNumber(collab.pricing?.agreedFee ?? collab.financials?.agreedFee ?? collab.agreedFee ?? collab.agreedPrice, 0);
    const now = new Date();
    const tranche1 = Number((agreedFee * 0.5).toFixed(2));
    const tranche2 = Number((agreedFee * 0.5).toFixed(2));
    const updated = await CampaignRequest.findByIdAndUpdate(
        collabId,
        {
            $set: {
                status: 'completed',
                adminVerifiedPost: true,
                adminVerifiedAt: now,
                adminVerifiedByFK: reqUser._id,
                'content.adminVerified': true,
                'content.adminVerifiedAt': now,
                'content.adminVerifiedBy': reqUser._id,
                'payment.status': 'partial',
                'payment.portion1.amount': tranche1,
                'payment.portion1.releasedAt': now,
                'payment.portion1.status': 'released',
                'payment.portion2.amount': tranche2,
                'payment.portion2.releasedAt': new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                'payment.portion2.status': 'pending',
                'payment.tranche1.amount': tranche1,
                'payment.tranche1.releasedAt': now,
                'payment.tranche1.status': 'released',
                'payment.tranche2.amount': tranche2,
                'payment.tranche2.releasedAt': new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                'payment.tranche2.status': 'pending',
            },
        },
        { new: true, strict: false }
    ).lean();
    return updated;
}

function setExactAcceptanceFields(update, collab, brandWebsite, influencerUsername) {
    const now = new Date();
    const collaborationId = String(collab._id);
    const influencerRef = String(collab.influencerId || collab.influencerProfileId);
    const split = calculatePaymentSplit(
        collab.pricing?.brandOffer ?? collab.financials?.brandOfferedFee ?? collab.brandOfferedFee ?? collab.agreedPrice
    );

    update.status = 'brand_payment_pending';
    update.acceptedAt = now;
    update.brandPaymentStatus = 'pending';
    update.brandPaymentReceivedAt = null;
    update.brandPaymentIntentId = update.brandPaymentIntentId || null;
    update.platformFeePercent = split.platformFeePercent;
    update.platformFeeAmount = split.platformFeeAmount;
    update.influencerNetAmount = split.influencerNetAmount;
    update.firstPayoutAmount = split.firstPayoutAmount;
    update.secondPayoutAmount = split.secondPayoutAmount;
    update.campaignStartAt = null;
    update.campaignEndAt = null;
    update.campaignActiveAt = null;
    update.campaignCompletedAt = null;
    update.verifiedLiveAt = null;
    update.firstPayoutReleasedAt = null;
    update.secondPayoutReleasedAt = null;
    update.campaignStartDate = null;
    update.campaignEndDate = null;
    update.timeline = {
        campaignStartDate: null,
        campaignEndDate: null,
        gracePeriodDays: collab.gracePeriodDays || 3,
    };

    const brandOffer = toNumber(collab.pricing?.brandOffer ?? collab.financials?.brandOfferedFee ?? collab.brandOfferedFee ?? collab.agreedPrice, 0);
    update.agreedFee = brandOffer;
    update.agreedPrice = brandOffer;
    update.brandOfferedFee = brandOffer;
    update.pricing = {
        ...(collab.pricing || {}),
        brandOffer,
        agreedFee: brandOffer,
        currency: collab.pricing?.currency || collab.financials?.currency || 'USD',
    };
    update.financials = {
        ...(collab.financials || {}),
        brandOfferedFee: brandOffer,
        agreedFee: brandOffer,
        currency: collab.financials?.currency || collab.pricing?.currency || 'USD',
    };

    update.brief = {
        ...(collab.brief || {}),
        trackingLink: generateTrackingLink(collaborationId, influencerRef, brandWebsite || 'https://porchest.com'),
        promoCode: generatePromoCode(influencerUsername || 'PRCH', collaborationId),
    };

    return update;
}

async function scheduleSecondPayoutIfDue(collabId, collab) {
    const now = new Date();
    const campaignEnd = collab.campaignEndAt || collab.campaignEndDate || collab.timeline?.campaignEndDate;
    if (!campaignEnd) return collab;
    if (new Date(campaignEnd).getTime() > now.getTime()) return collab;

    const secondPayoutAlreadyReleased = Boolean(collab.secondPayoutReleasedAt || collab.payment?.portion2?.releasedAt || collab.payment?.tranche2?.releasedAt);
    if (secondPayoutAlreadyReleased) return collab;

    const secondAmount = toNumber(
        collab.secondPayoutAmount ??
        collab.payment?.portion2?.amount ??
        collab.payment?.tranche2?.amount ??
        0,
        0
    );

    const updated = await CampaignRequest.findByIdAndUpdate(
        collabId,
        {
            $set: {
                status: 'completed',
                secondPayoutReleasedAt: now,
                campaignCompletedAt: now,
                'payment.status': 'released',
                'payment.portion2.amount': secondAmount,
                'payment.portion2.releasedAt': now,
                'payment.portion2.status': 'released',
                'payment.tranche2.amount': secondAmount,
                'payment.tranche2.releasedAt': now,
                'payment.tranche2.status': 'released',
            },
        },
        { new: true, strict: false }
    ).lean();

    return updated;
}

async function finalizeAcceptance(collabId, collab) {
    const [brandProfile, influencerProfile] = await Promise.all([
        BrandProfile.findById(collab.brandId || collab.brandProfileId).select('website').lean(),
        InfluencerProfile.findById(collab.influencerId || collab.influencerProfileId).select('igUsername instagramUsername').lean(),
    ]);

    const update = {};
    setExactAcceptanceFields(update, collab, brandProfile?.website, influencerProfile?.igUsername || influencerProfile?.instagramUsername);

    const updated = await CampaignRequest.findByIdAndUpdate(
        collabId,
        {
            $set: {
                ...update,
                'brief.trackingLink': update.brief.trackingLink,
                'brief.promoCode': update.brief.promoCode,
                'timeline.campaignStartDate': update.timeline.campaignStartDate,
                'timeline.campaignEndDate': update.timeline.campaignEndDate,
                'timeline.gracePeriodDays': update.timeline.gracePeriodDays,
                'pricing.brandOffer': update.pricing.brandOffer,
                'pricing.agreedFee': update.pricing.agreedFee,
                'pricing.currency': update.pricing.currency,
                'financials.brandOfferedFee': update.financials.brandOfferedFee,
                'financials.agreedFee': update.financials.agreedFee,
                'financials.currency': update.financials.currency,
            },
        },
        { new: true, strict: false }
    ).lean();

    takeFollowerBaseline(collabId).catch(() => {});
    return updated;
}

async function markBrandPaymentReceived(collabId, collab, paymentIntentId = null) {
    const now = new Date();
    const updated = await CampaignRequest.findByIdAndUpdate(
        collabId,
        {
            $set: {
                status: 'brand_paid_work_can_start',
                brandPaymentStatus: 'paid',
                brandPaymentReceivedAt: now,
                brandPaymentIntentId: paymentIntentId || collab.brandPaymentIntentId || null,
                campaignActiveAt: null,
            },
        },
        { new: true, strict: false }
    ).lean();
    return updated;
}

router.post('/', roleMiddleware('brand'), requireCompleteProfile, async (req, res) => {
    try {
        const brandProfile = await BrandProfile.findOne({ userId: req.user._id }).lean();
        if (!brandProfile) {
            return res.status(400).json({ success: false, error: 'Complete brand profile first' });
        }

        const influencerProfile =
            (await InfluencerProfile.findById(req.body.influencerId).lean()) ||
            (await InfluencerProfile.findOne({ userId: req.body.influencerId }).lean());
        if (!influencerProfile) {
            return res.status(404).json({ success: false, error: 'Influencer not found' });
        }
        if (String(influencerProfile.userId || '') === String(req.user._id)) {
            return res.status(400).json({ success: false, error: 'Cannot send a collaboration request to yourself' });
        }

        const brief = normalizeBriefInput(req.body.brief || {});
        const pricing = normalizePricingInput(req.body.pricing || {}, req.body);
        const requestCode = await generateUniqueCode('REQ', CampaignRequest, 'requestCode');
        const porchestContact = await resolveContactName(brandProfile);

        const created = await CampaignRequest.create({
            requestCode,
            brandId: brandProfile._id,
            influencerId: influencerProfile._id,
            brandProfileId: brandProfile._id,
            influencerProfileId: influencerProfile._id,
            brandUserId: req.user._id,
            influencerUserId: influencerProfile.userId,
            status: 'pending',
            brief: {
                ...brief,
                porchestContact,
            },
            pricing,
            financials: {
                brandOfferedFee: pricing.brandOffer,
                influencerCounterFee: pricing.influencerCounter,
                agreedFee: pricing.agreedFee || pricing.brandOffer,
                currency: pricing.currency,
            },
            campaignTitle: brief.campaignObjective || 'Collaboration request',
            campaignDescription: brief.productDetails,
            campaignType: brief.campaignObjective,
            brandMessage: brief.brandIntro,
            postingDeadline: brief.postingDeadline,
            deliverables: brief.deliverables,
            hashtags: brief.hashtags,
            disclosureRequirements: brief.disclosureRequirements,
            brandName: brandProfile.businessName || brandProfile.brandName,
            influencerName: influencerProfile.displayName || influencerProfile.fullName,
            influencerUsername: influencerProfile.igUsername,
            influencerProfilePic: influencerProfile.igProfileUrl || influencerProfile.avatar,
            influencerNiche: influencerProfile.niche,
            brandOfferedFee: pricing.brandOffer,
            agreedPrice: pricing.brandOffer,
            brandOffer: pricing.brandOffer,
            timeline: {
                gracePeriodDays: 3,
            },
        });

        Notification.create({
            recipientUserId: influencerProfile.userId,
            type: 'collaboration_request',
            title: 'New Collaboration Request',
            message: `${brandProfile.businessName || 'A brand'} sent you a collaboration request.`,
            campaignRequestId: created._id,
        }).catch((notificationError) => {
            console.error('[collaborationRoutes] Notification create failed:', notificationError);
        });

        try {
            return res.status(201).json(await enrichCollaboration(created.toObject()));
        } catch (enrichError) {
            console.error('[collaborationRoutes] Enrichment failed after create:', enrichError);
            return res.status(201).json({
                success: true,
                request: created.toObject(),
            });
        }
    } catch (error) {
        console.error('[collaborationRoutes] Failed to create collaboration:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) {
            filter.status = { $in: String(req.query.status).split(',').map((item) => item.trim()).filter(Boolean) };
        }

        if (isAdmin(req.user)) {
            // no extra filter
        } else if (req.user.role === 'brand') {
            const { brandProfile } = await getUserProfiles(req.user._id);
            filter.$or = [
                { brandUserId: req.user._id },
                { brandId: brandProfile?._id },
                { brandProfileId: brandProfile?._id },
            ];
        } else if (req.user.role === 'influencer') {
            const { influencerProfile } = await getUserProfiles(req.user._id);
            filter.$or = [
                { influencerUserId: req.user._id },
                { influencerId: influencerProfile?._id },
                { influencerProfileId: influencerProfile?._id },
            ];
        } else {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const collabs = await CampaignRequest.find(filter).sort({ createdAt: -1 }).lean();
        const enriched = await Promise.all(collabs.map((c) => enrichCollaboration(c)));
        return res.json({ collaborations: enriched, total: enriched.length });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) {
            return res.status(404).json({ success: false, error: 'Collaboration not found' });
        }
        const { brandProfile, influencerProfile } = await getBrandAndInfluencerProfiles(collab);
        if (!canAccessCollaboration(collab, req.user, brandProfile, influencerProfile)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        return res.json(buildResponseCollab(collab, brandProfile, influencerProfile));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/accept', roleMiddleware('influencer'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (!inStatusList(collab.status, ['pending', 'countered'])) return throwStatusError(collab.status, res);

        const { influencerProfile } = await getUserProfiles(req.user._id);
        if (!canAccessCollaboration(collab, req.user, null, influencerProfile)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const updated = await finalizeAcceptance(req.params.id, collab);
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/confirm-brand-payment', roleMiddleware('brand'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (String(collab.status) !== 'brand_payment_pending') return throwStatusError(collab.status, res);

        const { brandProfile } = await getUserProfiles(req.user._id);
        if (!canAccessCollaboration(collab, req.user, brandProfile, null)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const updated = await markBrandPaymentReceived(req.params.id, collab, req.body?.paymentIntentId || null);
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/counter', roleMiddleware('influencer'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (String(collab.status) !== 'pending') return throwStatusError(collab.status, res);

        const amount = toNumber(req.body.counterAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ success: false, error: 'counterAmount must be positive' });
        }

        const updated = await CampaignRequest.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    status: 'countered',
                    counterOfferPrice: amount,
                    influencerCounterFee: amount,
                    'pricing.influencerCounter': amount,
                    counterOfferMessage: req.body.message || '',
                    negotiationStartedAt: new Date(),
                },
            },
            { new: true, strict: false }
        ).lean();
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/accept-counter', roleMiddleware('brand'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (String(collab.status) !== 'countered') return throwStatusError(collab.status, res);

        const { brandProfile } = await getUserProfiles(req.user._id);
        if (!canAccessCollaboration(collab, req.user, brandProfile, null)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const updated = await finalizeAcceptance(req.params.id, collab);
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/decline', async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        const { brandProfile, influencerProfile } = await getUserProfiles(req.user._id);
        if (!canAccessCollaboration(collab, req.user, brandProfile, influencerProfile)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const updated = await CampaignRequest.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    status: 'declined',
                    rejectedAt: new Date(),
                    cancelledAt: new Date(),
                },
            },
            { new: true, strict: false }
        ).lean();
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/submit-drive', roleMiddleware('influencer'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (!inStatusList(collab.status, ['brand_paid_work_can_start', 'content_submitted'])) return throwStatusError(collab.status, res);

        const now = new Date();
        const updated = await CampaignRequest.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    status: 'content_submitted',
                    draftDriveLink: req.body.driveLink,
                    draftSubmittedAt: now,
                    'content.driveLink': req.body.driveLink,
                    'content.driveSubmittedAt': now,
                },
            },
            { new: true, strict: false }
        ).lean();
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/approve-drive', roleMiddleware('brand'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (String(collab.status) !== 'content_submitted') return throwStatusError(collab.status, res);

        const now = new Date();
        const updated = await CampaignRequest.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    status: 'content_approved',
                    draftApprovedAt: now,
                    'content.brandApprovedDrive': true,
                    'content.brandApprovedAt': now,
                },
            },
            { new: true, strict: false }
        ).lean();
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/reject-drive', roleMiddleware('brand'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (String(collab.status) !== 'content_submitted') return throwStatusError(collab.status, res);

        const feedback = String(req.body.feedback || '').trim();
        const update = {
            $set: {
                status: 'accepted',
                acceptedAt: new Date(),
            },
            $inc: { revisionsUsed: 1, 'content.revisionsUsed': 1 },
        };
        if (feedback) {
            update.$push = { brandFeedback: feedback };
            update.$set.rejectionReason = feedback;
        }
        const updated = await CampaignRequest.findByIdAndUpdate(req.params.id, update, { new: true, strict: false }).lean();
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/submit-post', roleMiddleware('influencer'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (String(collab.status) !== 'content_approved') return throwStatusError(collab.status, res);

        const postLink = String(req.body.postLink || '').trim();
        if (!/instagram\.com/i.test(postLink)) {
            return res.status(400).json({ success: false, error: 'postLink must be an Instagram URL' });
        }

        const now = new Date();
        await CampaignRequest.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    status: 'posted',
                    postLink,
                    postSubmittedAt: now,
                    'content.postLink': postLink,
                    'content.postSubmittedAt': now,
                },
            },
            { new: true, strict: false }
        );

        syncCollaborationMetrics(req.params.id).catch(() => {});
        const updated = await CampaignRequest.findById(req.params.id).lean();
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/verify-brand', roleMiddleware('brand'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (String(collab.status) !== 'posted') return throwStatusError(collab.status, res);

        const now = new Date();
        const updated = await CampaignRequest.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    brandVerifiedPost: true,
                    brandVerifiedAt: now,
                    'content.brandVerifiedPost': true,
                    'content.brandVerifiedAt': now,
                },
            },
            { new: true, strict: false }
        ).lean();
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/verify-admin', roleMiddleware('admin'), async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (String(collab.status) !== 'posted') return throwStatusError(collab.status, res);

        const now = new Date();
        const split = calculatePaymentSplit(
            collab.pricing?.agreedFee ?? collab.financials?.agreedFee ?? collab.agreedFee ?? collab.agreedPrice
        );
        const updated = await CampaignRequest.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    status: 'campaign_active',
                    adminVerifiedPost: true,
                    adminVerifiedAt: now,
                    adminVerifiedByFK: req.user._id,
                    verifiedLiveAt: now,
                    campaignStartAt: now,
                    campaignEndAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                    campaignActiveAt: now,
                    'content.adminVerified': true,
                    'content.adminVerifiedAt': now,
                    'content.adminVerifiedBy': req.user._id,
                    'payment.status': 'partial',
                    'payment.portion1.amount': split.firstPayoutAmount,
                    'payment.portion1.releasedAt': now,
                    'payment.portion1.status': 'released',
                    'payment.portion2.amount': split.secondPayoutAmount,
                    'payment.portion2.releasedAt': new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                    'payment.portion2.status': 'pending',
                    'payment.tranche1.amount': split.firstPayoutAmount,
                    'payment.tranche1.releasedAt': now,
                    'payment.tranche1.status': 'released',
                    'payment.tranche2.amount': split.secondPayoutAmount,
                    'payment.tranche2.releasedAt': new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                    'payment.tranche2.status': 'pending',
                    firstPayoutAmount: split.firstPayoutAmount,
                    secondPayoutAmount: split.secondPayoutAmount,
                    firstPayoutReleasedAt: now,
                },
            },
            { new: true, strict: false }
        ).lean();
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/verify-post', roleMiddleware('admin'), async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (String(collab.status) !== 'posted') return throwStatusError(collab.status, res);
        const updated = await verifyAdminFinalization(req.params.id, collab, req.user);
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
