const mongoose = require('mongoose');

const influencerProfileSchema = new mongoose.Schema(
    {
        influencerProfileId: { type: String, unique: true, required: true }, // INF-xxx
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        fullName: { type: String },
        contactEmail: { type: String },
        age: { type: Number },
        countryOfResidence: { type: String },
        city: { type: String },
        niche: { type: String },
        shortBio: { type: String },
        avgPostCostUSD: { type: Number },
        avgReelCostUSD: { type: Number },
        profileImageURL: { type: String },
        instagramConnected: { type: Boolean, default: false },
        profileCompletionStatus: { type: Boolean, default: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model('InfluencerProfile', influencerProfileSchema);
