const mongoose = require('mongoose');

const instagramAccountSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['brand', 'influencer'], required: true },
        brandProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandProfile' },
        influencerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerProfile' },
        instagramUserId: { type: String, required: true },
        fetchedAt: { type: Date, default: Date.now },
        username: { type: String },
        name: { type: String },
        biography: { type: String },
        website: { type: String },
        followersCount: { type: Number, default: 0 },
        followsCount: { type: Number, default: 0 },
        mediaCount: { type: Number, default: 0 },
        accountType: { type: String },
        profilePictureURL: { type: String }
    },
    { timestamps: true }
);

module.exports = mongoose.model('InstagramAccount', instagramAccountSchema);
