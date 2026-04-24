const mongoose = require('mongoose');

const userRawSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        platform: { type: String, default: 'Instagram', index: true },
        source: { type: String, default: 'meta_profile' },
        payload: { type: mongoose.Schema.Types.Mixed, required: true },
        fetchedAt: { type: Date, default: Date.now, index: true },
    },
    {
        timestamps: true,
        collection: 'users_raw',
    }
);

userRawSchema.index({ userId: 1, platform: 1, source: 1 }, { unique: true });

module.exports = mongoose.model('UserRaw', userRawSchema);
