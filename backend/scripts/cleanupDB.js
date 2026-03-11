/**
 * DB Cleanup Script
 * - Drops unused/legacy collections: analytics, applications, payments, messages, campaigns
 * - Removes stale/expired OTPs from users
 * - Shows final clean state
 *
 * Run: node backend/scripts/cleanupDB.js
 *
 * KEEPS: users, campaignrequests, verificationsubmissions, earnings, cashouts
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const COLLECTIONS_TO_DROP = [
    { name: 'analytics',    reason: 'Legacy seed-only. App uses VerificationSubmission.performance for analytics.' },
    { name: 'applications', reason: 'Legacy seed-only. App uses CampaignRequest model instead.' },
    { name: 'payments',     reason: 'Legacy seed-only. App uses Earning + Cashout models instead.' },
    { name: 'messages',     reason: 'Empty. No model or controller uses this.' },
    { name: 'campaigns',    reason: 'Legacy seed-only. App management uses CampaignRequest for brand→influencer flows.' },
];

async function cleanup() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    console.log(`✅ Connected to: ${db.databaseName}\n`);

    // ── 1. Drop unused collections ──────────────────────────────────
    console.log('🗑️  Dropping unused/legacy collections...\n');
    const existing = (await db.listCollections().toArray()).map(c => c.name);

    for (const { name, reason } of COLLECTIONS_TO_DROP) {
        if (existing.includes(name)) {
            const count = await db.collection(name).countDocuments();
            await db.collection(name).drop();
            console.log(`   ✓ Dropped "${name}" (${count} docs) — ${reason}`);
        } else {
            console.log(`   — "${name}" doesn't exist, skipping`);
        }
    }

    // ── 2. Clean stale OTPs from users ──────────────────────────────
    console.log('\n🧹 Cleaning stale OTPs from users...');
    const User = require('../models/User');
    const otpResult = await User.updateMany(
        { otp: { $exists: true }, isVerified: true },
        { $unset: { otp: '', otpExpires: '' } }
    );
    console.log(`   ✓ Cleared OTP from ${otpResult.modifiedCount} verified user(s)`);

    // ── 3. Clean unused User fields ─────────────────────────────────
    console.log('\n🧹 Removing legacy unused fields from users...');
    const fieldResult = await User.updateMany(
        {},
        {
            $unset: {
                // Legacy fields not used by any active controller
                socialLinks: '',
                portfolio: '',
                avatar: '',    // replaced by profileImageURL
                earnings: '',  // replaced by Earning model
            }
        }
    );
    console.log(`   ✓ Cleaned legacy fields from ${fieldResult.modifiedCount} user(s)`);

    // ── 4. Final state ───────────────────────────────────────────────
    console.log('\n📊 Final DB state:');
    console.log('─'.repeat(50));
    const remaining = await db.listCollections().toArray();
    for (const col of remaining) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`   📁 ${col.name.padEnd(30)} ${count} docs`);
    }
    console.log('─'.repeat(50));

    await mongoose.disconnect();
    console.log('\n✅ Database cleanup complete!');
}

cleanup().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
