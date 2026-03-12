const mongoose = require('mongoose');

const instagramConnectionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        role: {
            type: String,
            enum: ['influencer', 'brand'],
            required: true,
        },

        // Meta / Instagram identifiers
        instagramUserId: { type: String },
        username: { type: String },
        profilePictureURL: { type: String },
        biography: { type: String },
        accountType: { type: String }, // PERSONAL, CREATOR, BUSINESS

        // OAuth tokens (stored server-side only — never sent to client)
        accessToken: { type: String },          // short-lived or long-lived token
        longLivedToken: { type: String },       // exchanged long-lived token
        tokenExpiresAt: { type: Date },         // expiry date
        tokenScopes: { type: [String], default: [] },

        // Connection state
        isConnected: { type: Boolean, default: false },
        lastSyncedAt: { type: Date },
        syncStatus: {
            type: String,
            enum: ['idle', 'syncing', 'success', 'failed', 'token_expired'],
            default: 'idle',
        },
        syncError: { type: String },            // last error message if any

        // Fetched profile metrics (duplicated here for fast access)
        followersCount: { type: Number, default: 0 },
        followsCount: { type: Number, default: 0 },
        mediaCount: { type: Number, default: 0 },

        // State param used during OAuth flow (CSRF protection)
        oauthState: { type: String },
    },
    { timestamps: true }
);

instagramConnectionSchema.index({ userId: 1 });

module.exports = mongoose.model('InstagramConnection', instagramConnectionSchema);
