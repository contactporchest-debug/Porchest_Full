require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
}
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: require('path').join(process.cwd(), '.env') });
}

const mongoose = require('mongoose');
const ensureAdminUser = require('../utils/ensureAdminUser');
const { ensureDemoInfluencers } = require('../utils/ensureDemoInfluencers');
const User = require('../models/User');

const ADMIN_EMAIL = 'admin@porchest.com';

async function clearNonAdminData() {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const keepCollections = new Set(['users']);

    for (const collection of collections) {
        if (keepCollections.has(collection.name)) {
            continue;
        }
        const result = await mongoose.connection.db.collection(collection.name).deleteMany({});
        console.log(`Cleared ${collection.name}: ${result.deletedCount || 0} document(s) removed.`);
    }

    const deleteResult = await User.deleteMany({ email: { $ne: ADMIN_EMAIL } });
    console.log(`Removed ${deleteResult.deletedCount || 0} non-admin user(s).`);
}

async function main() {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is undefined');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Ensuring admin account...');
    const admin = await ensureAdminUser();
    console.log(`Preserving admin: ${admin.email}`);

    console.log('Purging all non-admin data...');
    await clearNonAdminData();

    console.log('Re-checking admin account...');
    await ensureAdminUser();

    console.log('Seeding five fictional influencers...');
    const influencers = await ensureDemoInfluencers({ limit: 5 });

    console.log('Seed complete. Created/updated influencer logins:');
    influencers.forEach((item) => {
        console.log(`- ${item.email} / Porchest_Influencer`);
    });

    await mongoose.disconnect();
    console.log('Disconnected from database.');
}

main().catch(async (error) => {
    console.error('Seed failed:', error);
    try {
        await mongoose.disconnect();
    } catch {}
    process.exit(1);
});
