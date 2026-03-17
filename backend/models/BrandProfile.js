const mongoose = require('mongoose');

const brandProfileSchema = new mongoose.Schema(
    {
        // ── A. Basic Identity ────────────────────────────────────────────
        brandProfileId: { type: String, unique: true, required: true }, // BRD-xxx
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        brandName: { type: String },
        companyName: { type: String },
        category: { type: String },
        subcategory: { type: String },
        country: { type: String },
        city: { type: String },
        description: { type: String },
        logoUrl: { type: String },
        website: { type: String },
        socialLinks: {
            instagram: { type: String },
            twitter: { type: String },
            tiktok: { type: String }
        },
        contactDetails: {
            officialEmail: { type: String },
            contactPersonName: { type: String }
        },

        // ── B. Profile State ─────────────────────────────────────────────
        profileCompletionStatus: { type: Boolean, default: false },
        verificationStatus: { type: String, enum: ['unverified', 'pending', 'verified', 'rejected'], default: 'unverified' },
        isActive: { type: Boolean, default: true },
        instagramConnected: { type: Boolean, default: false },
        instagramConnectionStatus: { type: String, enum: ['disconnected', 'connected', 'token_expired', 'failed'], default: 'disconnected' },

        // ── C. Brand Business Information ────────────────────────────────
        businessType: { type: String },
        targetIndustries: [{ type: String }],
        preferredCollaborationType: [{ type: String }], // 'sponsored_post', 'ugc', 'affiliate'
        targetAudiencePreferences: [{ type: String }],
        preferredInfluencerCategories: [{ type: String }],
        preferredAudienceCountries: [{ type: String }],
        preferredAudienceAgeGroups: [{ type: String }],
        preferredAudienceGender: { type: String },
        budgetRange: { type: String }, // '0-500', '500-1000'
        approxBudgetUSD: { type: Number },
        campaignGoals: [{ type: String }],
        communicationPreferences: { type: String },

        // ── D. Internal Brand Metadata & Tracking ────────────────────────
        visibilityStatus: { type: String, enum: ['public', 'private'], default: 'public' },
        onboardingState: { type: String, default: 'pending' },
        accountNotes: { type: String },

        // ── E. Instagram Raw Integration Data ────────────────────────────
        // Brand's connected Instagram identity/metrics for validation
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
        
        // Derived Analytics (Brand self-tracking)
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
            // Tokens strictly scoped to the profile, wiped on disconnect
            oauthState: { type: String },
            accessToken: { type: String },
            longLivedToken: { type: String },
            tokenExpiresAt: { type: Date }
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('BrandProfile', brandProfileSchema);
