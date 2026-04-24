const cron = require('node-cron');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');
const syncService = require('./instagramSyncService');
const meta = require('./metaOAuth');

/**
 * Initializes all background scheduled jobs.
 * This should be required once in the main server entrypoint.
 */
function initScheduler() {
    console.log('🕒 Initializing Profile-Centric Background Sync Scheduler...');

    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        console.log(`[Scheduler] ⏳ Running Instagram auto-refresh job at ${new Date().toISOString()}`);

        try {
            const influencerProfilesToSync = await InfluencerProfile.find({
                instagramConnectionStatus: 'connected',
                'sync.source': { $ne: 'Instagram Demo Dataset' },
                'sync.longLivedToken': { $exists: true, $ne: null },
                $or: [
                    { nextScheduledRefreshAt: { $exists: true, $lte: new Date() } },
                    { lastSyncAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
                ],
            });

            console.log(`[Scheduler] 🔄 Found ${influencerProfilesToSync.length} Influencer profile(s) to auto-refresh...`);

            for (const profile of influencerProfilesToSync) {
                try {
                    console.log(`[Scheduler] Starting refresh for Influencer ${profile.userId}`);

                    if (profile.sync.tokenExpiresAt && profile.sync.tokenExpiresAt < new Date()) {
                        console.log(`[Scheduler] ⚠️ Token expired for user ${profile.userId}`);
                        profile.sync.refreshStatus = 'failed';
                        profile.sync.refreshError = 'Token expired';
                        profile.instagramConnectionStatus = 'token_expired';
                        await profile.save();
                        continue;
                    }

                    profile.sync.refreshStatus = 'syncing';
                    await profile.save();

                    // Run the full sync write-through structure natively
                    await syncService.runFullSync(profile.userId, 'influencer', profile.sync.longLivedToken);
                    console.log(`[Scheduler] ✅ Successfully refreshed Influencer ${profile.userId}`);
                } catch (syncError) {
                    console.error(`[Scheduler] ❌ Failed to refresh Influencer ${profile.userId}:`, syncError.message);
                    profile.sync.refreshStatus = 'failed';
                    profile.sync.refreshError = syncError.message;
                    await profile.save();
                }

                // Sleep slightly to avoid Meta API rate limits
                await new Promise(res => setTimeout(res, 2000));
            }

            const brandProfilesToSync = await BrandProfile.find({
                instagramConnectionStatus: 'connected',
                'sync.source': { $ne: 'Instagram Demo Dataset' },
                'sync.longLivedToken': { $exists: true, $ne: null },
                $or: [
                    { nextScheduledRefreshAt: { $exists: true, $lte: new Date() } },
                    { lastSyncedAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
                ],
            });

            console.log(`[Scheduler] 🔄 Found ${brandProfilesToSync.length} Brand profile(s) to auto-refresh...`);

            for (const profile of brandProfilesToSync) {
                try {
                    console.log(`[Scheduler] Starting refresh for Brand ${profile.userId}`);

                    if (profile.sync.tokenExpiresAt && profile.sync.tokenExpiresAt < new Date()) {
                        console.log(`[Scheduler] ⚠️ Token expired for brand user ${profile.userId}`);
                        profile.sync.refreshStatus = 'failed';
                        profile.sync.refreshError = 'Token expired';
                        profile.instagramConnectionStatus = 'token_expired';
                        await profile.save();
                        continue;
                    }

                    profile.sync.refreshStatus = 'syncing';
                    await profile.save();

                    await syncService.runFullSync(profile.userId, 'brand', profile.sync.longLivedToken);
                    console.log(`[Scheduler] ✅ Successfully refreshed Brand ${profile.userId}`);
                } catch (syncError) {
                    console.error(`[Scheduler] ❌ Failed to refresh Brand ${profile.userId}:`, syncError.message);
                    profile.sync.refreshStatus = 'failed';
                    profile.sync.refreshError = syncError.message;
                    await profile.save();
                }

                await new Promise(res => setTimeout(res, 2000));
            }

            console.log(`[Scheduler] 🏁 Auto-refresh job completed.`);
        } catch (error) {
            console.error(`[Scheduler] 💥 Fatal error in scheduled job:`, error);
        }
    });
}

module.exports = { initScheduler };
