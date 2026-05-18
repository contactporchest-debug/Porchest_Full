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
    ensureTrackingAssets,
} = require('../services/trackingService');
const { computeFixedCampaignPricing, toNumber: toCampaignNumber } = require('../services/campaignPricingService');
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

function isValidHttpUrl(value) {
    try {
        const url = new URL(String(value || '').trim());
        return ['http:', 'https:'].includes(url.protocol);
    } catch (error) {
        return false;
    }
}

function isValidPaymentProofAsset(value) {
    const proof = String(value || '').trim();
    if (!proof) return false;
    if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(proof)) return true;
    return isValidHttpUrl(proof);
}

function getRevertStatusForRevision(collab) {
    const status = String(collab?.status || '').toLowerCase();
    if (status === 'content_submitted') return 'brand_paid_work_can_start';
    if (status === 'posted') return 'content_approved';
    if (status === 'content_approved') return 'content_submitted';
    return 'brand_paid_work_can_start';
}

async function submitDriveLink(req, res, collab, driveLink) {
    if (!inStatusList(collab.status, ['brand_paid_work_can_start', 'content_submitted'])) {
        return throwStatusError(collab.status, res);
    }
    if (String(collab.payment_status || 'pending') !== 'verified') {
        return res.status(400).json({ success: false, error: 'Payment must be verified before work can start' });
    }

    const submittedDriveLink = String(driveLink || '').trim();
    if (!isValidHttpUrl(submittedDriveLink)) {
        return res.status(400).json({ success: false, error: 'driveLink must be a valid URL' });
    }

    const now = new Date();
    const updated = await CampaignRequest.findByIdAndUpdate(
        collab._id,
        {
            $set: {
                status: 'content_submitted',
                draftDriveLink: submittedDriveLink,
                draftSubmittedAt: now,
                'content.driveLink': submittedDriveLink,
                'content.driveSubmittedAt': now,
            },
        },
        { new: true, strict: false }
    ).lean();

    return res.json(await enrichCollaboration(updated));
}

async function submitInstagramLink(req, res, collab, postLink) {
    if (String(collab.status) !== 'content_approved') return throwStatusError(collab.status, res);
    if (String(collab.payment_status || 'pending') !== 'verified') {
        return res.status(400).json({ success: false, error: 'Payment must be verified before work can start' });
    }

    const submittedPostLink = String(postLink || '').trim();
    if (!isValidHttpUrl(submittedPostLink) || !/instagram\.com/i.test(submittedPostLink)) {
        return res.status(400).json({ success: false, error: 'instagram link must be a valid Instagram URL' });
    }

    const now = new Date();
    await CampaignRequest.findByIdAndUpdate(
        collab._id,
        {
            $set: {
                status: 'posted',
                postLink: submittedPostLink,
                postSubmittedAt: now,
                'content.postLink': submittedPostLink,
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
            metadata: { action: 'submit-post', postLink: submittedPostLink },
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
            metadata: { action: 'submit-post', postLink: submittedPostLink, collabStatus: 'posted' },
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
    const agreedFee = toNumber(pricing.agreedFee ?? legacy.agreedFee ?? legacy.agreedPrice, 0);
    const currency = pricing.currency || legacy.currency || 'USD';

    return {
        brandOffer,
        agreedFee,
        currency,
    };
}

function resolveRequestedContentTypes(body = {}, brief = {}) {
    return normalizeContentTypes(
        body.selectedContentTypes
        || body.contentTypes
        || body.contentType
        || brief.contentType
        || brief.contentTypes
        || body.deliverables
        || brief.deliverables
    );
}

function resolveTrackingState(doc) {
    const trackingEnabled = Boolean(doc?.trackingEnabledForCampaign);
    const trackingAccepted = Boolean(doc?.trackingAcceptedByInfluencer);
    const trackingLink = doc?.brief?.trackingLink || null;
    // Show tracking link if tracking is enabled and link exists.
    // Auto-accepted Shopify connections don't need separate influencer acceptance.
    const visible = trackingEnabled && trackingLink;
    return {
        trackingEnabledForCampaign: trackingEnabled,
        trackingAcceptedByInfluencer: trackingAccepted,
        trackingDetails: doc?.trackingDetails || {},
        trackingLinkVisible: Boolean(visible),
        trackingLink: visible ? trackingLink : null,
        promoCode: visible ? (doc?.brief?.promoCode || null) : null,
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
    const paymentStatus = doc.payment_status || 'pending';

    return {
        status: payment.status || 'pending',
        payment_status: paymentStatus,
        paymentStatus,
        payment_proof: doc.payment_proof || null,
        paymentProof: doc.payment_proof || null,
        payment_amount: doc.payment_amount ?? null,
        paymentAmount: doc.payment_amount ?? null,
        payment_method: doc.payment_method || 'Easypaisa',
        paymentMethod: doc.payment_method || 'Easypaisa',
        payment_timestamp: doc.payment_timestamp || null,
        paymentTimestamp: doc.payment_timestamp || null,
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
    const tracking = resolveTrackingState(doc);
    brief.trackingLink = tracking.trackingLink;
    brief.promoCode = tracking.promoCode;

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
        trackingEnabledForCampaign: tracking.trackingEnabledForCampaign,
        trackingAcceptedByInfluencer: tracking.trackingAcceptedByInfluencer,
        trackingDetails: tracking.trackingDetails,
        trackingLinkVisible: tracking.trackingLinkVisible,
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
    update.payment_status = 'pending';
    update.payment_proof = null;
    update.payment_amount = toNumber(
        collab.pricing?.brandOffer ?? collab.financials?.brandOfferedFee ?? collab.brandOfferedFee ?? collab.agreedPrice,
        0
    );
    update.payment_method = 'Easypaisa';
    update.payment_timestamp = null;
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

async function submitBrandPaymentProof(req, collabId, collab, { paymentAmount, proofUrl, paymentMethod } = {}) {
    const proof = String(proofUrl || '').trim();
    const amount = toNumber(paymentAmount, toNumber(
        collab.payment_amount
        ?? collab.pricing?.agreedFee
        ?? collab.financials?.agreedFee
        ?? collab.agreedFee
        ?? collab.agreedPrice,
        null
    ));
    const method = String(paymentMethod || 'Easypaisa').trim() || 'Easypaisa';

    if (!isValidPaymentProofAsset(proof)) {
        throw new Error('payment proof must be a valid image upload or URL');
    }
    if (amount == null || Number.isNaN(amount) || amount <= 0) {
        throw new Error('payment amount must be a valid number');
    }

    const now = new Date();
    const updated = await CampaignRequest.findByIdAndUpdate(
        collabId,
        {
            $set: {
                payment_status: 'proof_submitted',
                payment_proof: proof,
                payment_amount: amount,
                payment_method: method,
                payment_timestamp: now,
                brandPaymentStatus: 'pending',
            },
        },
        { new: true, strict: false }
    ).lean();

    const [admins, brandUser] = await Promise.all([
        getAdminRecipients(),
        User.findById(collab.brandUserId).select('email fullName').lean(),
    ]);

    const title = 'Payment pending verification';
    const message = `${collab.brandName || 'The brand'} submitted payment proof for "${collab.campaignTitle}" and it is waiting for admin verification.`;
    await Promise.all([
        sendCampaignEmailNotification({
            email: brandUser?.email,
            subject: title,
            title,
            message: 'Your payment proof was received and is waiting for admin verification.',
            actionText: 'View collaboration',
            actionHref: `/dashboard/brand/collaborations?request=${collab._id}`,
        }),
        ...admins.map((admin) => sendCampaignEmailNotification({
            email: admin.email,
            subject: title,
            title,
            message,
            actionText: 'Review payment queue',
            actionHref: '/dashboard/admin/payments',
            accent: '#C2340A',
        })),
    ]);

    await Notification.insertMany([
        {
            recipientUserId: collab.brandUserId,
            type: 'system',
            title,
            message: 'Your payment proof was submitted and is waiting for admin verification.',
            campaignRequestId: collab._id,
            metadata: { action: 'complete-payment', paymentStatus: 'proof_submitted' },
        },
        ...admins.map((admin) => ({
            recipientUserId: admin._id,
            type: 'system',
            title,
            message,
            campaignRequestId: collab._id,
            metadata: { action: 'complete-payment', paymentStatus: 'proof_submitted' },
        })),
    ]).catch((notificationError) => {
        console.error('[collaborationRoutes] Payment proof notification create failed:', notificationError);
    });

    emitCollaborationEvent(req, [collab.brandUserId, ...admins.map((admin) => admin._id)], 'collaboration:updated', {
        collaborationId: collab._id,
        status: 'brand_payment_pending',
        payment_status: 'proof_submitted',
        action: 'complete-payment',
    });

    return updated;
}

async function markBrandPaymentVerified(req, collabId, collab, adminUser) {
    const now = new Date();
    const updated = await CampaignRequest.findByIdAndUpdate(
        collabId,
        {
            $set: {
                status: 'brand_paid_work_can_start',
                brandPaymentStatus: 'paid',
                brandPaymentReceivedAt: now,
                payment_status: 'verified',
                brandPaymentIntentId: collab.brandPaymentIntentId || null,
                campaignActiveAt: null,
            },
        },
        { new: true, strict: false }
    ).lean();

    const [brandUser, influencerUser] = await Promise.all([
        User.findById(collab.brandUserId).select('email fullName').lean(),
        User.findById(collab.influencerUserId).select('email fullName').lean(),
    ]);

    const title = 'Payment verified';
    const message = `Payment for "${collab.campaignTitle}" has been verified. The campaign can now move into production.`;
    await Promise.all([
        sendCampaignEmailNotification({
            email: brandUser?.email,
            subject: title,
            title,
            message,
            actionText: 'View collaboration',
            actionHref: `/dashboard/brand/collaborations?request=${collab._id}`,
        }),
        sendCampaignEmailNotification({
            email: influencerUser?.email,
            subject: title,
            title,
            message: `${collab.brandName || 'The brand'} payment has been verified. You can now start production.`,
            actionText: 'View collaboration',
            actionHref: `/dashboard/influencer/collaborations?request=${collab._id}`,
        }),
    ]);

    await Notification.insertMany([
        {
            recipientUserId: collab.brandUserId,
            type: 'system',
            title,
            message,
            campaignRequestId: collab._id,
            metadata: { action: 'verify-payment', paymentStatus: 'verified', verifiedBy: adminUser?._id || null },
        },
        {
            recipientUserId: collab.influencerUserId,
            type: 'system',
            title,
            message: `${collab.brandName || 'The brand'} payment has been verified. You can now start production.`,
            campaignRequestId: collab._id,
            metadata: { action: 'verify-payment', paymentStatus: 'verified', verifiedBy: adminUser?._id || null },
        },
    ]).catch((notificationError) => {
        console.error('[collaborationRoutes] Payment verify notification create failed:', notificationError);
    });

    emitCollaborationEvent(req, [collab.brandUserId, collab.influencerUserId], 'collaboration:updated', {
        collaborationId: collab._id,
        status: 'brand_paid_work_can_start',
        payment_status: 'verified',
        action: 'verify-payment',
    });

    return updated;
}

async function markBrandPaymentRejected(req, collabId, collab, reason, adminUser) {
    const updated = await CampaignRequest.findByIdAndUpdate(
        collabId,
        {
            $set: {
                payment_status: 'rejected',
                brandPaymentStatus: 'failed',
                rejectionReason: reason || 'Payment proof rejected',
            },
        },
        { new: true, strict: false }
    ).lean();

    const brandUser = await User.findById(collab.brandUserId).select('email fullName').lean();
    const title = 'Payment rejected';
    const message = reason || `Payment proof for "${collab.campaignTitle}" was rejected. Please resubmit a clearer proof.`;
    await Promise.all([
        sendCampaignEmailNotification({
            email: brandUser?.email,
            subject: title,
            title,
            message,
            actionText: 'View collaboration',
            actionHref: `/dashboard/brand/collaborations?request=${collab._id}`,
        }),
    ]);

    await Notification.create({
        recipientUserId: collab.brandUserId,
        type: 'system',
        title,
        message,
        campaignRequestId: collab._id,
        metadata: { action: 'reject-payment', paymentStatus: 'rejected', rejectedBy: adminUser?._id || null },
    }).catch((notificationError) => {
        console.error('[collaborationRoutes] Payment reject notification create failed:', notificationError);
    });

    emitCollaborationEvent(req, [collab.brandUserId], 'collaboration:updated', {
        collaborationId: collab._id,
        status: collab.status,
        payment_status: 'rejected',
        action: 'reject-payment',
    });

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
        const selectedContentTypes = resolveRequestedContentTypes(req.body, brief);
        const fixedPricing = computeFixedCampaignPricing(influencerProfile, selectedContentTypes, req.body?.pricing?.brandOffer ?? req.body?.agreedPrice ?? req.body?.brandOffer ?? 0);
        const pricing = normalizePricingInput(req.body.pricing || {}, req.body);
        const agreedFee = fixedPricing.totalPrice > 0 ? fixedPricing.totalPrice : pricing.agreedFee || pricing.brandOffer || 0;
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
                contentType: selectedContentTypes,
                contentTypes: selectedContentTypes,
                deliverables: selectedContentTypes,
                porchestContact,
            },
            pricing: {
                ...pricing,
                brandOffer: agreedFee,
                agreedFee,
            },
            financials: {
                brandOfferedFee: agreedFee,
                agreedFee,
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
            brandOfferedFee: agreedFee,
            agreedPrice: agreedFee,
            brandOffer: agreedFee,
            timeline: {
                gracePeriodDays: 3,
            },
            trackingEnabledForCampaign: false,
            trackingAcceptedByInfluencer: false,
            trackingDetails: {
                enabled: false,
                accepted: false,
                platform: 'shopify',
                contentTypes: selectedContentTypes,
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

router.patch('/:id/accept', roleMiddleware('influencer'), async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (!inStatusList(collab.status, ['requested', 'sent', 'viewed', 'pending'])) return throwStatusError(collab.status, res);

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

router.patch('/:id/complete-payment', roleMiddleware('brand'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (String(collab.status) !== 'brand_payment_pending') return throwStatusError(collab.status, res);

        const { brandProfile } = await getUserProfiles(req.user._id);
        if (!canAccessCollaboration(collab, req.user, brandProfile, null)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const updated = await submitBrandPaymentProof(req, req.params.id, collab, {
            paymentAmount: req.body?.payment_amount ?? req.body?.paymentAmount ?? req.body?.amount,
            proofUrl: req.body?.proof_file ?? req.body?.proofFile ?? req.body?.proof_url ?? req.body?.proofUrl ?? req.body?.payment_proof,
            paymentMethod: req.body?.payment_method ?? req.body?.paymentMethod ?? 'Easypaisa',
        });
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

        const proofUrl = req.body?.proof_file ?? req.body?.proofFile ?? req.body?.proof_url ?? req.body?.proofUrl ?? req.body?.payment_proof;
        if (!proofUrl) {
            return res.status(400).json({ success: false, error: 'payment proof screenshot is required' });
        }

        const updated = await submitBrandPaymentProof(req, req.params.id, collab, {
            paymentAmount: req.body?.payment_amount ?? req.body?.paymentAmount ?? req.body?.amount,
            proofUrl,
            paymentMethod: req.body?.payment_method ?? req.body?.paymentMethod ?? 'Easypaisa',
        });
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/counter', (_req, res) => {
    res.status(410).json({
        success: false,
        error: 'Counter offers are no longer supported. Porchest now uses fixed-price collaborations only.',
    });
});

router.get('/:id/tracking/status', async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        const { brandProfile, influencerProfile } = await getBrandAndInfluencerProfiles(collab);
        if (!canAccessCollaboration(collab, req.user, brandProfile, influencerProfile)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const tracking = resolveTrackingState(collab);
        return res.json({
            success: true,
            collaborationId: String(collab._id),
            ...tracking,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/:id/tracking/enable', roleMiddleware('brand'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        const { brandProfile } = await getUserProfiles(req.user._id);
        if (!canAccessCollaboration(collab, req.user, brandProfile, null)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const enable = req.body?.enable !== false;
        const updates = {
            trackingEnabledForCampaign: enable,
            trackingAcceptedByInfluencer: enable ? Boolean(collab.trackingAcceptedByInfluencer) : false,
            trackingDetails: {
                ...(collab.trackingDetails || {}),
                enabled: enable,
                platform: req.body?.platform || collab.trackingDetails?.platform || 'shopify',
                enabledAt: enable ? new Date() : null,
                disabledAt: enable ? null : new Date(),
            },
        };

        if (enable) {
            const ensured = await ensureTrackingAssets(collab._id);
            if (ensured?.success === false && ensured?.error) {
                return res.status(400).json({ success: false, error: ensured.error });
            }
            updates.trackingDetails = {
                ...(updates.trackingDetails || {}),
                trackingLinkGenerated: true,
                promoCodeGenerated: true,
            };
        }

        const updated = await CampaignRequest.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, strict: false }
        ).lean();

        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/:id/influencer/tracking', roleMiddleware('influencer'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        const { influencerProfile } = await getUserProfiles(req.user._id);
        if (!canAccessCollaboration(collab, req.user, null, influencerProfile)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const tracking = resolveTrackingState(collab);
        return res.json({
            success: true,
            collaborationId: String(collab._id),
            trackingEnabledForCampaign: tracking.trackingEnabledForCampaign,
            trackingAcceptedByInfluencer: tracking.trackingAcceptedByInfluencer,
            trackingLink: tracking.trackingLink,
            promoCode: tracking.promoCode,
            trackingDetails: tracking.trackingDetails,
            message: tracking.trackingEnabledForCampaign
                ? (tracking.trackingAcceptedByInfluencer ? 'Tracking active' : 'Please accept tracking for this campaign')
                : 'Tracking not enabled for this collaboration',
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/:id/influencer/tracking/accept', roleMiddleware('influencer'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        const { influencerProfile } = await getUserProfiles(req.user._id);
        if (!canAccessCollaboration(collab, req.user, null, influencerProfile)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        if (!collab.trackingEnabledForCampaign) {
            return res.status(400).json({ success: false, error: 'Tracking has not been enabled for this collaboration yet' });
        }

        const ensured = await ensureTrackingAssets(collab._id);
        if (ensured?.success === false && ensured?.error) {
            return res.status(400).json({ success: false, error: ensured.error });
        }

        const updated = await CampaignRequest.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    trackingAcceptedByInfluencer: true,
                    trackingDetails: {
                        ...(collab.trackingDetails || {}),
                        accepted: true,
                        acceptedAt: new Date(),
                        acceptedByUserId: req.user._id,
                    },
                },
            },
            { new: true, strict: false }
        ).lean();

        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/requirements', roleMiddleware('brand'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        if (!inStatusList(collab.status, ['pending', 'accepted', 'brand_payment_pending', 'brand_paid_work_can_start'])) {
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
        }).catch((notificationError) => {
            console.error('[collaborationRoutes] approve-drive email notification failed:', notificationError);
        });
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/decline', roleMiddleware('influencer'), async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        const { influencerProfile } = await getUserProfiles(req.user._id);
        if (!canAccessCollaboration(collab, req.user, null, influencerProfile)) {
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

router.post('/:id/submit-drive-link', roleMiddleware('influencer'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        return submitDriveLink(req, res, collab, req.body.url || req.body.driveLink);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/submit-drive', roleMiddleware('influencer'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        return submitDriveLink(req, res, collab, req.body.driveLink);
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
        if (!feedback) {
            return res.status(400).json({ success: false, error: 'Feedback is required when requesting a revision' });
        }

        const nextStatus = getRevertStatusForRevision(collab);
        const update = {
            $set: {
                status: nextStatus,
            },
            $inc: { revisionsUsed: 1, 'content.revisionsUsed': 1 },
            $push: { brandFeedback: feedback },
        };

        update.$set.rejectionReason = feedback;
        if (nextStatus === 'brand_paid_work_can_start') {
            update.$set['content.driveLink'] = '';
            update.$set['content.driveSubmittedAt'] = null;
            update.$set['content.brandApprovedDrive'] = false;
            update.$set['content.brandApprovedAt'] = null;
            update.$set.draftDriveLink = '';
            update.$set.draftSubmittedAt = null;
            update.$set.draftApprovedAt = null;
        }
        const updated = await CampaignRequest.findByIdAndUpdate(req.params.id, update, { new: true, strict: false }).lean();
        return res.json(await enrichCollaboration(updated));
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/:id/submit-instagram-link', roleMiddleware('influencer'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        return submitInstagramLink(req, res, collab, req.body.url || req.body.postLink);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.patch('/:id/submit-post', roleMiddleware('influencer'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });
        return submitInstagramLink(req, res, collab, req.body.postLink);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/:id/feedback', roleMiddleware('brand', 'admin'), requireCompleteProfile, async (req, res) => {
    try {
        const collab = await CampaignRequest.findById(req.params.id).lean();
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found' });

        const allowed = await canManageBrandCollaboration(collab, req.user);
        if (!allowed && !isAdmin(req.user)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const message = String(req.body.message || '').trim();
        const requestRevision = Boolean(req.body.requestRevision);
        if (!message) {
            return res.status(400).json({ success: false, error: 'Feedback message is required' });
        }

        const nextStatus = requestRevision ? getRevertStatusForRevision(collab) : String(collab.status || '');
        const update = {
            $push: { brandFeedback: message },
            $set: {
                rejectionReason: message,
            },
        };

        if (requestRevision) {
            update.$set.status = nextStatus;
            if (nextStatus === 'brand_paid_work_can_start') {
                update.$set['content.driveLink'] = '';
                update.$set['content.driveSubmittedAt'] = null;
                update.$set['content.brandApprovedDrive'] = false;
                update.$set['content.brandApprovedAt'] = null;
                update.$set.draftDriveLink = '';
                update.$set.draftSubmittedAt = null;
                update.$set.draftApprovedAt = null;
            }
            if (nextStatus === 'content_submitted') {
                update.$set['content.postLink'] = '';
                update.$set['content.postSubmittedAt'] = null;
                update.$set.postLink = '';
                update.$set.postSubmittedAt = null;
                update.$set['content.brandVerifiedPost'] = false;
                update.$set['content.brandVerifiedAt'] = null;
                update.$set.brandVerifiedPost = false;
                update.$set.brandVerifiedAt = null;
            }
        }

        const updated = await CampaignRequest.findByIdAndUpdate(req.params.id, update, { new: true, strict: false }).lean();
        const influencerUser = await User.findById(collab.influencerUserId).select('email').lean();
        await sendCampaignEmailNotification({
            email: influencerUser?.email,
            subject: requestRevision ? 'Revision requested' : 'Campaign feedback',
            title: requestRevision ? 'Revision requested' : 'Campaign feedback',
            message,
            actionText: 'View collaboration',
            actionHref: `/dashboard/influencer/collaborations?request=${collab._id}`,
        }).catch((notificationError) => {
            console.error('[collaborationRoutes] feedback email notification failed:', notificationError);
        });
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
        const periodDays = Number(req.query?.period || req.query?.days || 30);
        const analytics = await buildCollaborationAnalytics({ ...enriched, analyticsPeriodDays: periodDays });
        return res.json({
            success: true,
            collaboration: enriched,
            periodDays: [10, 20, 30].includes(periodDays) ? periodDays : 30,
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
