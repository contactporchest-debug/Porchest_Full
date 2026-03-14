const mongoose = require('mongoose');

/**
 * InstagramAccountDailyStat — Daily snapshot of account metrics.
 * Separated by userId + role + date, so brand and influencer stats never mix.
 */
const instagramAccountDailyStatSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            enum: ['influencer', 'brand'],
            required: true,
        },
        instagramUserId: { type: String, required: true },

        // Date bucket (start of the day UTC)
        date: { type: Date, required: true },

        // Counts at this point in time
        followersCount: { type: Number, default: 0 },
        followsCount: { type: Number, default: 0 },
        mediaCount: { type: Number, default: 0 },

        // Reach/impressions (where available via Insights API)
        reach: { type: Number, default: null },
        impressions: { type: Number, default: null },
        profileViews: { type: Number, default: null },

        // Audience breakdown (JSON blobs — may be null if permissions not granted)
        audienceCityJson: { type: mongoose.Schema.Types.Mixed, default: null },
        audienceCountryJson: { type: mongoose.Schema.Types.Mixed, default: null },
        audienceGenderAgeJson: { type: mongoose.Schema.Types.Mixed, default: null },

        fetchedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Unique per user+role+date
instagramAccountDailyStatSchema.index({ userId: 1, role: 1, date: 1 }, { unique: true });
instagramAccountDailyStatSchema.index({ instagramUserId: 1, date: -1 });

module.exports = mongoose.model('InstagramAccountDailyStat', instagramAccountDailyStatSchema);
