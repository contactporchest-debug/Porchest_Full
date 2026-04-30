const cron = require('node-cron');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');
const { syncInfluencer, syncBrand } = require('./syncService');

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs the 24-hour auto-sync job at 3:00 AM UTC.
 */
function startSyncScheduler() {
    cron.schedule('0 3 * * *', async () => {
        console.log('[Scheduler] Starting 24hr sync —', new Date().toISOString());

        try {
            const influencerProfiles = await InfluencerProfile.find(
                { 'sync.longLivedToken': { $exists: true, $ne: null } },
                { userId: 1 }
            ).lean();

            for (const profile of influencerProfiles) {
                await syncInfluencer(profile.userId);
                await sleep(500);
            }

            const brandProfiles = await BrandProfile.find(
                { 'sync.longLivedToken': { $exists: true, $ne: null } },
                { userId: 1 }
            ).lean();

            for (const profile of brandProfiles) {
                await syncBrand(profile.userId);
                await sleep(500);
            }

            console.log('[Scheduler] 24hr sync complete —', new Date().toISOString());
        } catch (error) {
            console.error('[Scheduler] Sync job failed:', error);
        }
    }, {
        timezone: 'UTC',
    });
}

module.exports = { startSyncScheduler };
