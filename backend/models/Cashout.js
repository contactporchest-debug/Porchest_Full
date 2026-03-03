const mongoose = require('mongoose');

const cashoutSchema = new mongoose.Schema(
    {
        influencerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: { type: Number, required: true, min: 1 },
        status: {
            type: String,
            enum: ['pending', 'processed', 'rejected'],
            default: 'pending',
        },
        transactionId: { type: String, default: null },
        processedAt: { type: Date, default: null },
        note: { type: String, default: null },
    },
    { timestamps: true }
);

cashoutSchema.index({ influencerId: 1, createdAt: -1 });

module.exports = mongoose.model('Cashout', cashoutSchema);
