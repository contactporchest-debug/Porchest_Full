const mongoose = require('mongoose');

const instagramMediaInsightSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['brand', 'influencer'], required: true },
        brandProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandProfile' },
        influencerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerProfile' },
        instagramUserId: { type: String, required: true },
        mediaId: { type: String, required: true },
        reach: { type: Number, default: 0 },
        impressions: { type: Number, default: 0 },
        saved: { type: Number, default: 0 },
        videoViews: { type: Number, default: 0 }, // For VIDEO types
        fetchedAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

instagramMediaInsightSchema.index({ mediaId: 1 });

module.exports = mongoose.model('InstagramMediaInsight', instagramMediaInsightSchema);
