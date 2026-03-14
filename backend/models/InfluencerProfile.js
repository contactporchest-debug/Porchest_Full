const mongoose = require('mongoose');

const INFLUENCER_NICHES = [
    'Fashion', 'Food', 'Fitness', 'Tech', 'Travel', 'Beauty',
    'Gaming', 'Lifestyle', 'Parenting', 'Education', 'Business',
    'Health', 'Entertainment', 'Finance', 'Other',
];

const influencerProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },

        // ── Editable profile fields ──
        fullName: { type: String },
        age: { type: Number },
        countryOfResidence: { type: String },
        city: { type: String },                     // optional
        contactEmail: { type: String },
        niche: { type: String, enum: INFLUENCER_NICHES },
        shortBio: { type: String },                 // max 100 words enforced in validators

        // ── Pricing ──
        avgPostCostUSD: { type: Number, default: 0 },
        avgReelCostUSD: { type: Number, default: 0 },

        // ── Instagram public handle (manual, pre-connect) ──
        instagramUsername: { type: String },
        instagramProfileURL: { type: String },

        // ── Instagram synced read-only fields (populated after OAuth) ──
        instagramUserId: { type: String },          // Meta user_id
        instagramDPURL: { type: String },           // profile picture URL
        instagramAccountType: { type: String },     // CREATOR, BUSINESS
        instagramBiography: { type: String },       // biography from Meta
        followersCount: { type: Number, default: 0 },
        followsCount: { type: Number, default: 0 },
        mediaCount: { type: Number, default: 0 },
        engagementRate: { type: Number, default: 0 },
        avgLikes: { type: Number, default: 0 },
        avgComments: { type: Number, default: 0 },
        instagramConnected: { type: Boolean, default: false },
        lastSyncedAt: { type: Date },

        // ── Profile completion ──
        profileCompletionStatus: { type: Boolean, default: false },
    },
    { timestamps: true }
);

influencerProfileSchema.index({ niche: 1 });
influencerProfileSchema.index({ countryOfResidence: 1 });
influencerProfileSchema.index({ followersCount: -1 });

module.exports = mongoose.model('InfluencerProfile', influencerProfileSchema);
