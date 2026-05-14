const mongoose = require('mongoose');

function mergeFieldPair(target, source, left, right) {
    const hasLeft = Object.prototype.hasOwnProperty.call(source, left);
    const hasRight = Object.prototype.hasOwnProperty.call(source, right);

    if (hasLeft && !hasRight) target[right] = source[left];
    if (!hasLeft && hasRight) target[left] = source[right];
}

function normalizeUpdate(update, pairs) {
    if (!update || typeof update !== 'object') return update;

    const buckets = [update, update.$set, update.$setOnInsert];
    for (const bucket of buckets) {
        if (!bucket || typeof bucket !== 'object') continue;
        for (const [left, right] of pairs) {
            mergeFieldPair(bucket, bucket, left, right);
        }
    }

    return update;
}

function hydrateLegacyShapes(doc) {
    if (!doc) return;

    doc.brandId = doc.brandId || doc.brandProfileId || null;
    doc.influencerId = doc.influencerId || doc.influencerProfileId || null;
    doc.assignedEmployeeFK = doc.assignedEmployeeFK || null;

    doc.brief = doc.brief || {};
    if (!doc.brief.brandIntro && doc.brandMessage) doc.brief.brandIntro = doc.brandMessage;
    if (!doc.brief.campaignObjective && doc.campaignType) doc.brief.campaignObjective = doc.campaignType;
    if (!doc.brief.targetAudienceDesc && doc.brief.targetAudience) doc.brief.targetAudienceDesc = doc.brief.targetAudience;
    if (!doc.brief.deliverables && doc.deliverables) {
        doc.brief.deliverables = Array.isArray(doc.deliverables)
            ? doc.deliverables
            : String(doc.deliverables).split(',').map((item) => item.trim()).filter(Boolean);
    }
    if (!doc.brief.productDetails && doc.campaignDescription) doc.brief.productDetails = doc.campaignDescription;
    if (!doc.brief.callToAction && doc.contentGuidelines) doc.brief.callToAction = doc.contentGuidelines;
    if (!doc.brief.requiredHashtags && doc.hashtags) {
        doc.brief.requiredHashtags = Array.isArray(doc.hashtags)
            ? doc.hashtags
            : String(doc.hashtags).split(',').map((item) => item.trim()).filter(Boolean);
    }
    if (!doc.brief.hashtags && doc.brief.requiredHashtags) doc.brief.hashtags = doc.brief.requiredHashtags;
    if (!doc.brief.contentType && doc.brief.contentTypes) doc.brief.contentType = doc.brief.contentTypes;
    if (!doc.brief.mandatoryPoints && doc.brief.mandatoryTalkingPoints) doc.brief.mandatoryPoints = doc.brief.mandatoryTalkingPoints.join(', ');
    if (!doc.brief.dosAndDonts && (doc.brief.dos || doc.brief.donts)) {
        const dos = Array.isArray(doc.brief.dos) ? doc.brief.dos.join(', ') : doc.brief.dos || '';
        const donts = Array.isArray(doc.brief.donts) ? doc.brief.donts.join(', ') : doc.brief.donts || '';
        doc.brief.dosAndDonts = [dos, donts].filter(Boolean).join('\n');
    }
    if (!doc.brief.approvalProcess && doc.revisionRounds != null) doc.brief.approvalProcess = `${doc.revisionRounds} revision round(s)`;
    if (!doc.brief.disclosureRequired && doc.disclosureRequirements) doc.brief.disclosureRequired = doc.disclosureRequirements;
    if (!doc.brief.postingSchedule && doc.postingDeadline) doc.brief.postingSchedule = doc.postingDeadline;

    doc.financials = doc.financials || {};
    doc.pricing = doc.pricing || {};
    if (doc.brandOfferedFee == null && doc.agreedPrice != null) doc.brandOfferedFee = doc.agreedPrice;
    if (doc.agreedFee == null && doc.agreedPrice != null) doc.agreedFee = doc.agreedPrice;
    if (doc.financials.brandOfferedFee == null && doc.brandOfferedFee != null) doc.financials.brandOfferedFee = doc.brandOfferedFee;
    if (doc.financials.agreedFee == null && doc.agreedFee != null) doc.financials.agreedFee = doc.agreedFee;
    if (doc.financials.influencerCounterFee == null && doc.counterOfferPrice != null) doc.financials.influencerCounterFee = doc.counterOfferPrice;
    if (doc.financials.porchestCommission == null && doc.porchestCommission != null) doc.financials.porchestCommission = doc.porchestCommission;
    if (doc.financials.influencerPayable == null && doc.influencerPayable != null) doc.financials.influencerPayable = doc.influencerPayable;
    if (doc.financials.currency == null && doc.currency) doc.financials.currency = doc.currency;
    if (doc.pricing.brandOffer == null && doc.brandOfferedFee != null) doc.pricing.brandOffer = doc.brandOfferedFee;
    if (doc.pricing.influencerCounter == null && doc.influencerCounterFee != null) doc.pricing.influencerCounter = doc.influencerCounterFee;
    if (doc.pricing.agreedFee == null && doc.agreedFee != null) doc.pricing.agreedFee = doc.agreedFee;
    if (doc.pricing.currency == null && doc.currency) doc.pricing.currency = doc.currency;

    doc.payment = doc.payment || {};
    doc.payment.tranche1 = doc.payment.tranche1 || {};
    doc.payment.tranche2 = doc.payment.tranche2 || {};
    if (!doc.payment.status && doc.paymentStatus) doc.payment.status = doc.paymentStatus;
    if (!doc.payment.portion1) doc.payment.portion1 = {};
    if (!doc.payment.portion2) doc.payment.portion2 = {};
    if (doc.payment.portion1.amount == null && doc.payment.tranche1.amount != null) doc.payment.portion1.amount = doc.payment.tranche1.amount;
    if (doc.payment.portion1.releasedAt == null && doc.payment.tranche1.releasedAt != null) doc.payment.portion1.releasedAt = doc.payment.tranche1.releasedAt;
    if (doc.payment.portion1.status == null && doc.payment.tranche1.status != null) doc.payment.portion1.status = doc.payment.tranche1.status;
    if (doc.payment.portion2.amount == null && doc.payment.tranche2.amount != null) doc.payment.portion2.amount = doc.payment.tranche2.amount;
    if (doc.payment.portion2.releasedAt == null && doc.payment.tranche2.releasedAt != null) doc.payment.portion2.releasedAt = doc.payment.tranche2.releasedAt;
    if (doc.payment.portion2.status == null && doc.payment.tranche2.status != null) doc.payment.portion2.status = doc.payment.tranche2.status;

    doc.metrics = doc.metrics || {};
    if (doc.metrics.reach == null && doc.accountReach != null) doc.metrics.reach = doc.accountReach;
    if (doc.metrics.impressions == null && doc.accountImpressions != null) doc.metrics.impressions = doc.accountImpressions;
    if (doc.metrics.engagementRate == null && doc.engagementRate != null) doc.metrics.engagementRate = doc.engagementRate;
    if (doc.metrics.roas == null && doc.revenue != null && doc.agreedFee) doc.metrics.roas = doc.agreedFee ? doc.revenue / doc.agreedFee : null;
    if (doc.metrics.cpa == null && doc.agreedFee != null && doc.conversions != null) {
        doc.metrics.cpa = doc.conversions > 0 ? doc.agreedFee / doc.conversions : null;
    }

    if (!doc.createdAt && doc.sentAt) doc.createdAt = doc.sentAt;
}

const campaignRequestSchema = new mongoose.Schema(
    {
        requestCode: { type: String, unique: true },

        // New canonical relations
        brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandProfile', index: true },
        influencerId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerProfile', index: true },
        assignedEmployeeFK: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

        status: {
            type: String,
            enum: [
                'pending_influencer',
                'pending_brand_review',
                'pending',
                'countered',
                'brand_payment_pending',
                'brand_paid_work_can_start',
                'sent',
                'viewed',
                'negotiation',
                'accepted',
                'active',
                'content_submitted',
                'content_approved',
                'posted',
                'campaign_active',
                'rejected',
                'declined',
                'brand_approved',
                'live_post_submitted',
                'completed',
                'deal_closed',
                'expired',
                'cancelled',
            ],
            default: 'pending_influencer',
            index: true,
        },

        // Campaign brief
        brief: {
            brandIntro: { type: String },
            campaignObjective: { type: String },
            productDetails: { type: String },
            targetAudience: { type: String },
            targetAudienceDesc: { type: String },
            keyMessage: { type: String },
            contentTypes: [{ type: String }],
            contentType: [{ type: String }],
            creativeDirection: { type: String },
            mandatoryTalkingPoints: [{ type: String }],
            mandatoryPoints: { type: String },
            dos: [{ type: String }],
            donts: [{ type: String }],
            dosAndDonts: { type: String },
            captionGuidelines: { type: String },
            requiredHashtags: [{ type: String }],
            hashtags: [{ type: String }],
            requiredTags: [{ type: String }],
            callToAction: { type: String },
            trackingLink: { type: String },
            promoCode: { type: String },
            visualRequirements: { type: String },
            postingSchedule: { type: Date },
            postingDeadline: { type: Date },
            revisionRounds: { type: Number },
            approvalProcess: { type: String },
            deliverables: [{ type: String }],
            usageRights: { type: Boolean },
            usageRightsText: { type: String },
            disclosureRequired: { type: String },
            disclosureRequirements: { type: String },
            porchestContact: { type: String },
        },

        pricing: {
            brandOffer: { type: Number },
            influencerCounter: { type: Number },
            agreedFee: { type: Number },
            currency: { type: String, default: 'USD' },
        },

        financials: {
            brandOfferedFee: { type: Number },
            influencerCounterFee: { type: Number },
            agreedFee: { type: Number },
            porchestCommission: { type: mongoose.Schema.Types.Mixed },
            influencerPayable: { type: Number },
            currency: { type: String, default: 'USD' },
        },

        // Financials
        brandOfferedFee: { type: Number },
        influencerCounterFee: { type: Number },
        agreedFee: { type: Number },
        porchestCommission: { type: mongoose.Schema.Types.Mixed },
        influencerPayable: { type: Number },
        negotiationHistory: [{
            offeredBy: { type: String },
            amount: { type: Number },
            message: { type: String },
            timestamp: { type: Date, default: Date.now },
        }],

        // Campaign window
        campaignStartDate: { type: Date },
        campaignEndDate: { type: Date },
        gracePeriodDays: { type: Number, default: 3 },
        campaignReminderLastSentAt: { type: Date },

        timeline: {
            campaignStartDate: { type: Date },
            campaignEndDate: { type: Date },
            gracePeriodDays: { type: Number, default: 3 },
        },

        // Content submission
        draftDriveLink: { type: String },
        draftSubmittedAt: { type: Date },
        draftApprovedAt: { type: Date },
        brandFeedback: [{ type: String }],
        revisionsUsed: { type: Number, default: 0 },

        // Post verification
        postLink: { type: String },
        postSubmittedAt: { type: Date },
        brandVerifiedPost: { type: Boolean, default: false },
        brandVerifiedAt: { type: Date },
        adminVerifiedPost: { type: Boolean, default: false },
        adminVerifiedAt: { type: Date },
        adminVerifiedByFK: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

        content: {
            driveLink: { type: String },
            driveSubmittedAt: { type: Date },
            brandApprovedDrive: { type: Boolean, default: false },
            brandApprovedAt: { type: Date },
            revisionsUsed: { type: Number, default: 0 },
            postLink: { type: String },
            postSubmittedAt: { type: Date },
            brandVerifiedPost: { type: Boolean, default: false },
            brandVerifiedAt: { type: Date },
            adminVerified: { type: Boolean, default: false },
            adminVerifiedAt: { type: Date },
            adminVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        },

        // Payment tranches
        payment: {
            status: { type: String, enum: ['pending', 'partial', 'released'], default: 'pending' },
            portion1: {
                amount: { type: Number },
                releasedAt: { type: Date },
                status: { type: String, enum: ['pending', 'released', 'held'], default: 'pending' },
            },
            portion2: {
                amount: { type: Number },
                releasedAt: { type: Date },
                status: { type: String, enum: ['pending', 'released', 'held'], default: 'pending' },
            },
            tranche1: {
                amount: { type: Number },
                releasedAt: { type: Date },
                status: { type: String, enum: ['pending', 'released', 'held'], default: 'pending' },
            },
            tranche2: {
                amount: { type: Number },
                releasedAt: { type: Date },
                status: { type: String, enum: ['pending', 'released', 'held'], default: 'pending' },
            },
        },

        // Modern payment flow
        brandPaymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
        brandPaymentIntentId: { type: String },
        brandPaymentReceivedAt: { type: Date },
        platformFeePercent: { type: Number, default: 15 },
        platformFeeAmount: { type: Number, default: 0 },
        influencerNetAmount: { type: Number, default: 0 },
        firstPayoutAmount: { type: Number, default: 0 },
        secondPayoutAmount: { type: Number, default: 0 },
        firstTransferId: { type: String },
        secondTransferId: { type: String },
        firstPayoutReleasedAt: { type: Date },
        secondPayoutReleasedAt: { type: Date },
        verifiedLiveAt: { type: Date },
        campaignStartAt: { type: Date },
        campaignEndAt: { type: Date },
        campaignActiveAt: { type: Date },
        campaignCompletedAt: { type: Date },

        // Live metrics
        metrics: {
            clicks: { type: Number, default: 0 },
            visits: { type: Number, default: 0 },
            conversions: { type: Number, default: 0 },
            revenue: { type: Number, default: 0 },
            reach: { type: Number, default: 0 },
            impressions: { type: Number, default: 0 },
            engagementRate: { type: Number, default: 0 },
            roas: { type: Number },
            cpa: { type: Number },
            lastUpdatedAt: { type: Date },
        },

        followerSnapshot: {
            baseline: {
                count: { type: Number },
                timestamp: { type: Date },
            },
            dailyReadings: [{
                count: { type: Number },
                timestamp: { type: Date },
            }],
            currentCount: { type: Number },
            netNewFollowers: { type: Number },
            growthRate: { type: Number },
            lastPolledAt: { type: Date },
        },

        // Legacy compatibility
        brandUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        influencerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        brandProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandProfile' },
        influencerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerProfile' },
        campaignTitle: { type: String, required: false },
        campaignDescription: { type: String },
        campaignType: { type: String, default: 'sponsored_post' },
        deliverables: { type: mongoose.Schema.Types.Mixed },
        requiredElements: { type: String },
        videoLength: { type: String },
        contentGuidelines: { type: String },
        hashtags: { type: mongoose.Schema.Types.Mixed },
        disclosureRequirements: { type: String, default: '#Ad #Sponsored' },
        agreedPrice: { type: Number },
        budgetRangeMin: { type: Number },
        budgetRangeMax: { type: Number },
        paymentTerms: { type: String },
        currency: { type: String, default: 'USD' },
        postingDeadline: { type: Date },
        brandMessage: { type: String },
        counterOfferPrice: { type: Number },
        counterOfferMessage: { type: String },
        rejectionReason: { type: String },
        sentAt: { type: Date, default: Date.now },
        viewedAt: { type: Date },
        acceptedAt: { type: Date },
        rejectedAt: { type: Date },
        negotiationStartedAt: { type: Date },
        dealClosedAt: { type: Date },
        expiredAt: { type: Date },
        cancelledAt: { type: Date },
        brandName: { type: String },
        brandLogoUrl: { type: String },
        brandCategory: { type: String },
        influencerName: { type: String },
        influencerUsername: { type: String },
        influencerProfilePic: { type: String },
        influencerNiche: { type: mongoose.Schema.Types.Mixed },
    },
    {
        timestamps: true,
        collection: 'collaboration_requests',
    }
);

const MIRROR_PAIRS = [
    ['brandId', 'brandProfileId'],
    ['influencerId', 'influencerProfileId'],
    ['brandId', 'brandUserId'],
    ['influencerId', 'influencerUserId'],
    ['brandOfferedFee', 'agreedPrice'],
    ['influencerCounterFee', 'counterOfferPrice'],
    ['agreedFee', 'agreedPrice'],
];

campaignRequestSchema.pre('save', function hydrateBeforeSave(next) {
    hydrateLegacyShapes(this);
    next();
});

campaignRequestSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function hydrateOnUpdate(next) {
    const update = this.getUpdate() || {};
    normalizeUpdate(update, MIRROR_PAIRS);

    if (update.$set) hydrateLegacyShapes(update.$set);
    else hydrateLegacyShapes(update);

    this.setUpdate(update);
    next();
});

module.exports = mongoose.model('CampaignRequest', campaignRequestSchema, 'collaboration_requests');
