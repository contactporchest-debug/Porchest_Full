const mongoose = require('mongoose');

/**
 * InstagramAccount — Raw account/profile data fetched from Meta Graph API.
 * Stored per-user, per-role, per-instagram_user_id.
 * Brand and Influencer accounts are fully separate records.
 * This is the trusted source-of-truth raw data; never manually edited.
 */
const instagramAccountSchema = new mongoose.Schema(
    {
        // Ownership
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

        // Instagram identifiers
        instagramUserId: { type: String, required: true },  // Meta IG user id
        username: { type: String },
        name: { type: String },                             // display name from Meta

        // Profile data
        biography: { type: String },
        website: { type: String },                          // website from IG profile
        profilePictureURL: { type: String },

        // Counts
        followersCount: { type: Number, default: 0 },
        followsCount: { type: Number, default: 0 },
        mediaCount: { type: Number, default: 0 },

        // Account type
        accountType: { type: String },                      // PERSONAL, CREATOR, BUSINESS

        // Facebook page linkage (business accounts)
        linkedPageId: { type: String },
        linkedPageName: { type: String },

        // Fetch metadata
        fetchedAt: { type: Date, required: true, default: Date.now },
    },
    { timestamps: true }
);

// Compound index: one account snapshot per user+role (latest wins via upsert)
instagramAccountSchema.index({ userId: 1, role: 1 }, { unique: true });
instagramAccountSchema.index({ instagramUserId: 1 });

module.exports = mongoose.model('InstagramAccount', instagramAccountSchema);
