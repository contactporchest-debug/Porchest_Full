const cron = require('node-cron');
const { pollFollowerGrowthForActiveCampaigns, releaseDueSecondPayouts } = require('./trackingService');

function startTrackingScheduler() {
    cron.schedule('0 3 * * *', async () => {
        console.log('[TrackingScheduler] Starting follower growth poll —', new Date().toISOString());
        try {
            await pollFollowerGrowthForActiveCampaigns();
            await releaseDueSecondPayouts();
            console.log('[TrackingScheduler] Follower growth poll complete —', new Date().toISOString());
        } catch (error) {
            console.error('[TrackingScheduler] Poll failed:', error);
        }
    }, {
        timezone: 'UTC',
    });
}

module.exports = { startTrackingScheduler };
