const MediaRaw = require('../models/MediaRaw');
const InsightsRaw = require('../models/InsightsRaw');
const UserRaw = require('../models/UserRaw');

async function deleteInstagramRawDataForUser(userId) {
    if (!userId) {
        return {
            userRawDeleted: 0,
            mediaRawDeleted: 0,
            insightsRawDeleted: 0,
        };
    }

    const [userRawResult, mediaRawResult, insightsRawResult] = await Promise.all([
        UserRaw.deleteMany({ userId, platform: 'Instagram' }),
        MediaRaw.deleteMany({ userId, platform: 'Instagram' }),
        InsightsRaw.deleteMany({ userId, platform: 'Instagram' }),
    ]);

    return {
        userRawDeleted: userRawResult.deletedCount || 0,
        mediaRawDeleted: mediaRawResult.deletedCount || 0,
        insightsRawDeleted: insightsRawResult.deletedCount || 0,
    };
}

module.exports = {
    deleteInstagramRawDataForUser,
};
