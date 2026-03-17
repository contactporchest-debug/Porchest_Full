const mongoose = require('mongoose');

const influencerProfileSchema = new mongoose.Schema(
    {
        // ── Identity ───────────────────────────────────────────────────
        influencerProfileId: { type: String, unique: true, required: true }, // INF-xxx
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },

        // ── Editable profile fields (set by influencer in portal) ──────
        fullName:        { type: String },
        contactEmail:    { type: String },
        age:             { type: Number },
        countryOfResidence: { type: String },
        city:            { type: String },
        niche:           { type: String },
        shortBio:        { type: String },
        profileImageURL: { type: String },
        avgPostCostUSD:  { type: Number, default: 0 },
        avgReelCostUSD:  { type: Number, default: 0 },

        // ── Platform identity (promoted from Instagram sync) ───────────
        instagramConnected:   { type: Boolean, default: false },
        instagramUserId:      { type: String },
        instagramUsername:    { type: String },
        instagramProfileURL:  { type: String },
        instagramDPURL:       { type: String },
        instagramBiography:   { type: String },
        instagramAccountType: { type: String },

        // ── Account stats (promoted from Instagram sync) ───────────────
        followersCount: { type: Number, default: 0 },
        followsCount:   { type: Number, default: 0 },
        mediaCount:     { type: Number, default: 0 },

        // ── Engagement / Analytics (promoted from derived metrics) ─────
        engagementRate:       { type: Number, default: 0 },  // percentage (e.g. 3.45 = 3.45%)
        avgLikes:             { type: Number, default: 0 },
        avgComments:          { type: Number, default: 0 },
        avgEngagementPerPost: { type: Number, default: 0 },
        likeToCommentRatio:   { type: Number, default: 0 },
        postingFrequency7d:   { type: Number, default: 0 },  // posts per 7 days
        postingFrequency30d:  { type: Number, default: 0 },  // posts per 30 days
        topPostScore:         { type: Number },
        topReelScore:         { type: Number },

        // ── Fit / Quality Score (normalised 0-100) ─────────────────────
        // Computed on every sync. Based on ER, followers, completeness, freq.
        fitScore: { type: Number, default: 0 },  // 0–100

        // ── Demographics (promoted from latest daily stats) ────────────
        // Stored as structured objects, NOT stringified JSON blobs.
        demographicsTopCountries: { type: mongoose.Schema.Types.Mixed }, // { "PK": 1200, "US": 800, ... }
        demographicsTopCities:    { type: mongoose.Schema.Types.Mixed }, // { "Karachi": 500, ... }
        demographicsGenderAge:    { type: mongoose.Schema.Types.Mixed }, // { "F.18-24": 340, "M.25-34": 120, ... }

        // ── Sync metadata ──────────────────────────────────────────────
        lastSyncedAt:            { type: Date },
        lastDemographicsSyncAt:  { type: Date },
        profileCompletionStatus: { type: Boolean, default: false },
    },
    { timestamps: true }
);

influencerProfileSchema.index({ niche: 1 });
influencerProfileSchema.index({ countryOfResidence: 1 });
influencerProfileSchema.index({ followersCount: -1 });
influencerProfileSchema.index({ engagementRate: -1 });
influencerProfileSchema.index({ fitScore: -1 });

module.exports = mongoose.model('InfluencerProfile', influencerProfileSchema);
