const UserRaw = require('../models/UserRaw');
const MediaRaw = require('../models/MediaRaw');
const InsightsRaw = require('../models/InsightsRaw');

async function upsertUserRaw({ userId, payload }) {
    if (!payload) return;

    await UserRaw.findOneAndUpdate(
        { userId, platform: 'Instagram', source: 'meta_profile' },
        { $set: { payload, fetchedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
}

async function upsertMediaRaw({ userId, influencerProfileId = null, mediaList = [] }) {
    if (!mediaList.length) return;

    await Promise.all(mediaList.map((media) => (
        MediaRaw.findOneAndUpdate(
            { userId, platform: 'Instagram', mediaId: media.id },
            {
                $set: {
                    influencerProfileId,
                    payload: media,
                    fetchedAt: new Date(),
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )
    )));
}

async function upsertInsightsRaw({ userId, influencerProfileId = null, insights = [] }) {
    const filtered = insights.filter((item) => item && item.payload);
    if (!filtered.length) return;

    await Promise.all(filtered.map((item) => (
        InsightsRaw.findOneAndUpdate(
            {
                userId,
                platform: 'Instagram',
                targetType: item.targetType,
                targetId: item.targetId || null,
            },
            {
                $set: {
                    influencerProfileId,
                    payload: item.payload,
                    fetchedAt: new Date(),
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )
    )));
}

module.exports = {
    upsertUserRaw,
    upsertMediaRaw,
    upsertInsightsRaw,
};
