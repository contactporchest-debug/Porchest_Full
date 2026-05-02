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

const brandProfileSchema = new mongoose.Schema(
    {
        // Identity
        brandProfileId: { type: String, unique: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        businessName: {
            type: String,
            required: function requiredBusinessName() {
                return !this.brandName && !this.companyName;
            },
        },
        logo: { type: String },
        industry: { type: String },
        website: { type: String },
        contactEmail: { type: String },
        country: { type: String },
        bio: { type: String },
        tone: { type: String, enum: ['luxury', 'casual', 'professional', 'fun'] },

        // Instagram / Meta
        igUserId: { type: String, index: true },
        igUsername: { type: String },
        igFollowers: { type: Number, default: 0 },
        igFollowingCount: { type: Number, default: 0 },
        igProfileUrl: { type: String },
        igReach: { type: Number, default: 0 },
        igImpressions: { type: Number, default: 0 },
        igProfileViews: { type: Number, default: 0 },
        igWebsiteClicks: { type: Number, default: 0 },
        pixelId: { type: String },
        igLastSyncedAt: { type: Date },
        audienceDemographics: {
            ageGender: { type: mongoose.Schema.Types.Mixed },
            topCountries: { type: [mongoose.Schema.Types.Mixed], default: [] },
            topCities: { type: [mongoose.Schema.Types.Mixed], default: [] },
        },

        // Target audience
        targetAudience: {
            ageRange: [{ type: Number }],
            genders: [{ type: String }],
            countries: [{ type: String }],
            interests: [{ type: String }],
        },

        // Campaign preferences
        preferredNiches: [{ type: String }],
        preferredTiers: [{ type: String, enum: ['nano', 'micro', 'macro', 'mega'] }],
        budgetRange: {
            min: { type: Number },
            max: { type: Number },
        },
        typicalBudget: { type: Number },
        usageRightsDefault: { type: Boolean, default: false },

        // Porchest internal
        assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        assignedEmployeeFK: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        profileComplete: { type: Boolean, default: false },
        verified: { type: Boolean, default: false },

        // Legacy compatibility fields
        brandName: { type: String },
        companyName: { type: String },
        category: { type: String },
        description: { type: String },
        logoUrl: { type: String },
        contactDetails: {
            officialEmail: { type: String },
            contactPersonName: { type: String },
        },
        profileCompletionStatus: { type: Boolean, default: false },
        verificationStatus: {
            type: String,
            enum: ['unverified', 'pending', 'verified', 'rejected'],
            default: 'unverified',
        },
        isActive: { type: Boolean, default: true },
        instagramConnected: { type: Boolean, default: false },
        instagramConnectionStatus: {
            type: String,
            enum: ['disconnected', 'connected', 'token_expired', 'failed'],
            default: 'disconnected',
        },
        approxBudgetUSD: { type: Number },
        instagramUserId: { type: String },
        instagramUsername: { type: String },
        instagramProfileURL: { type: String },
        instagramDPURL: { type: String },
        instagramBiography: { type: String },
        instagramAccountType: { type: String },
        followersCount: { type: Number, default: 0 },
        followsCount: { type: Number, default: 0 },
        mediaCount: { type: Number, default: 0 },
        linkedPageId: { type: String },
        linkedPageName: { type: String },
        engagementRate: { type: Number, default: 0 },
        avgLikesPerPost: { type: Number, default: 0 },
        avgCommentsPerPost: { type: Number, default: 0 },
        avgEngagementPerPost: { type: Number, default: 0 },
        likeToCommentRatio: { type: Number, default: 0 },
        postsAnalyzed: { type: Number, default: 0 },
        influencerEfficiencyRate: { type: Number, default: 0 },
        postingFrequency7d: { type: Number, default: 0 },
        postingFrequency30d: { type: Number, default: 0 },
        qualityScore: { type: Number, default: 0 },
        topPostScore: { type: Number, default: 0 },
        topReelScore: { type: Number, default: 0 },
        lastSyncedAt: { type: Date },
        sync: {
            refreshStatus: { type: String, enum: ['idle', 'syncing', 'success', 'failed'] },
            refreshError: { type: String },
            oauthState: { type: String },
            accessToken: { type: String },
            longLivedToken: { type: String },
            tokenExpiresAt: { type: Date },
        },
    },
    {
        timestamps: true,
        collection: 'brand_profiles',
    }
);

const MIRROR_PAIRS = [
    ['businessName', 'brandName'],
    ['logo', 'logoUrl'],
    ['industry', 'category'],
    ['bio', 'description'],
    ['igUserId', 'instagramUserId'],
    ['igUsername', 'instagramUsername'],
    ['igProfileUrl', 'instagramDPURL'],
    ['igFollowers', 'followersCount'],
    ['igFollowingCount', 'followsCount'],
    ['igReach', 'accountReach'],
    ['igImpressions', 'accountImpressions'],
    ['igProfileViews', 'profileViews'],
    ['igWebsiteClicks', 'websiteClicks'],
    ['igLastSyncedAt', 'lastSyncedAt'],
    ['profileComplete', 'profileCompletionStatus'],
];

function syncDerivedBrandState(doc) {
    if (!doc) return;

    if (!doc.businessName && doc.brandName) doc.businessName = doc.brandName;
    if (!doc.brandName && doc.businessName) doc.brandName = doc.businessName;

    if (!doc.logo && doc.logoUrl) doc.logo = doc.logoUrl;
    if (!doc.logoUrl && doc.logo) doc.logoUrl = doc.logo;

    if (!doc.industry && doc.category) doc.industry = doc.category;
    if (!doc.category && doc.industry) doc.category = doc.industry;

    if (!doc.contactEmail && doc.contactDetails?.officialEmail) doc.contactEmail = doc.contactDetails.officialEmail;
    if (!doc.contactDetails) doc.contactDetails = {};
    if (!doc.contactDetails.officialEmail && doc.contactEmail) doc.contactDetails.officialEmail = doc.contactEmail;

    if (!doc.bio && doc.description) doc.bio = doc.description;
    if (!doc.description && doc.bio) doc.description = doc.bio;

    if (!doc.igUserId && doc.instagramUserId) doc.igUserId = doc.instagramUserId;
    if (!doc.instagramUserId && doc.igUserId) doc.instagramUserId = doc.igUserId;

    if (!doc.igUsername && doc.instagramUsername) doc.igUsername = doc.instagramUsername;
    if (!doc.instagramUsername && doc.igUsername) doc.instagramUsername = doc.igUsername;

    if (!doc.igProfileUrl && doc.instagramDPURL) doc.igProfileUrl = doc.instagramDPURL;
    if (!doc.instagramDPURL && doc.igProfileUrl) doc.instagramDPURL = doc.igProfileUrl;

    if (doc.igFollowers == null && doc.followersCount != null) doc.igFollowers = doc.followersCount;
    if (doc.followersCount == null && doc.igFollowers != null) doc.followersCount = doc.igFollowers;

    if (doc.igFollowingCount == null && doc.followsCount != null) doc.igFollowingCount = doc.followsCount;
    if (doc.followsCount == null && doc.igFollowingCount != null) doc.followsCount = doc.igFollowingCount;

    if (doc.igReach == null && doc.accountReach != null) doc.igReach = doc.accountReach;
    if (doc.accountReach == null && doc.igReach != null) doc.accountReach = doc.igReach;

    if (doc.igImpressions == null && doc.accountImpressions != null) doc.igImpressions = doc.accountImpressions;
    if (doc.accountImpressions == null && doc.igImpressions != null) doc.accountImpressions = doc.igImpressions;

    if (doc.igProfileViews == null && doc.profileViews != null) doc.igProfileViews = doc.profileViews;
    if (doc.profileViews == null && doc.igProfileViews != null) doc.profileViews = doc.igProfileViews;

    if (doc.igWebsiteClicks == null && doc.websiteClicks != null) doc.igWebsiteClicks = doc.websiteClicks;
    if (doc.websiteClicks == null && doc.igWebsiteClicks != null) doc.websiteClicks = doc.igWebsiteClicks;

    if (!doc.igLastSyncedAt && doc.lastSyncedAt) doc.igLastSyncedAt = doc.lastSyncedAt;
    if (!doc.lastSyncedAt && doc.igLastSyncedAt) doc.lastSyncedAt = doc.igLastSyncedAt;

    if (doc.profileComplete == null && doc.profileCompletionStatus != null) {
        doc.profileComplete = doc.profileCompletionStatus;
    }
    if (doc.profileCompletionStatus == null && doc.profileComplete != null) {
        doc.profileCompletionStatus = doc.profileComplete;
    }

    if (doc.verified === true) {
        doc.verificationStatus = 'verified';
    } else if (doc.verificationStatus === 'verified') {
        doc.verified = true;
    }
}

brandProfileSchema.pre('save', function syncBrandBeforeSave(next) {
    syncDerivedBrandState(this);
    next();
});

brandProfileSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function syncBrandOnUpdate(next) {
    const update = this.getUpdate() || {};
    normalizeUpdate(update, MIRROR_PAIRS);

    if (update.$set) syncDerivedBrandState(update.$set);
    else syncDerivedBrandState(update);

    this.setUpdate(update);
    next();
});

module.exports = mongoose.model('BrandProfile', brandProfileSchema, 'brand_profiles');
