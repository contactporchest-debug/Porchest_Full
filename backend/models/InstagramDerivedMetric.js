const mongoose = require('mongoose');

/**
 * InstagramDerivedMetric — Computed/derived analytics per user+role.
 * Stored as time-series snapshots (one record per sync event).
 *
 * IMPORTANT separations:
 * - Raw API metrics (followers_count, like_count etc.) live in InstagramAccount + InstagramMedia
 * - This model ONLY stores computed/derived values
 * - Estimated/model-based fields MUST have corresponding _isEstimated: true fields
 */
const instagramDerivedMetricSchema = new mongoose.Schema(
    {
        // Ownership — brand and influencer records are SEPARATE
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            enum: ['influencer', 'brand'],
            required: true,
        },
        instagramUserId: { type: String, required: true },

        // When this metric snapshot was computed
        computedAt: { type: Date, required: true, default: Date.now },

        // ── Engagement metrics (derived from raw likes + comments + followers) ──
        engagementRate: { type: Number, default: null },                // %
        engagementPerImpression: { type: Number, default: null },       // % (needs insights)
        avgEngagementPerPost: { type: Number, default: null },
        avgLikesPerPost: { type: Number, default: null },
        avgCommentsPerPost: { type: Number, default: null },
        avgViewsPerPost: { type: Number, default: null },               // needs insights
        likeToCommentRatio: { type: Number, default: null },

        // ── Growth metrics ──
        followerGrowthRate: { type: Number, default: null },            // % vs last snapshot
        followerGrowthTrend: {
            type: String,
            enum: ['growing', 'stable', 'declining', null],
            default: null,
        },

        // ── Posting frequency ──
        postingFrequency7d: { type: Number, default: null },            // posts per week
        postingFrequency30d: { type: Number, default: null },           // posts per month
        postingConsistencyScore: { type: Number, default: null },       // 0-100

        // ── Content quality ──
        topPostScore: { type: Number, default: null },
        topReelScore: { type: Number, default: null },
        contentEfficiencyRate: { type: Number, default: null },         // engagement/impressions

        // ── Estimated / model-based metrics ──
        // These are NOT official Meta values. They are internally computed estimates.
        // Always marked with isEstimated: true in code.
        sentimentScore: { type: Number, default: null },                // aggregate sentiment
        positiveCommentRatio: { type: Number, default: null },          // 0-1
        negativeCommentRatio: { type: Number, default: null },          // 0-1

        // ESTIMATED quality scores — never pass these off as Meta-official
        qualityScore: { type: Number, default: null },                  // 0-100 (estimated)
        authenticityScore: { type: Number, default: null },             // 0-100 (estimated)
        fakeFollowerRiskScore: { type: Number, default: null },         // 0-100 (estimated)
        influencerEfficiencyRate: { type: Number, default: null },      // (estimated)

        // Number of posts analyzed for this snapshot
        postsAnalyzed: { type: Number, default: 0 },

        // Flag: true for model-based metrics in this record
        hasEstimatedMetrics: { type: Boolean, default: true },
    },
    { timestamps: true }
);

instagramDerivedMetricSchema.index({ userId: 1, role: 1, computedAt: -1 });
instagramDerivedMetricSchema.index({ instagramUserId: 1 });

module.exports = mongoose.model('InstagramDerivedMetric', instagramDerivedMetricSchema);
