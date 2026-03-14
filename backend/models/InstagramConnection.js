const mongoose = require('mongoose');

/**
 * InstagramConnection — OAuth token storage per user+role.
 * CRITICAL: The compound unique index `{userId, role}` allows one record per role
 * per user. A brand and an influencer using the same userId (impossible) would be
 * separate, but more importantly: a user who is a brand has ONE brand connection
 * record, and an influencer has ONE influencer connection record. They never collide.
 *
 * Tokens are NEVER sent to the client. This model lives server-side only.
 */
const instagramConnectionSchema = new mongoose.Schema(
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

        // Meta / Instagram identifiers
        instagramUserId: { type: String },
        username: { type: String },
        profilePictureURL: { type: String },
        biography: { type: String },
        accountType: { type: String },              // PERSONAL, CREATOR, BUSINESS

        // Facebook page (required for Business accounts to access IG Business API)
        linkedPageId: { type: String },
        linkedPageName: { type: String },

        // OAuth tokens (stored server-side ONLY — never sent to client)
        accessToken: { type: String },              // short-lived token (1hr)
        longLivedToken: { type: String },           // long-lived token (60 days)
        tokenExpiresAt: { type: Date },
        tokenScopes: { type: [String], default: [] },
        tokenStatus: {
            type: String,
            enum: ['active', 'expired', 'revoked', 'unknown'],
            default: 'unknown',
        },

        // Connection state
        isConnected: { type: Boolean, default: false },
        connectedAt: { type: Date },
        lastSyncedAt: { type: Date },
        syncStatus: {
            type: String,
            enum: ['idle', 'syncing', 'success', 'failed', 'token_expired'],
            default: 'idle',
        },
        syncError: { type: String },

        // Fetched profile metrics (duplicated for fast access — authoritative copy in InstagramAccount)
        followersCount: { type: Number, default: 0 },
        followsCount: { type: Number, default: 0 },
        mediaCount: { type: Number, default: 0 },

        // CSRF protection during OAuth flow
        oauthState: { type: String },
    },
    { timestamps: true }
);

// CRITICAL: Compound unique index — one connection per user per role
instagramConnectionSchema.index({ userId: 1, role: 1 }, { unique: true });
instagramConnectionSchema.index({ instagramUserId: 1 });

module.exports = mongoose.model('InstagramConnection', instagramConnectionSchema);
