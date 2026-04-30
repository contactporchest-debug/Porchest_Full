const mongoose = require('mongoose');

const clickEventSchema = new mongoose.Schema(
    {
        collaborationId: { type: mongoose.Schema.Types.ObjectId, ref: 'CampaignRequest', required: true, index: true },
        influencerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
        brandId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
        timestamp: { type: Date, default: Date.now, index: true },
        ip: { type: String },
        userAgent: { type: String },
        referrer: { type: String },
        sessionId: { type: String },
        isUnique: { type: Boolean, default: false },
    },
    { timestamps: true, collection: 'click_events' }
);

module.exports = mongoose.model('ClickEvent', clickEventSchema);
