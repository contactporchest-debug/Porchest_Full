const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
    {
        influencerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
        platform: { type: String, default: 'Instagram', index: true },
        period: { type: String, default: 'lifetime', index: true },
        metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
        charts: { type: mongoose.Schema.Types.Mixed, default: {} },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

analyticsSchema.index({ influencerId: 1, platform: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
