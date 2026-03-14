const mongoose = require('mongoose');

const instagramMediaSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['brand', 'influencer'], required: true },
        brandProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandProfile' },
        influencerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerProfile' },
        instagramUserId: { type: String, required: true },
        mediaId: { type: String, required: true },
        caption: { type: String },
        mediaType: { type: String }, // IMAGE, VIDEO, CAROUSEL_ALBUM
        permalink: { type: String },
        mediaUrl: { type: String },
        thumbnailUrl: { type: String },
        timestamp: { type: Date },
        likeCount: { type: Number, default: 0 },
        commentsCount: { type: Number, default: 0 }
    },
    { timestamps: true }
);

instagramMediaSchema.index({ instagramUserId: 1, mediaId: 1 }, { unique: true });

module.exports = mongoose.model('InstagramMedia', instagramMediaSchema);
