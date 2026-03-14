const mongoose = require('mongoose');

const brandProfileSchema = new mongoose.Schema(
    {
        brandProfileId: { type: String, unique: true, required: true }, // BRD-xxx
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        brandName: { type: String },
        officialEmail: { type: String },
        contactPersonName: { type: String },
        brandGoal: { type: String },
        brandNiche: { type: String },
        approxBudgetUSD: { type: Number },
        companyCountry: { type: String },
        companyWebsite: { type: String },
        trackingWebsiteURL: { type: String },
        profileImageURL: { type: String },
        instagramConnected: { type: Boolean, default: false },
        profileCompletionStatus: { type: Boolean, default: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model('BrandProfile', brandProfileSchema);
