/**
 * purgeInstagramData.js
 *
 * Database reset script — run this from the backend directory:
 *   node scripts/purgeInstagramData.js
 *
 * What it does:
 *   - Wipes ALL Instagram raw data from every collection
 *   - Resets all InfluencerProfile & BrandProfile instagram analytics fields to zero/null
 *   - Resets instagramConnected flag on Users, InfluencerProfiles, and BrandProfiles
 *   - Leaves users, influencer profiles, and brand profiles intact (accounts survive)
 *   - Does NOT delete user accounts
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// ── Models ──────────────────────────────────────────────────────────────────
const InstagramConnection     = require('../models/InstagramConnection');
const InstagramAccount        = require('../models/InstagramAccount');
const InstagramAccountDailyStat = require('../models/InstagramAccountDailyStat');
const InstagramDerivedMetric  = require('../models/InstagramDerivedMetric');
const InstagramMedia          = require('../models/InstagramMedia');
const InstagramMediaInsight   = require('../models/InstagramMediaInsight');
const InstagramComment        = require('../models/InstagramComment');
const InfluencerProfile       = require('../models/InfluencerProfile');
const BrandProfile            = require('../models/BrandProfile');
const User                    = require('../models/User');

// Fields to zero-out on InfluencerProfile (do NOT delete the profile record)
const INFLUENCER_PROFILE_RESET = {
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
    engagementRate:        0,
    avgLikes:              0,
    avgComments:           0,
    avgEngagementPerPost:  0,
    likeToCommentRatio:    0,
    postingFrequency7d:    0,
    postingFrequency30d:   0,
    topPostScore:          null,
    topReelScore:          null,
    fitScore:              0,
    demographicsTopCountries: null,
    demographicsTopCities:    null,
    demographicsGenderAge:    null,
    lastSyncedAt:             null,
    lastDemographicsSyncAt:   null,
};

// Fields to zero-out on BrandProfile
const BRAND_PROFILE_RESET = {
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
};

const pad = (label) => label.padEnd(40, '.');

async function run() {
    console.log('\n🧹  Porchest — Full Instagram Data Purge Script');
    console.log('='.repeat(55));
    console.log('Connecting to MongoDB...');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅  Connected\n');

    // ── Step 1: Delete all raw Instagram collections ───────────────────────
    console.log('── Step 1: Purging raw Instagram collections ──────────────');

    const r1 = await InstagramConnection.deleteMany({});
    console.log(pad('  InstagramConnection'), `${r1.deletedCount} deleted`);

    const r2 = await InstagramAccount.deleteMany({});
    console.log(pad('  InstagramAccount'), `${r2.deletedCount} deleted`);

    const r3 = await InstagramAccountDailyStat.deleteMany({});
    console.log(pad('  InstagramAccountDailyStat'), `${r3.deletedCount} deleted`);

    const r4 = await InstagramDerivedMetric.deleteMany({});
    console.log(pad('  InstagramDerivedMetric'), `${r4.deletedCount} deleted`);

    const r5 = await InstagramMedia.deleteMany({});
    console.log(pad('  InstagramMedia'), `${r5.deletedCount} deleted`);

    const r6 = await InstagramMediaInsight.deleteMany({});
    console.log(pad('  InstagramMediaInsight'), `${r6.deletedCount} deleted`);

    const r7 = await InstagramComment.deleteMany({});
    console.log(pad('  InstagramComment'), `${r7.deletedCount} deleted`);

    // ── Step 2: Reset analytics fields on InfluencerProfile ───────────────
    console.log('\n── Step 2: Resetting InfluencerProfile analytics fields ───');
    const r8 = await InfluencerProfile.updateMany({}, { $set: INFLUENCER_PROFILE_RESET });
    console.log(pad('  InfluencerProfile reset'), `${r8.modifiedCount} profiles updated`);

    // ── Step 3: Reset analytics fields on BrandProfile ────────────────────
    console.log('\n── Step 3: Resetting BrandProfile analytics fields ────────');
    const r9 = await BrandProfile.updateMany({}, { $set: BRAND_PROFILE_RESET });
    console.log(pad('  BrandProfile reset'), `${r9.modifiedCount} profiles updated`);

    // ── Step 4: Reset instagramConnected on User ───────────────────────────
    console.log('\n── Step 4: Resetting instagramConnected flag on Users ──────');
    const r10 = await User.updateMany({}, { $set: { instagramConnected: false } });
    console.log(pad('  User reset'), `${r10.modifiedCount} users updated`);

    // ── Summary ────────────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(55));
    console.log('✅  Purge complete. Database is clean.');
    console.log('    User accounts and profile forms are preserved.');
    console.log('    All influencers and brands must re-connect Instagram.');
    console.log('='.repeat(55) + '\n');
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error('❌  Script failed:', err.message);
    process.exit(1);
});
