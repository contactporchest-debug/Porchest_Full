const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
    {
        brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        budget: { type: Number, required: true },
        timeline: {
            startDate: { type: Date },
            endDate: { type: Date },
        },
        targetNiche: { type: String, required: true },
        status: {
            type: String,
            enum: ['draft', 'active', 'completed', 'cancelled'],
            default: 'active',
        },
        requirements: { type: String },
        deliverables: [{ type: String }],
        applicantsCount: { type: Number, default: 0 },
        views: { type: Number, default: 0 },

        // Performance data — populated post-verification
        performance: {
            views: { type: Number, default: 0 },
            likes: { type: Number, default: 0 },
            comments: { type: Number, default: 0 },
            shares: { type: Number, default: 0 },
            saves: { type: Number, default: 0 },
            engagementRate: { type: Number, default: 0 },
            reach: { type: Number, default: 0 },
            impressions: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Campaign', campaignSchema);
