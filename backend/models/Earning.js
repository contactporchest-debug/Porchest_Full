const mongoose = require('mongoose');

const earningSchema = new mongoose.Schema(
    {
        influencerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        brandId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        campaignRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CampaignRequest',
            required: true,
        },
        amount: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ['pending', 'paid'],
            default: 'pending',
        },
        paidAt: { type: Date, default: null },
        cashoutId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Cashout',
            default: null,
        },
    },
    { timestamps: true }
);

earningSchema.index({ influencerId: 1, status: 1 });

module.exports = mongoose.model('Earning', earningSchema);
