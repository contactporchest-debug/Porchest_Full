const mongoose = require('mongoose');

const BRAND_NICHES = [
    'Fashion', 'Food', 'Fitness', 'Tech', 'Travel', 'Beauty',
    'Gaming', 'Lifestyle', 'Education', 'Entertainment', 'Finance',
    'Health', 'Business', 'Other',
];

const brandProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },

        // ── Editable brand fields ──
        brandName: { type: String },                // formal brand/company name
        officialEmail: { type: String },            // brand contact email
        contactPersonName: { type: String },        // person managing the account
        brandGoal: { type: String },                // campaign goal (max 150 words)
        brandNiche: { type: String, enum: BRAND_NICHES },
        approxBudgetUSD: { type: Number },
        companyCountry: { type: String },
        companyWebsite: { type: String },           // brand website

        // ── Website / Link Tracking ──
        // These links are brand-provided (NOT from Instagram), stored for future
        // click-through, UTM, and conversion attribution analysis.
        trackingWebsiteURL: { type: String },       // primary tracking/landing URL
        landingPageURL: { type: String },           // optional secondary landing page
        trackingNotes: { type: String },            // optional notes about tracking setup

        // ── Instagram public handle (manual, pre-connect) ──
        brandInstagramHandle: { type: String },     // @handle without @

        // ── Instagram synced read-only fields (populated after Brand OAuth) ──
        instagramUserId: { type: String },          // Meta user_id
        instagramUsername: { type: String },        // ig username
        instagramProfileURL: { type: String },      // https://instagram.com/username
        instagramDPURL: { type: String },           // profile picture URL
        instagramAccountType: { type: String },     // BUSINESS (brands typically)
        instagramBiography: { type: String },
        followersCount: { type: Number, default: 0 },
        followsCount: { type: Number, default: 0 },
        mediaCount: { type: Number, default: 0 },
        instagramConnected: { type: Boolean, default: false },
        lastSyncedAt: { type: Date },

        // ── Linked Facebook Page (required for Business accounts) ──
        linkedPageId: { type: String },
        linkedPageName: { type: String },

        // ── Profile completion ──
        profileCompletionStatus: { type: Boolean, default: false },
    },
    { timestamps: true }
);

brandProfileSchema.index({ brandNiche: 1 });
brandProfileSchema.index({ companyCountry: 1 });

module.exports = mongoose.model('BrandProfile', brandProfileSchema);
