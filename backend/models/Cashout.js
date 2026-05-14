const mongoose = require('mongoose');

const cashoutSchema = new mongoose.Schema(
    {
        cashoutCode: { type: String, unique: true, required: true },
        influencerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        influencerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerProfile', index: true },
        amount: { type: Number, required: true, min: 1 },
        currency: { type: String, default: 'USD' },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            index: true,
        },
        requestedAt: { type: Date, default: Date.now },
        reviewedAt: { type: Date },
        processedAt: { type: Date },
        reviewedByFK: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        transactionId: { type: String },
        payoutMethod: {
            type: String,
            default: 'bank_transfer',
        },
        notes: { type: String },
        rejectionReason: { type: String },
        balanceSnapshot: {
            totalPaid: { type: Number, default: 0 },
            availableBalance: { type: Number, default: 0 },
        },
    },
    { timestamps: true, collection: 'cashouts' }
);

cashoutSchema.index({ influencerUserId: 1, createdAt: -1 });

module.exports = mongoose.model('Cashout', cashoutSchema);
