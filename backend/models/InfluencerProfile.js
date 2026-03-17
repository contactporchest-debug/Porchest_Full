const mongoose = require('mongoose');

const influencerProfileSchema = new mongoose.Schema(
    {
        // ── A. Identity ──────────────────────────────────────────────────
        influencerProfileId: { type: String, unique: true, required: true }, // INF-xxx
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        username: { type: String }, // App username
        displayName: { type: String },
        fullName: { type: String },
        bio: { type: String },
        profilePictureUrl: { type: String },
        platform: { type: String, default: 'Instagram' },
        instagramAccountId: { type: String },
        instagramUsername: { type: String },
        instagramAccountType: { type: String },
        isVerified: { type: Boolean, default: false }, // Platform verification
        profileUrl: { type: String },
        country: { type: String },
        city: { type: String },
        languages: [{ type: String }],
        niche: { type: String },
        categories: [{ type: String }],
        tags: [{ type: String }],

        // ── B. Profile Status ────────────────────────────────────────────
        profileCompletionStatus: { type: Boolean, default: false },
        verificationStatus: { type: String, enum: ['unverified', 'pending', 'verified', 'rejected'], default: 'unverified' }, // App verification
        instagramConnectionStatus: { type: String, enum: ['disconnected', 'connected', 'token_expired', 'failed'], default: 'disconnected' },
        lastConnectedAt: { type: Date },
        lastDisconnectedAt: { type: Date },
        isActive: { type: Boolean, default: true },
        isSearchable: { type: Boolean, default: false },
        lastSyncAt: { type: Date },
        lastAnalyticsRefreshAt: { type: Date },
        nextScheduledRefreshAt: { type: Date },

        // ── C. Instagram Account Summary ─────────────────────────────────
        followersCount: { type: Number, default: 0 },
        followingCount: { type: Number, default: 0 },
        mediaCount: { type: Number, default: 0 },
        postsCount: { type: Number, default: 0 },
        reelsCount: { type: Number, default: 0 },

        // ── D. Analytics / Metrics ───────────────────────────────────────
        engagementRate: { type: Number, default: 0 }, // e.g., 3.45 (%)
        avgLikes: { type: Number, default: 0 },
        avgComments: { type: Number, default: 0 },
        avgShares: { type: Number, default: 0 },
        avgViews: { type: Number, default: 0 },
        avgReach: { type: Number, default: 0 },
        avgImpressions: { type: Number, default: 0 },
        avgLikesPerPost: { type: Number, default: 0 },
        avgCommentsPerPost: { type: Number, default: 0 },
        avgEngagementPerPost: { type: Number, default: 0 },
        likeToCommentRatio: { type: Number, default: 0 },
        postsAnalyzed: { type: Number, default: 0 },
        influencerEfficiencyRate: { type: Number, default: 0 },
        growthRate: { type: Number, default: 0 }, // MoM Growth
        postingFrequency: { type: Number, default: 0 }, // legacy
        postingFrequency7d: { type: Number, default: 0 },
        postingFrequency30d: { type: Number, default: 0 },
        topPerformingContentType: { type: String },
        
        // ── E. Demographics ──────────────────────────────────────────────
        demographics: {
            genderDistribution: { type: mongoose.Schema.Types.Mixed }, // { "M": 60, "F": 40 }
            ageDistribution: { type: mongoose.Schema.Types.Mixed }, // { "18-24": 40, ... }
            topCountries: { type: mongoose.Schema.Types.Mixed }, // { "US": 50, "PK": 30, ... }
            topCities: { type: mongoose.Schema.Types.Mixed }, // { "New York": 20, ... }
            languages: { type: mongoose.Schema.Types.Mixed },
            audienceType: { type: String }
        },

        // ── F. Pricing / Cost Information ────────────────────────────────
        avgPostPrice: { type: Number, default: 0 },
        avgReelPrice: { type: Number, default: 0 },
        pricingNotes: { type: String },
        currency: { type: String, default: 'USD' },

        // ── G. Score / Rating Section ────────────────────────────────────
        profileScore: { type: Number, default: 0 },
        fitScore: { type: Number, default: 0 }, // 0 - 100
        qualityScore: { type: Number, default: 0 },
        topPostScore: { type: Number, default: 0 },
        topReelScore: { type: Number, default: 0 },
        credibilityScore: { type: Number, default: 0 },
        scoreLabel: { type: String },
        scoreBreakdown: { type: mongoose.Schema.Types.Mixed },

        // ── H. Refresh Metadata & Authorization (No separate tables!) ────
        sync: {
            source: { type: String, default: 'Instagram Graph API' },
            lastRawFetchAt: { type: Date },
            lastMetricsCalculationAt: { type: Date },
            lastDemographicsCalculationAt: { type: Date },
            refreshStatus: { type: String, enum: ['idle', 'syncing', 'success', 'failed'] },
            refreshError: { type: String },
            retryCount: { type: Number, default: 0 },
            // Tokens strictly scoped to the profile, wiped on disconnect
            oauthState: { type: String },
            accessToken: { type: String },
            longLivedToken: { type: String },
            tokenExpiresAt: { type: Date }
        },

        // ── I. Optional Recent Content Summary ───────────────────────────
        recentMediaSummary: [{
            mediaId: { type: String },
            mediaUrl: { type: String },
            permalink: { type: String },
            mediaType: { type: String },
            caption: { type: String },
            likeCount: { type: Number },
            commentsCount: { type: Number },
            timestamp: { type: Date }
        }]
    },
    { timestamps: true }
);

influencerProfileSchema.index({ niche: 1 });
influencerProfileSchema.index({ country: 1 });
influencerProfileSchema.index({ followersCount: -1 });
influencerProfileSchema.index({ engagementRate: -1 });
influencerProfileSchema.index({ fitScore: -1 });
influencerProfileSchema.index({ isSearchable: 1, isActive: 1 });
influencerProfileSchema.index({ 'sync.tokenExpiresAt': 1 }); // For scheduler

module.exports = mongoose.model('InfluencerProfile', influencerProfileSchema);
