const mongoose = require('mongoose');

const instagramAccountDailyStatSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['brand', 'influencer'], required: true },
        brandProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandProfile' },
        influencerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerProfile' },
        instagramUserId: { type: String, required: true },
        date: { type: String, required: true }, // "YYYY-MM-DD"
        followersCount: { type: Number },
        followsCount: { type: Number },
        mediaCount: { type: Number },
        reach: { type: Number },
        impressions: { type: Number },
        profileViews: { type: Number },
        audienceCityJson: { type: String }, // Stringified JSON
        audienceCountryJson: { type: String },
        audienceGenderAgeJson: { type: String }
    },
    { timestamps: true }
);

instagramAccountDailyStatSchema.index({ instagramUserId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('InstagramAccountDailyStat', instagramAccountDailyStatSchema);
