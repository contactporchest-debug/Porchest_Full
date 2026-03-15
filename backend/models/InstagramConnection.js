const mongoose = require('mongoose');

const instagramConnectionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['brand', 'influencer'], required: true },
        brandProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandProfile' },
        influencerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerProfile' },
        instagramUserId: { type: String },
        oauthState: { type: String },
        syncStatus: { type: String, enum: ['idle', 'syncing', 'success', 'failed'] },
        syncError: { type: String },
        linkedPageId: { type: String },
        username: { type: String },
        name: { type: String },
        biography: { type: String },
        website: { type: String },
        followersCount: { type: Number, default: 0 },
        followsCount: { type: Number, default: 0 },
        mediaCount: { type: Number, default: 0 },
        accountType: { type: String },
        profilePictureURL: { type: String },
        accessToken: { type: String },
        longLivedToken: { type: String },
        tokenExpiresAt: { type: Date },
        tokenStatus: { type: String, enum: ['active', 'expired', 'revoked'] },
        isConnected: { type: Boolean, default: true },
        connectedAt: { type: Date, default: Date.now },
        lastSyncedAt: { type: Date }
    },
    { timestamps: true }
);

instagramConnectionSchema.index({ userId: 1, role: 1 });
instagramConnectionSchema.index({ instagramUserId: 1 });

module.exports = mongoose.model('InstagramConnection', instagramConnectionSchema);
