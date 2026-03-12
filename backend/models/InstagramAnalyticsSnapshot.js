const mongoose = require('mongoose');

const instagramAnalyticsSnapshotSchema = new mongoose.Schema(
    {
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

        // ── Raw fetched fields ──
        followersCount: { type: Number },
        followsCount: { type: Number },
        mediaCount: { type: Number },
        biography: { type: String },
        username: { type: String },
        profilePictureURL: { type: String },
        accountType: { type: String },

        // ── Computed analytics ──
        engagementRate: { type: Number },       // ((totalLikes + totalComments) / followersCount) * 100
        avgLikesPerPost: { type: Number },
        avgCommentsPerPost: { type: Number },
        avgEngagementPerPost: { type: Number },
        likeToCommentRatio: { type: Number },

        // ── Top content ──
        topPostByEngagement: {
            mediaId: { type: String },
            caption: { type: String },
            likeCount: { type: Number },
            commentsCount: { type: Number },
            mediaType: { type: String },
            timestamp: { type: Date },
            permalink: { type: String },
            thumbnailUrl: { type: String },
        },
        topReelByReach: {
            mediaId: { type: String },
            caption: { type: String },
            reach: { type: Number },
            plays: { type: Number },
            mediaType: { type: String },
            timestamp: { type: Date },
            permalink: { type: String },
            thumbnailUrl: { type: String },
        },

        // ── Audience demographics (if available via Business API) ──
        audienceDemographics: {
            topCountry: { type: String },
            topCity: { type: String },
            genderSplit: {
                male: { type: Number },
                female: { type: Number },
                other: { type: Number },
            },
        },

        // ── Snapshot metadata ──
        fetchedAt: { type: Date, default: Date.now },
        postsAnalyzed: { type: Number, default: 0 },
        isPartial: { type: Boolean, default: false }, // true if some fields are unavailable
    },
    { timestamps: true }
);

instagramAnalyticsSnapshotSchema.index({ userId: 1, fetchedAt: -1 });

module.exports = mongoose.model('InstagramAnalyticsSnapshot', instagramAnalyticsSnapshotSchema);
