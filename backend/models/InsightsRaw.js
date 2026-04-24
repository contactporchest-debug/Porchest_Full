const mongoose = require('mongoose');

const insightsRawSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        influencerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerProfile', index: true },
        platform: { type: String, default: 'Instagram', index: true },
        targetType: { type: String, required: true, index: true }, // account, audience, online_followers, media
        targetId: { type: String, default: null, index: true },
        payload: { type: mongoose.Schema.Types.Mixed, required: true },
        fetchedAt: { type: Date, default: Date.now, index: true },
    },
    {
        timestamps: true,
        collection: 'insights_raw',
    }
);

insightsRawSchema.index({ userId: 1, platform: 1, targetType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('InsightsRaw', insightsRawSchema);
