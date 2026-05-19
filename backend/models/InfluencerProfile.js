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

function tierFromFollowers(followers = 0) {
    if (followers >= 1_000_000) return 'mega';
    if (followers >= 100_000) return 'macro';
    if (followers >= 10_000) return 'micro';
    return 'nano';
}

function syncAudienceFromLegacy(doc) {
    if (!doc) return;

    if (!doc.audience || typeof doc.audience !== 'object') {
        doc.audience = {};
    }

    const demographics = doc.demographics || {};

    if (!doc.audience.ageGender && (demographics.genderDistribution || demographics.ageDistribution)) {
        const ageGender = {};
        const genders = demographics.genderDistribution || {};
        const ages = demographics.ageDistribution || {};
        for (const [key, value] of Object.entries(genders)) {
            ageGender[key] = value;
        }
        for (const [key, value] of Object.entries(ages)) {
            ageGender[key] = value;
        }
        doc.audience.ageGender = ageGender;
    }

    if (!doc.audience.topCountries && demographics.topCountries) {
        doc.audience.topCountries = demographics.topCountries;
    }
    if (!doc.audience.topCities && demographics.topCities) {
        doc.audience.topCities = demographics.topCities;
    }

    if (!doc.audience.languages && Array.isArray(doc.languages) && doc.languages.length) {
        doc.audience.languages = doc.languages;
    }
}

function syncDerivedInfluencerState(doc) {
    if (!doc) return;

    if (!doc.igUserId && doc.instagramAccountId) doc.igUserId = doc.instagramAccountId;
    if (!doc.instagramAccountId && doc.igUserId) doc.instagramAccountId = doc.igUserId;

    if (!doc.igUsername && doc.instagramUsername) doc.igUsername = doc.instagramUsername;
    if (!doc.instagramUsername && doc.igUsername) doc.instagramUsername = doc.igUsername;

    if (!doc.igProfileUrl && doc.instagramDPURL) doc.igProfileUrl = doc.instagramDPURL;
    if (!doc.instagramDPURL && doc.igProfileUrl) doc.instagramDPURL = doc.igProfileUrl;

    if (!doc.igBio && doc.instagramBiography) doc.igBio = doc.instagramBiography;
    if (!doc.instagramBiography && doc.igBio) doc.instagramBiography = doc.igBio;

    if (!doc.igWebsite && doc.website) doc.igWebsite = doc.website;
    if (!doc.website && doc.igWebsite) doc.website = doc.igWebsite;

    if (!doc.igAccountType && doc.instagramAccountType) doc.igAccountType = doc.instagramAccountType;
    if (!doc.instagramAccountType && doc.igAccountType) doc.instagramAccountType = doc.igAccountType;

    if (doc.igFollowersCount == null && doc.followersCount != null) doc.igFollowersCount = doc.followersCount;
    if (doc.followersCount == null && doc.igFollowersCount != null) doc.followersCount = doc.igFollowersCount;

    if (doc.igFollowingCount == null && doc.followingCount != null) doc.igFollowingCount = doc.followingCount;
    if (doc.followingCount == null && doc.igFollowingCount != null) doc.followingCount = doc.igFollowingCount;

    if (doc.igMediaCount == null && doc.mediaCount != null) doc.igMediaCount = doc.mediaCount;
    if (doc.mediaCount == null && doc.igMediaCount != null) doc.mediaCount = doc.igMediaCount;

    if (!doc.igLastSyncedAt && doc.lastSyncAt) doc.igLastSyncedAt = doc.lastSyncAt;
    if (!doc.lastSyncAt && doc.igLastSyncedAt) doc.lastSyncAt = doc.igLastSyncedAt;

    if (doc.avgEngagementRate == null && doc.engagementRate != null) doc.avgEngagementRate = doc.engagementRate;
    if (doc.engagementRate == null && doc.avgEngagementRate != null) doc.engagementRate = doc.avgEngagementRate;

    if (doc.porchestScore == null && doc.influencerScore != null) doc.porchestScore = doc.influencerScore;
    if (doc.influencerScore == null && doc.porchestScore != null) doc.influencerScore = doc.porchestScore;

    if (doc.profileComplete == null && doc.profileCompletionStatus != null) doc.profileComplete = doc.profileCompletionStatus;
    if (doc.profileCompletionStatus == null && doc.profileComplete != null) doc.profileCompletionStatus = doc.profileComplete;

    if (doc.verified === true) doc.verificationStatus = 'verified';
    if (doc.verificationStatus === 'verified') doc.verified = true;

    const followers = Number(doc.igFollowersCount || doc.followersCount || 0);
    if (!doc.followerTier && followers) doc.followerTier = tierFromFollowers(followers);

    syncAudienceFromLegacy(doc);

    if (!doc.audience || !doc.audience.ageGender) {
        doc.audience = doc.audience || {};
    }
}

const influencerProfileSchema = new mongoose.Schema(
    {
        // Identity
        influencerProfileId: { type: String, unique: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        fullName: {
            type: String,
            required: function requiredFullName() {
                return !this.fullName && !this.username;
            },
        },
        bio: { type: String },
        country: { type: String },
        city: { type: String },
        niche: [{ type: String }],
        languages: [{ type: String }],
        contentStyleTags: [{ type: String }],
        contactEmail: { type: String },
        phoneNumber: { type: String },

        // Instagram / Meta
        igUserId: { type: String, index: true },
        igUsername: { type: String },
        igProfileUrl: { type: String },
        igBio: { type: String },
        igWebsite: { type: String },
        igAccountType: { type: String, enum: ['PERSONAL', 'BUSINESS', 'CREATOR'] },
        igFollowersCount: { type: Number, default: 0 },
        igFollowingCount: { type: Number, default: 0 },
        igMediaCount: { type: Number, default: 0 },
        igLastSyncedAt: { type: Date },

        // Performance
        avgReachPerPost: { type: Number, default: 0 },
        avgImpressionsPerPost: { type: Number, default: 0 },
        avgSavesPerPost: { type: Number, default: 0 },
        avgSharesPerPost: { type: Number, default: 0 },
        postingFrequency: { type: Number, default: 0 },
        totalReach90d: { type: Number, default: 0 },
        totalImpressions90d: { type: Number, default: 0 },
        totalProfileViews90d: { type: Number, default: 0 },
        totalWebsiteClicks90d: { type: Number, default: 0 },
        followerGrowth90d: { type: Number, default: 0 },

        // Computed scores
        avgEngagementRate: { type: Number, default: 0 },
        followerTier: { type: String, enum: ['nano', 'micro', 'macro', 'mega'] },
        porchestScore: { type: Number, default: 0 },
        authenticityScore: { type: Number, default: 0 },

        // Audience demographics
        audience: {
            ageGender: { type: mongoose.Schema.Types.Mixed },
            topCountries: { type: [mongoose.Schema.Types.Mixed], default: [] },
            topCities: { type: [mongoose.Schema.Types.Mixed], default: [] },
        },

        // Collaboration history
        totalCampaigns: { type: Number, default: 0 },
        totalEarnings: { type: Number, default: 0 },
        avgCampaignRating: { type: Number, default: 0 },
        preferredRate: { type: Number, default: 0 },
        rates: {
            reelPrice: { type: Number },
            postPrice: { type: Number },
        },

        // Payment info
        bankDetails: {
            accountName: { type: String },
            iban: { type: String },
            bankName: { type: String },
        },
        easypaisaNumber: { type: String },
        easypaisaScreenshotUrl: { type: String },

        // Porchest internal
        assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        assignedEmployeeFK: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        profileComplete: { type: Boolean, default: false },
        verified: { type: Boolean, default: false },
        suspended: { type: Boolean, default: false },
        fraudDetection: {
            score: { type: Number, default: 0 },
            level: { type: String, enum: ['clean', 'review', 'suspicious', 'high_risk'], default: 'clean' },
            status: { type: String, enum: ['clean', 'review', 'verification_requested', 'flagged'], default: 'clean' },
            flags: [{ type: String }],
            details: { type: mongoose.Schema.Types.Mixed },
            analyzedAt: { type: Date },
            analyzedByFK: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            verificationRequestedAt: { type: Date },
            verificationRequestedByFK: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            flaggedAt: { type: Date },
            flaggedByFK: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            flagReason: { type: String },
        },

        // Legacy compatibility
        username: { type: String },
        profilePictureUrl: { type: String },
        profileUrl: { type: String },
        instagramAccountId: { type: String },
        instagramUsername: { type: String },
        instagramAccountType: { type: String },
        isVerified: { type: Boolean, default: false },
        countryOfResidence: { type: String },
        categories: [{ type: String }],
        profileCompletionStatus: { type: Boolean, default: false },
        verificationStatus: {
            type: String,
            enum: ['unverified', 'pending', 'verified', 'rejected'],
            default: 'unverified',
        },
        instagramConnected: { type: Boolean, default: false },
        instagramConnectionStatus: {
            type: String,
            enum: ['disconnected', 'connected', 'token_expired', 'failed'],
            default: 'disconnected',
        },
        lastConnectedAt: { type: Date },
        isActive: { type: Boolean, default: true },
        isSearchable: { type: Boolean, default: false },
        lastSyncAt: { type: Date },
        lastAnalyticsRefreshAt: { type: Date },
        nextScheduledRefreshAt: { type: Date },
        followersCount: { type: Number, default: 0 },
        followingCount: { type: Number, default: 0 },
        mediaCount: { type: Number, default: 0 },
        postsCount: { type: Number, default: 0 },
        reelsCount: { type: Number, default: 0 },
        profileViews: { type: Number, default: 0 },
        websiteClicks: { type: Number, default: 0 },
        accountReach: { type: Number, default: 0 },
        accountImpressions: { type: Number, default: 0 },
        onlineFollowers: { type: mongoose.Schema.Types.Mixed, default: null },
        engagementRate: { type: Number, default: 0 },
        avgLikes: { type: Number, default: 0 },
        avgComments: { type: Number, default: 0 },
        avgShares: { type: Number, default: 0 },
        avgViews: { type: Number, default: 0 },
        avgReach: { type: Number, default: 0 },
        avgImpressions: { type: Number, default: 0 },
        avgLikesPerPost: { type: Number, default: 0 },
        avgCommentsPerPost: { type: Number, default: 0 },
        avgEngagementPerPost: { type: Number, default: 0 },
        averageEngagement: { type: Number, default: 0 },
        averageReach: { type: Number, default: 0 },
        viewRate: { type: Number, default: 0 },
        likeToCommentRatio: { type: Number, default: 0 },
        postsAnalyzed: { type: Number, default: 0 },
        influencerEfficiencyRate: { type: Number, default: 0 },
        totalReach: { type: Number, default: 0 },
        totalImpressions: { type: Number, default: 0 },
        totalPlays: { type: Number, default: 0 },
        totalShares: { type: Number, default: 0 },
        totalSaved: { type: Number, default: 0 },
        totalEngagements: { type: Number, default: 0 },
        postingFrequency7d: { type: Number, default: 0 },
        postingFrequency30d: { type: Number, default: 0 },
        consistencyRatio: { type: Number, default: 0 },
        consistencyScore: { type: Number, default: 0 },
        costPerView: { type: Number, default: null },
        costPerEngagement: { type: Number, default: null },
        authenticityScoreLegacy: { type: Number, default: 0 },
        engagementQualityScore: { type: Number, default: 0 },
        viralityScore: { type: Number, default: 0 },
        influencerScore: { type: Number, default: 0 },
        topPerformingContentType: { type: String },
        historicalSnapshots: [{
            capturedAt: { type: Date, default: Date.now },
            followersCount: { type: Number },
            engagementRate: { type: Number },
            accountReach: { type: Number },
            accountImpressions: { type: Number },
            influencerScore: { type: Number },
        }],
        demographics: {
            genderDistribution: { type: mongoose.Schema.Types.Mixed },
            ageDistribution: { type: mongoose.Schema.Types.Mixed },
            topCountries: { type: mongoose.Schema.Types.Mixed },
            topCities: { type: mongoose.Schema.Types.Mixed },
            languages: { type: mongoose.Schema.Types.Mixed },
            audienceType: { type: String },
            onlineFollowers: { type: mongoose.Schema.Types.Mixed },
        },
        avgPostPrice: { type: Number, default: 0 },
        avgReelPrice: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' },
        profileScore: { type: Number, default: 0 },
        fitScore: { type: Number, default: 0 },
        qualityScore: { type: Number, default: 0 },
        topPostScore: { type: Number, default: 0 },
        topReelScore: { type: Number, default: 0 },
        credibilityScore: { type: Number, default: 0 },
        scoreLabel: { type: String },
        scoreBreakdown: { type: mongoose.Schema.Types.Mixed },
        sync: {
            source: { type: String, default: 'Instagram Graph API' },
            lastRawFetchAt: { type: Date },
            lastMetricsCalculationAt: { type: Date },
            lastDemographicsCalculationAt: { type: Date },
            refreshStatus: { type: String, enum: ['idle', 'syncing', 'success', 'failed'] },
            refreshError: { type: String },
            retryCount: { type: Number, default: 0 },
            oauthState: { type: String },
            accessToken: { type: String },
            longLivedToken: { type: String },
            tokenExpiresAt: { type: Date },
        },
        recentMediaSummary: [{
            mediaId: { type: String },
            mediaUrl: { type: String },
            thumbnailUrl: { type: String },
            permalink: { type: String },
            mediaType: { type: String },
            caption: { type: String },
            likeCount: { type: Number },
            commentsCount: { type: Number },
            shareCount: { type: Number },
            saveCount: { type: Number },
            playCount: { type: Number },
            reachCount: { type: Number },
            impressionCount: { type: Number },
            engagementCount: { type: Number },
            viewCount: { type: Number },
            timestamp: { type: Date },
        }],
    },
    {
        timestamps: true,
        collection: 'influencer_profiles',
    }
);

const MIRROR_PAIRS = [
    ['igUserId', 'instagramAccountId'],
    ['igUsername', 'instagramUsername'],
    ['igProfileUrl', 'instagramDPURL'],
    ['igBio', 'instagramBiography'],
    ['igWebsite', 'website'],
    ['igAccountType', 'instagramAccountType'],
    ['igFollowersCount', 'followersCount'],
    ['igFollowingCount', 'followingCount'],
    ['igMediaCount', 'mediaCount'],
    ['igLastSyncedAt', 'lastSyncAt'],
    ['avgEngagementRate', 'engagementRate'],
    ['porchestScore', 'influencerScore'],
    ['profileComplete', 'profileCompletionStatus'],
    ['verified', 'isVerified'],
];

function syncDerivedInfluencerState(doc) {
    if (!doc) return;

    if (!doc.igUserId && doc.instagramAccountId) doc.igUserId = doc.instagramAccountId;
    if (!doc.instagramAccountId && doc.igUserId) doc.instagramAccountId = doc.igUserId;

    if (!doc.igUsername && doc.instagramUsername) doc.igUsername = doc.instagramUsername;
    if (!doc.instagramUsername && doc.igUsername) doc.instagramUsername = doc.igUsername;

    if (!doc.igProfileUrl && doc.instagramDPURL) doc.igProfileUrl = doc.instagramDPURL;
    if (!doc.instagramDPURL && doc.igProfileUrl) doc.instagramDPURL = doc.igProfileUrl;

    if (!doc.igBio && doc.instagramBiography) doc.igBio = doc.instagramBiography;
    if (!doc.instagramBiography && doc.igBio) doc.instagramBiography = doc.igBio;

    if (!doc.igWebsite && doc.website) doc.igWebsite = doc.website;
    if (!doc.website && doc.igWebsite) doc.website = doc.igWebsite;

    if (!doc.igAccountType && doc.instagramAccountType) doc.igAccountType = doc.instagramAccountType;
    if (!doc.instagramAccountType && doc.igAccountType) doc.instagramAccountType = doc.igAccountType;

    if (doc.igFollowersCount == null && doc.followersCount != null) doc.igFollowersCount = doc.followersCount;
    if (doc.followersCount == null && doc.igFollowersCount != null) doc.followersCount = doc.igFollowersCount;

    if (doc.igFollowingCount == null && doc.followingCount != null) doc.igFollowingCount = doc.followingCount;
    if (doc.followingCount == null && doc.igFollowingCount != null) doc.followingCount = doc.igFollowingCount;

    if (doc.igMediaCount == null && doc.mediaCount != null) doc.igMediaCount = doc.mediaCount;
    if (doc.mediaCount == null && doc.igMediaCount != null) doc.mediaCount = doc.igMediaCount;

    if (!doc.igLastSyncedAt && doc.lastSyncAt) doc.igLastSyncedAt = doc.lastSyncAt;
    if (!doc.lastSyncAt && doc.igLastSyncedAt) doc.lastSyncAt = doc.igLastSyncedAt;

    if (doc.avgEngagementRate == null && doc.engagementRate != null) doc.avgEngagementRate = doc.engagementRate;
    if (doc.engagementRate == null && doc.avgEngagementRate != null) doc.engagementRate = doc.avgEngagementRate;

    if (doc.porchestScore == null && doc.influencerScore != null) doc.porchestScore = doc.influencerScore;
    if (doc.influencerScore == null && doc.porchestScore != null) doc.influencerScore = doc.porchestScore;

    if (doc.profileComplete == null && doc.profileCompletionStatus != null) doc.profileComplete = doc.profileCompletionStatus;
    if (doc.profileCompletionStatus == null && doc.profileComplete != null) doc.profileCompletionStatus = doc.profileComplete;

    if (doc.verified === true) doc.isVerified = true;
    if (doc.isVerified === true) doc.verified = true;

    const followers = Number(doc.igFollowersCount || doc.followersCount || 0);
    if (!doc.followerTier) {
        doc.followerTier = tierFromFollowers(followers);
    }

    syncAudienceFromLegacy(doc);
}

function syncAudienceFromLegacy(doc) {
    if (!doc) return;
    const demographics = doc.demographics || {};

    if (!doc.audience || typeof doc.audience !== 'object') {
        doc.audience = {};
    }

    if (!doc.audience.ageGender && (demographics.genderDistribution || demographics.ageDistribution)) {
        const ageGender = {};
        const genderDistribution = demographics.genderDistribution || {};
        const ageDistribution = demographics.ageDistribution || {};
        for (const [key, value] of Object.entries(genderDistribution)) {
            ageGender[key] = value;
        }
        for (const [key, value] of Object.entries(ageDistribution)) {
            ageGender[key] = value;
        }
        doc.audience.ageGender = ageGender;
    }

    if (!doc.audience.topCountries && demographics.topCountries) {
        doc.audience.topCountries = demographics.topCountries;
    }
    if (!doc.audience.topCities && demographics.topCities) {
        doc.audience.topCities = demographics.topCities;
    }
    if (!doc.audience.languages && Array.isArray(doc.languages) && doc.languages.length) {
        doc.audience.languages = doc.languages;
    }
}

module.exports = mongoose.model('InfluencerProfile', influencerProfileSchema, 'influencer_profiles');
