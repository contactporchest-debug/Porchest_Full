require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const connectDB = require('../config/db');
const InfluencerProfile = require('../models/InfluencerProfile');
const BrandProfile = require('../models/BrandProfile');

async function main() {
    await connectDB();

    await InfluencerProfile.collection.createIndex({ userId: 1 }, { unique: true });
    await InfluencerProfile.collection.createIndex({ igUserId: 1 });
    await InfluencerProfile.collection.createIndex({ porchestScore: -1 });
    await InfluencerProfile.collection.createIndex({ igLastSyncedAt: 1 });

    await BrandProfile.collection.createIndex({ userId: 1 }, { unique: true });
    await BrandProfile.collection.createIndex({ igLastSyncedAt: 1 });

    console.log('[Indexes] Ensured Instagram sync indexes');
    process.exit(0);
}

main().catch((error) => {
    console.error('[Indexes] Failed to ensure indexes:', error);
    process.exit(1);
});
