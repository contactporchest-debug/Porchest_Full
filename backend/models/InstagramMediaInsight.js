const mongoose = require('mongoose');

/**
 * InstagramMediaInsight — Per-media insight data from Meta Insights API.
 * Available only for Business/Creator accounts with instagram_manage_insights permission.
 * Null fields are normal — not all media types return all metrics.
 */
const instagramMediaInsightSchema = new mongoose.Schema(
    {
        // Ownership
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

        // Media reference
        mediaId: { type: String, required: true },

        // Date this insight was fetched
        date: { type: Date, required: true, default: Date.now },

        // Insight metrics (nullable — depends on media type and permissions)
        views: { type: Number, default: null },
        reach: { type: Number, default: null },
        impressions: { type: Number, default: null },
        saves: { type: Number, default: null },
        shares: { type: Number, default: null },

        // Reel / Video specific
        watchTime: { type: Number, default: null },
        completionRate: { type: Number, default: null },   // 0-1 ratio
        plays: { type: Number, default: null },

        // Raw payload for future-proofing
        rawPayload: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    { timestamps: true }
);

instagramMediaInsightSchema.index({ userId: 1, role: 1, mediaId: 1, date: -1 });
instagramMediaInsightSchema.index({ mediaId: 1 });

module.exports = mongoose.model('InstagramMediaInsight', instagramMediaInsightSchema);
