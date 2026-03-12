const mongoose = require('mongoose');

const instagramMediaSnapshotSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Meta media identifiers
        mediaId: { type: String, required: true },
        mediaType: { type: String, enum: ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REEL'] },
        caption: { type: String },
        permalink: { type: String },
        thumbnailUrl: { type: String },
        timestamp: { type: Date },

        // Engagement metrics
        likeCount: { type: Number, default: 0 },
        commentsCount: { type: Number, default: 0 },
        reach: { type: Number },           // may be null if not available
        impressions: { type: Number },     // may be null if not available
        plays: { type: Number },           // reels only
        saved: { type: Number },           // saved count if available

        // Computed
        engagementScore: { type: Number }, // likeCount + commentsCount
        snapshotAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

instagramMediaSnapshotSchema.index({ userId: 1, snapshotAt: -1 });
instagramMediaSnapshotSchema.index({ userId: 1, mediaId: 1 }, { unique: true });

module.exports = mongoose.model('InstagramMediaSnapshot', instagramMediaSnapshotSchema);
