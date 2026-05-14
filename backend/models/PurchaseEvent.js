const mongoose = require('mongoose');

const purchaseEventSchema = new mongoose.Schema(
    {
        collaborationId: { type: mongoose.Schema.Types.ObjectId, ref: 'CampaignRequest', required: true, index: true },
        influencerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
        brandId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
        promoCode: { type: String, required: true, index: true },
        orderId: { type: String, required: true },
        orderValue: { type: Number, required: true },
        currency: { type: String, default: 'USD' },
        source: { type: String, enum: ['webhook', 'pixel'], default: 'webhook' },
        timestamp: { type: Date, default: Date.now, index: true },
        withinWindow: { type: Boolean, default: true },
    },
    { timestamps: true, collection: 'purchase_events' }
);

purchaseEventSchema.index({ orderId: 1, source: 1, collaborationId: 1 }, { unique: true });
purchaseEventSchema.index({ brandId: 1, timestamp: -1 });

module.exports = mongoose.model('PurchaseEvent', purchaseEventSchema);
