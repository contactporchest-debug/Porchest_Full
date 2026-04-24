const mongoose = require('mongoose');

const mediaRawSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        influencerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerProfile', index: true },
        platform: { type: String, default: 'Instagram', index: true },
        mediaId: { type: String, required: true },
        payload: { type: mongoose.Schema.Types.Mixed, required: true },
        fetchedAt: { type: Date, default: Date.now, index: true },
    },
    {
        timestamps: true,
        collection: 'media_raw',
    }
);

mediaRawSchema.index({ userId: 1, mediaId: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('MediaRaw', mediaRawSchema);
