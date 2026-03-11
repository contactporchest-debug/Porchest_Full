/**
 * Purge script — removes all demo, test, and seed users from MongoDB.
 * Run with: node backend/scripts/purgeDemo.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const DEMO_EMAILS = [
    'admin@porchest.com',
    'brand@demo.com',
    'influencer@demo.com',
    'test@test.com',
    'test_vercel_check@example.com',
    'demo@porchest.com',
    'seed@porchest.com',
];

const DEMO_PATTERNS = [
    /^test[_@]/i,
    /demo/i,
    /seed/i,
    /example\.com$/i,
    /fake/i,
    /mock/i,
];

async function purge() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const User = require('../models/User');

    // Find all users
    const all = await User.find({}, 'email role createdAt');
    console.log(`📊 Total users in DB: ${all.length}`);

    const toDelete = all.filter(u => {
        const email = u.email?.toLowerCase() || '';
        return DEMO_EMAILS.includes(email) || DEMO_PATTERNS.some(p => p.test(email));
    });

    if (toDelete.length === 0) {
        console.log('✅ No demo/test users found. DB is clean!');
    } else {
        console.log(`\n🗑️  Found ${toDelete.length} demo/test user(s) to delete:`);
        toDelete.forEach(u => console.log(`   - ${u.email} (${u.role})`));
        const ids = toDelete.map(u => u._id);
        const result = await User.deleteMany({ _id: { $in: ids } });
        console.log(`\n✅ Deleted ${result.deletedCount} user(s)`);
    }

    const remaining = await User.countDocuments();
    console.log(`\n📊 Remaining users in DB: ${remaining}`);

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected. Done!');
}

purge().catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
});
