const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const CampaignRequest = require('../models/CampaignRequest');
const ClickEvent = require('../models/ClickEvent');
const PurchaseEvent = require('../models/PurchaseEvent');
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
const {
    sendCampaignEmailNotification,
} = require('../services/notificationDeliveryService');
const {
    buildCollaborationAnalytics,
    buildCollaborationPdfBuffer,
    formatDate,
} = require('../services/collaborationReportService');
const { isAdminRole, ADMIN_ROLES } = require('../utils/accessRoles');
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

function emitCollaborationEvent(req, userIds, event, payload) {
    const io = req.app?.locals?.io;
    if (!io) return;
    userIds.filter(Boolean).forEach((userId) => {
        io.to(`user-${userId}`).emit(event, payload);
    });
}

async function getAdminRecipients() {
    return User.find({ role: { $in: ADMIN_ROLES } }).select('_id fullName email').lean();
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
                    payment: {
                        ...(collab.payment || {}),
                        status: 'partial',
                        portion1: {
                            ...(collab.payment?.portion1 || {}),
                            amount: tranche1,
                            releasedAt: now,
                            status: 'released',
                        },
                        portion2: {
                            ...(collab.payment?.portion2 || {}),
                            amount: tranche2,
                            releasedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                            status: 'pending',
                        },
                        tranche1: {
                            ...(collab.payment?.tranche1 || collab.payment?.portion1 || {}),
                            amount: tranche1,
                            releasedAt: now,
                            status: 'released',
                        },
                        tranche2: {
                            ...(collab.payment?.tranche2 || collab.payment?.portion2 || {}),
                            amount: tranche2,
                            releasedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                            status: 'pending',
                        },
                    },
                },
            },
            { new: true, strict: false }
        ).lean();
    return updated;
}

async function canManageBrandCollaboration(collab, reqUser) {
    if (isAdmin(reqUser)) return true;
    if (reqUser?.role !== 'brand') return false;
    const { brandProfile } = await getUserProfiles(reqUser._id);
    return canAccessCollaboration(collab, reqUser, brandProfile, null);
}

async function getBrandCollaborationOrThrow(id, req, res) {
    const collab = await CampaignRequest.findById(id).lean();
    if (!collab) {
        res.status(404).json({ success: false, error: 'Collaboration not found' });
        return null;
    }
    const allowed = await canManageBrandCollaboration(collab, req.user);
    if (!allowed) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return null;
    }
    return collab;
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
                payment: {
                    ...(collab.payment || {}),
                    status: 'released',
                    portion1: {
                        ...(collab.payment?.portion1 || {}),
                    },
                    portion2: {
                        ...(collab.payment?.portion2 || {}),
                        amount: secondAmount,
                        releasedAt: now,
                        status: 'released',
                    },
                    tranche1: {
                        ...(collab.payment?.tranche1 || collab.payment?.portion1 || {}),
                    },
                    tranche2: {
                        ...(collab.payment?.tranche2 || collab.payment?.portion2 || {}),
                        amount: secondAmount,
                        releasedAt: now,
                        status: 'released',
                    },
                },
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
                brief: update.brief,
                timeline: update.timeline,
                pricing: update.pricing,
                financials: update.financials,
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

        const influencerUser = await User.findById(collab.influencerUserId).select('email fullName').lean();
        await sendCampaignEmailNotification({
            email: influencerUser?.email,
            subject: 'Content approved',
            title: 'Content approved',
            message: `Your draft for "${collab.campaignTitle}" was approved. Please verify the final content before posting.`,
            actionText: 'View collaboration',
            actionHref: `/dashboard/influencer/collaborations?request=${collab._id}`,
        });
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

router.patch('/:id/requirements', roleMiddleware('brand'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (!inStatusList(collab.status, ['pending', 'countered', 'accepted', 'brand_payment_pending', 'brand_paid_work_can_start'])) {
            return throwStatusError(collab.status, res);
        }

        const { brandProfile } = await getUserProfiles(req.user._id);
        if (!canAccessCollaboration(collab, req.user, brandProfile, null)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const updates = {};
        const updateIfPresent = (key, targetKey = key, transform = (value) => value) => {
            if (req.body[key] !== undefined) {
                updates[targetKey] = transform(req.body[key]);
            }
        };

        updateIfPresent('campaignTitle', 'campaignTitle', (value) => String(value).trim());
        updateIfPresent('campaignDescription', 'campaignDescription', (value) => String(value).trim());
        updateIfPresent('campaignType', 'campaignType', (value) => String(value).trim());
        updateIfPresent('contentGuidelines', 'contentGuidelines', (value) => String(value).trim());
        updateIfPresent('postingDeadline', 'postingDeadline', (value) => (value ? new Date(value) : null));
        updateIfPresent('agreedPrice', 'agreedPrice', (value) => toNumber(value, null));

        if (req.body.deliverables !== undefined) {
            updates.deliverables = toArray(req.body.deliverables);
            updates['brief.deliverables'] = updates.deliverables;
        }
        if (req.body.hashtags !== undefined) {
            updates.hashtags = toArray(req.body.hashtags);
            updates['brief.hashtags'] = updates.hashtags;
            updates['brief.requiredHashtags'] = updates.hashtags;
        }
        if (req.body.disclosureRequirements !== undefined) {
            updates.disclosureRequirements = String(req.body.disclosureRequirements).trim();
            updates['brief.disclosureRequirements'] = updates.disclosureRequirements;
            updates['brief.disclosureRequired'] = updates.disclosureRequirements;
        }
        if (req.body.requiredElements !== undefined) {
            updates.requiredElements = String(req.body.requiredElements).trim();
        }
        if (req.body.videoLength !== undefined) {
            updates.videoLength = String(req.body.videoLength).trim();
        }
        if (req.body.paymentTerms !== undefined) {
            updates.paymentTerms = String(req.body.paymentTerms).trim();
            updates['brief.callToAction'] = updates.paymentTerms;
        }
        if (req.body.brandMessage !== undefined) {
            updates.brandMessage = String(req.body.brandMessage).trim();
            updates['brief.brandIntro'] = updates.brandMessage;
        }

        if (req.body.agreedPrice !== undefined) {
            const agreedPrice = toNumber(req.body.agreedPrice, null);
            if (agreedPrice != null) {
                updates.agreedPrice = agreedPrice;
                updates.agreedFee = agreedPrice;
                updates.brandOfferedFee = agreedPrice;
                updates.influencerPayable = agreedPrice;
                updates['pricing.brandOffer'] = agreedPrice;
                updates['pricing.agreedFee'] = agreedPrice;
                updates['financials.brandOfferedFee'] = agreedPrice;
                updates['financials.agreedFee'] = agreedPrice;
                updates['financials.influencerPayable'] = agreedPrice;
            }
        }

        const updatePayload = { $set: updates };
        const updated = await CampaignRequest.findByIdAndUpdate(req.params.id, updatePayload, { new: true, strict: false }).lean();
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/verify-content', roleMiddleware('brand'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (String(collab.status) !== 'content_submitted') return throwStatusError(collab.status, res);

        const { brandProfile } = await getUserProfiles(req.user._id);
        if (!canAccessCollaboration(collab, req.user, brandProfile, null)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

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

        const influencerUser = await User.findById(collab.influencerUserId).select('email fullName').lean();
        await sendCampaignEmailNotification({
            email: influencerUser?.email,
            subject: 'Content approved',
            title: 'Content approved',
            message: `Your draft for "${collab.campaignTitle}" was approved. Please verify the final content before posting.`,
            actionText: 'View collaboration',
            actionHref: `/dashboard/influencer/collaborations?request=${collab._id}`,
        });
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

        const { brandProfile } = await getUserProfiles(req.user._id);
        if (!canAccessCollaboration(collab, req.user, brandProfile, null)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

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

        const [admins] = await Promise.all([
            getAdminRecipients(),
            Notification.create({
                recipientUserId: collab.brandUserId,
                type: 'system',
                title: 'Post submitted for verification',
                message: `${collab.influencerName || 'The influencer'} submitted the live post for "${collab.campaignTitle}".`,
                campaignRequestId: collab._id,
                metadata: { action: 'submit-post', postLink },
            }).catch((notificationError) => {
                console.error('[collaborationRoutes] Brand notification create failed:', notificationError);
            }),
        ]);

        if (admins.length > 0) {
            await Notification.insertMany(admins.map((admin) => ({
                recipientUserId: admin._id,
                type: 'system',
                title: 'Collaboration ready for admin review',
                message: `${collab.influencerName || 'An influencer'} submitted "${collab.campaignTitle}" for verification.`,
                campaignRequestId: collab._id,
                metadata: { action: 'submit-post', postLink, collabStatus: 'posted' },
            }))).catch((notificationError) => {
                console.error('[collaborationRoutes] Admin notification create failed:', notificationError);
            });
        }

        const [brandUser] = await Promise.all([
            User.findById(collab.brandUserId).select('email fullName').lean(),
        ]);
        const approvalMessage = `${collab.influencerName || 'The influencer'} submitted the live post for "${collab.campaignTitle}" and it is ready for review.`;
        await Promise.all([
            sendCampaignEmailNotification({
                email: brandUser?.email,
                subject: 'Content submitted for approval',
                title: 'Content submitted for approval',
                message: approvalMessage,
                actionText: 'Review collaboration',
                actionHref: `/dashboard/brand/collaborations?request=${collab._id}`,
            }),
            ...admins.map((admin) => sendCampaignEmailNotification({
                email: admin.email,
                subject: 'Campaign ready for admin review',
                title: 'Campaign ready for admin review',
                message: `${collab.influencerName || 'The influencer'} submitted "${collab.campaignTitle}" for verification.`,
                actionText: 'Open admin collaboration queue',
                actionHref: `/dashboard/admin/collaborations?request=${collab._id}`,
                accent: '#7A5030',
            })),
        ]);

        emitCollaborationEvent(req, [collab.brandUserId, ...admins.map((admin) => admin._id)], 'collaboration:updated', {
            collaborationId: collab._id,
            status: 'posted',
            action: 'submit-post',
        });

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
                payment: {
                    ...(collab.payment || {}),
                    status: 'partial',
                    portion1: {
                        ...(collab.payment?.portion1 || {}),
                        amount: split.firstPayoutAmount,
                        releasedAt: now,
                        status: 'released',
                    },
                    portion2: {
                        ...(collab.payment?.portion2 || {}),
                        amount: split.secondPayoutAmount,
                        releasedAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                        status: 'pending',
                    },
                    tranche1: {
                        ...(collab.payment?.tranche1 || collab.payment?.portion1 || {}),
                        amount: split.firstPayoutAmount,
                        releasedAt: now,
                        status: 'released',
                    },
                    tranche2: {
                        ...(collab.payment?.tranche2 || collab.payment?.portion2 || {}),
                        amount: split.secondPayoutAmount,
                        releasedAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                        status: 'pending',
                    },
                },
                firstPayoutAmount: split.firstPayoutAmount,
                secondPayoutAmount: split.secondPayoutAmount,
                firstPayoutReleasedAt: now,
            },
        },
            { new: true, strict: false }
        ).lean();

        await Notification.create([
            {
                recipientUserId: collab.brandUserId,
                type: 'system',
                title: 'Post verified',
                message: `The post for "${collab.campaignTitle}" has been verified and the first payout was released.`,
                campaignRequestId: collab._id,
                metadata: { action: 'verify-admin', status: 'campaign_active' },
            },
            {
                recipientUserId: collab.influencerUserId,
                type: 'system',
                title: 'First payout released',
                message: `Your post for "${collab.campaignTitle}" has been verified by admin. The first payout was released.`,
                campaignRequestId: collab._id,
                metadata: { action: 'verify-admin', status: 'campaign_active' },
            },
        ]).catch((notificationError) => {
            console.error('[collaborationRoutes] Verify notification create failed:', notificationError);
        });

        const [brandUser, influencerUser] = await Promise.all([
            User.findById(collab.brandUserId).select('email').lean(),
            User.findById(collab.influencerUserId).select('email').lean(),
        ]);
        const verifyBrandMessage = `The post for "${collab.campaignTitle}" has been verified and the first payout was released.`;
        await Promise.all([
            sendCampaignEmailNotification({
                email: brandUser?.email,
                subject: 'Post verified',
                title: 'Post verified',
                message: verifyBrandMessage,
                actionText: 'View collaboration',
                actionHref: `/dashboard/brand/collaborations?request=${collab._id}`,
            }),
            sendCampaignEmailNotification({
                email: influencerUser?.email,
                subject: 'First payout released',
                title: 'First payout released',
                message: `Your post for "${collab.campaignTitle}" has been verified by admin. The first payout was released.`,
                actionText: 'View collaboration',
                actionHref: `/dashboard/influencer/collaborations?request=${collab._id}`,
            }),
        ]);

        emitCollaborationEvent(req, [collab.brandUserId, collab.influencerUserId], 'collaboration:updated', {
            collaborationId: collab._id,
            status: 'campaign_active',
            action: 'verify-admin',
        });
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/stop', async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (String(collab.status) === 'completed' || String(collab.status) === 'cancelled') {
            return throwStatusError(collab.status, res);
        }

        const canStop = isAdmin(req.user) || (req.user?.role === 'brand' && await canManageBrandCollaboration(collab, req.user));
        if (!canStop) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const now = new Date();
        const stoppedBy = isAdmin(req.user) ? 'admin' : 'brand';
        const reason = String(req.body?.reason || `Stopped by ${stoppedBy}`).trim();
        const updated = await CampaignRequest.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    status: 'cancelled',
                    cancelledAt: now,
                    campaignCompletedAt: now,
                    ...(stoppedBy === 'admin' ? { adminStoppedAt: now, adminStopReason: reason } : { brandStoppedAt: now, brandStopReason: reason }),
                    payment: {
                        ...(collab.payment || {}),
                        portion1: {
                            ...(collab.payment?.portion1 || {}),
                        },
                        portion2: {
                            ...(collab.payment?.portion2 || {}),
                            status: 'held',
                        },
                        tranche1: {
                            ...(collab.payment?.tranche1 || collab.payment?.portion1 || {}),
                        },
                        tranche2: {
                            ...(collab.payment?.tranche2 || collab.payment?.portion2 || {}),
                            status: 'held',
                        },
                    },
                },
            },
            { new: true, strict: false }
        ).lean();

        const [admins] = await Promise.all([
            getAdminRecipients(),
            Notification.create([
                {
                    recipientUserId: collab.brandUserId,
                    type: 'system',
                    title: `Collaboration stopped by ${stoppedBy}`,
                    message: `The collaboration "${collab.campaignTitle}" was stopped by ${stoppedBy}.`,
                    campaignRequestId: collab._id,
                    metadata: { action: 'stop', reason, stoppedBy },
                },
                {
                    recipientUserId: collab.influencerUserId,
                    type: 'system',
                    title: `Collaboration stopped by ${stoppedBy}`,
                    message: `The collaboration "${collab.campaignTitle}" was stopped by ${stoppedBy}.`,
                    campaignRequestId: collab._id,
                    metadata: { action: 'stop', reason, stoppedBy },
                },
                ...admins.map((admin) => ({
                    recipientUserId: admin._id,
                    type: 'system',
                    title: 'Collaboration stopped',
                    message: `The collaboration "${collab.campaignTitle}" was stopped by ${stoppedBy}.`,
                    campaignRequestId: collab._id,
                    metadata: { action: 'stop', reason, stoppedBy },
                })),
            ]).catch((notificationError) => {
                console.error('[collaborationRoutes] Stop notification create failed:', notificationError);
            }),
        ]);

        const [brandUser, influencerUser] = await Promise.all([
            User.findById(collab.brandUserId).select('email').lean(),
            User.findById(collab.influencerUserId).select('email').lean(),
        ]);
        const stopMessage = `The collaboration "${collab.campaignTitle}" was stopped by ${stoppedBy}.`;
        await Promise.all([
            sendCampaignEmailNotification({
                email: brandUser?.email,
                subject: `Collaboration stopped by ${stoppedBy}`,
                title: 'Collaboration stopped',
                message: stopMessage,
                actionText: 'View collaboration',
                actionHref: `/dashboard/brand/collaborations?request=${collab._id}`,
            }),
            sendCampaignEmailNotification({
                email: influencerUser?.email,
                subject: `Collaboration stopped by ${stoppedBy}`,
                title: 'Collaboration stopped',
                message: stopMessage,
                actionText: 'View collaboration',
                actionHref: `/dashboard/influencer/collaborations?request=${collab._id}`,
            }),
        ]);

        emitCollaborationEvent(req, [collab.brandUserId, collab.influencerUserId, ...admins.map((admin) => admin._id)], 'collaboration:updated', {
            collaborationId: collab._id,
            status: 'cancelled',
            action: 'stop',
        });

        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/:id/analytics', async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        const { brandProfile, influencerProfile } = await getBrandAndInfluencerProfiles(collab);
        if (!canAccessCollaboration(collab, req.user, brandProfile, influencerProfile)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const enriched = buildResponseCollab(collab, brandProfile, influencerProfile);
        const analytics = await buildCollaborationAnalytics(enriched);
        return res.json({
            success: true,
            collaboration: enriched,
            ...analytics,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/:id/pdf', async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        const { brandProfile, influencerProfile } = await getBrandAndInfluencerProfiles(collab);
        if (!canAccessCollaboration(collab, req.user, brandProfile, influencerProfile)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const enriched = buildResponseCollab(collab, brandProfile, influencerProfile);
        const analytics = await buildCollaborationAnalytics(enriched);
        const pdfBuffer = await buildCollaborationPdfBuffer({ collaboration: enriched, analytics });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${String(enriched.campaignTitle || 'collaboration').replace(/[^a-z0-9-_]+/gi, '_').replace(/_+/g, '_').toLowerCase()}.pdf"`);
        return res.send(pdfBuffer);
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
