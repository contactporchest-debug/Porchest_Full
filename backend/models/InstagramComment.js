const mongoose = require('mongoose');

/**
 * InstagramComment — Raw comment data from Meta Graph API,
 * plus computed sentiment/quality scores.
 * Stored per-user, per-role, per-comment_id.
 */
const instagramCommentSchema = new mongoose.Schema(
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

        // References
        mediaId: { type: String, required: true },
        commentId: { type: String, required: true },

        // Raw comment data from Meta
        text: { type: String, default: '' },
        username: { type: String },                     // commenter's username
        timestamp: { type: Date },

        // ── Computed sentiment / quality scores (ESTIMATED — NOT official Meta data) ──
        // These are model-based estimates, not direct Meta API values.
        // Mark clearly: isEstimated: true always for these fields.
        sentimentLabel: {
            type: String,
            enum: ['positive', 'neutral', 'negative', null],
            default: null,
        },
        sentimentScore: { type: Number, default: null },    // -1 to +1
        toxicityScore: { type: Number, default: null },     // 0 to 1
        spamScore: { type: Number, default: null },         // 0 to 1
        isEstimated: { type: Boolean, default: true },      // always true for sentiment
    },
    { timestamps: true }
);

// Unique per comment
instagramCommentSchema.index({ commentId: 1 }, { unique: true });
instagramCommentSchema.index({ userId: 1, role: 1, mediaId: 1 });
instagramCommentSchema.index({ userId: 1, role: 1 });

module.exports = mongoose.model('InstagramComment', instagramCommentSchema);
