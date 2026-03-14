const mongoose = require('mongoose');

const instagramDerivedMetricSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['brand', 'influencer'], required: true },
        brandProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandProfile' },
        influencerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerProfile' },
        instagramUserId: { type: String, required: true },
        fetchedAt: { type: Date, default: Date.now },
        followerGrowthRate: { type: Number },
        engagementRate: { type: Number },
        engagementPerImpression: { type: Number },
        postingFrequency7d: { type: Number },
        postingFrequency30d: { type: Number },
        avgLikesPerPost: { type: Number },
        avgCommentsPerPost: { type: Number },
        avgEngagementPerPost: { type: Number },
        likeToCommentRatio: { type: Number },
        sentimentScore: { type: Number },
        authenticityScore: { type: Number },
        qualityScore: { type: Number },
        fakeFollowerRiskScore: { type: Number },
        isEstimated: { type: Boolean, default: true }
    },
    { timestamps: true }
);

instagramDerivedMetricSchema.index({ instagramUserId: 1 });

module.exports = mongoose.model('InstagramDerivedMetric', instagramDerivedMetricSchema);
