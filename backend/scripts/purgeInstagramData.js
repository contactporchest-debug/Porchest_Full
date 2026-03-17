/**
 * purgeInstagramData.js
 *
 * Database reset script — run this from the backend directory:
 *   node scripts/purgeInstagramData.js
 *
 * What it does:
 *   - Resets all InfluencerProfile & BrandProfile instagram analytics fields natively
 *   - Drops instagram connected flags and tokens securely for pure privacy reset
 *   - Leaves users, influencer profiles, and brand profiles intact (accounts survive)
 *   - Does NOT delete user accounts
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// ── Models ──────────────────────────────────────────────────────────────────
const InfluencerProfile       = require('../models/InfluencerProfile');
const BrandProfile            = require('../models/BrandProfile');
const User                    = require('../models/User');

const pad = (label) => label.padEnd(40, '.');

async function run() {
    console.log('\n🧹  Porchest — Full Native Instagram Data Privacy Purge Script');
    console.log('='.repeat(55));
    console.log('Connecting to MongoDB...');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅  Connected\n');

    // ── Step 1: Reset analytics fields on InfluencerProfile ───────────────
    console.log('\n── Step 1: Resetting InfluencerProfile analytics + tokens ───');
    const r1 = await InfluencerProfile.updateMany({}, {
        $set: {
            instagramConnectionStatus: 'disconnected',
            lastDisconnectedAt:    new Date(),
            instagramUserId:       null,
            instagramUsername:     null,
            instagramProfileURL:   null,
            instagramDPURL:        null,
            instagramBiography:    null,
            instagramAccountType:  null,
            followersCount:        0,
            followingCount:        0,
            mediaCount:            0,
            postsCount:            0,
            reelsCount:            0,
            engagementRate:        0,
            avgLikes:              0,
            avgComments:           0,
            avgShares:             0,
            avgViews:              0,
            avgReach:              0,
            avgImpressions:        0,
            growthRate:            0,
            postingFrequency:      0,
            topPerformingContentType: null,
            demographics:          null,
            recentMediaSummary:    [],
            fitScore:              0,
            scoreLabel:            null,
            lastSyncAt:            null,
            lastAnalyticsRefreshAt: null,
            nextScheduledRefreshAt: null,
            'sync.oauthState':     null,
            'sync.accessToken':    null,
            'sync.longLivedToken': null,
            'sync.tokenExpiresAt': null,
            'sync.refreshStatus':  'idle',
        }
    });
    console.log(pad('  InfluencerProfile reset'), `${r1.modifiedCount} profiles wiped securely`);

    // ── Step 2: Reset analytics fields on BrandProfile ────────────────────
    console.log('\n── Step 2: Resetting BrandProfile analytics + tokens ────────');
    const r2 = await BrandProfile.updateMany({}, {
        $set: {
            instagramConnected:    false,
            instagramUserId:       null,
            instagramUsername:     null,
            instagramProfileURL:   null,
            instagramDPURL:        null,
            instagramBiography:    null,
            instagramAccountType:  null,
            followersCount:        0,
            followsCount:          0,
            mediaCount:            0,
            linkedPageId:          null,
            linkedPageName:        null,
            lastSyncedAt:          null,
            'sync.oauthState':     null,
            'sync.accessToken':    null,
            'sync.longLivedToken': null,
            'sync.tokenExpiresAt': null,
            'sync.refreshStatus':  'idle',
        }
    });
    console.log(pad('  BrandProfile reset'), `${r2.modifiedCount} profiles wiped securely`);

    // ── Step 3: Reset instagramConnected on User ───────────────────────────
    console.log('\n── Step 3: Resetting instagramConnected flag on Users ──────');
    const r3 = await User.updateMany({}, { $set: { instagramConnected: false } });
    console.log(pad('  User reset'), `${r3.modifiedCount} users updated`);

    // ── Summary ────────────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(55));
    console.log('✅  Native Purge complete. Database is scrubbed.');
    console.log('    User accounts and entered profile fields are preserved.');
    console.log('    All influencers and brands must re-connect Instagram.');
    console.log('='.repeat(55) + '\n');
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error('❌  Script failed:', err.message);
    process.exit(1);
});
