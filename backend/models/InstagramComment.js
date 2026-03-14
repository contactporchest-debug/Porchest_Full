const mongoose = require('mongoose');

const instagramCommentSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['brand', 'influencer'], required: true },
        brandProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandProfile' },
        influencerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerProfile' },
        instagramUserId: { type: String, required: true },
        mediaId: { type: String, required: true },
        commentId: { type: String, required: true },
        text: { type: String },
        username: { type: String },
        timestamp: { type: Date }
    },
    { timestamps: true }
);

instagramCommentSchema.index({ instagramUserId: 1, commentId: 1 }, { unique: true });

module.exports = mongoose.model('InstagramComment', instagramCommentSchema);
