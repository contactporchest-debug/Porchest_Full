const cron = require('node-cron');
const InstagramConnection = require('../models/InstagramConnection');
const syncService = require('./instagramSyncService');
const meta = require('./metaOAuth');

/**
 * Initializes all background scheduled jobs.
 * This should be required once in the main server entrypoint.
 */
function initScheduler() {
    console.log('🕒 Initializing Background Sync Scheduler...');

    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        console.log(`[Scheduler] ⏳ Running Instagram auto-refresh job at ${new Date().toISOString()}`);

        try {
            // Find connections that are connected, active, and haven't synced in 48 hours
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

            const connectionsToSync = await InstagramConnection.find({
                isConnected: true,
                tokenStatus: 'active',
                lastSyncedAt: { $lte: fortyEightHoursAgo }
            });

            if (connectionsToSync.length === 0) {
                console.log(`[Scheduler] ✨ No profiles require syncing at this time.`);
                return;
            }

            console.log(`[Scheduler] 🔄 Found ${connectionsToSync.length} profile(s) to auto-refresh...`);

            for (const connection of connectionsToSync) {
                try {
                    console.log(`[Scheduler] Starting refresh for ${connection.role} user ${connection.userId}`);

                    // Refresh token if needed or use existing
                    let activeToken = connection.longLivedToken || connection.accessToken;

                    if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
                        console.log(`[Scheduler] ⚠️ Token expired for user ${connection.userId}`);
                        connection.syncStatus = 'failed';
                        connection.tokenStatus = 'expired';
                        connection.syncError = 'Token expired';
                        await connection.save();
                        continue;
                    }

                    // Attempt to politely refresh token if getting somewhat close to expiry (optional), 
                    // but metaOAuth limits this. Let's just use it unless expired.
                    
                    connection.syncStatus = 'syncing';
                    await connection.save();

                    // Run the full sync write-through
                    await syncService.runFullSync(connection.userId, connection.role, activeToken, connection);
                    
                    // Note: runFullSync writes through to the main Profile and updates Connection lastSyncedAt automatically.
                    console.log(`[Scheduler] ✅ Successfully refreshed ${connection.role} user ${connection.userId}`);

                } catch (syncError) {
                    console.error(`[Scheduler] ❌ Failed to refresh ${connection.role} user ${connection.userId}:`, syncError.message);
                    connection.syncStatus = 'failed';
                    connection.syncError = syncError.message;
                    await connection.save();
                }

                // Sleep slightly to avoid Meta API rate limits
                await new Promise(res => setTimeout(res, 2000));
            }

            console.log(`[Scheduler] 🏁 Auto-refresh job completed.`);
        } catch (error) {
            console.error(`[Scheduler] 💥 Fatal error in scheduled job:`, error);
        }
    });
}

module.exports = { initScheduler };
