const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
    {
        campaignId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Campaign',
            required: true,
        },
        brandId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        impressions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        engagement: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
        roi: { type: Number, default: 0 },
        reach: { type: Number, default: 0 },
        date: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Analytics', analyticsSchema);
