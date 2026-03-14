const mongoose = require('mongoose');

/**
 * InstagramMedia — Raw media records from Meta Graph API.
 * Separated per userId+role+mediaId.
 * Brand posts and Influencer posts are stored in the same collection but
 * are NEVER mixed — they are always queried with userId+role filters.
 */
const instagramMediaSchema = new mongoose.Schema(
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

        // Media identifiers
        mediaId: { type: String, required: true },      // Meta media object ID

        // Content
        caption: { type: String, default: '' },
        mediaType: {
            type: String,
            enum: ['IMAGE', 'VIDEO', 'REEL', 'CAROUSEL_ALBUM'],
        },
        permalink: { type: String },
        mediaUrl: { type: String },                     // may be null (expires)
        thumbnailUrl: { type: String },                 // for Reels/Videos

        // Timing
        timestamp: { type: Date },

        // Engagement (surface-level — no impressions here, use MediaInsight)
        likeCount: { type: Number, default: 0 },
        commentsCount: { type: Number, default: 0 },
        engagementScore: { type: Number, default: 0 },     // likes + comments

        snapshotAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Compound unique: one record per user+role+mediaId
instagramMediaSchema.index({ userId: 1, role: 1, mediaId: 1 }, { unique: true });
instagramMediaSchema.index({ userId: 1, role: 1, timestamp: -1 });
instagramMediaSchema.index({ instagramUserId: 1 });

module.exports = mongoose.model('InstagramMedia', instagramMediaSchema);
