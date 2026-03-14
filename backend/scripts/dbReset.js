require('dotenv').config({ path: '../.env' }); // Ensure correct relative path when run from scripts directory
const mongoose = require('mongoose');

// Wait, standard node syntax allows this:
// We can just connect and drop database.
// Or drop collections iteratively.

async function resetDatabase() {
    console.log('⚠️  STARTING FULL DATABASE RESET ⚠️');
    if (!process.env.MONGODB_URI) {
        console.error('Error: MONGODB_URI is undefined.');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        
        // List all collections
        const collections = await db.collections();
        console.log(`Found ${collections.length} collections. Dropping them all...`);

        for (const collection of collections) {
            console.log(`- Dropping collection: ${collection.collectionName}`);
            await db.dropCollection(collection.collectionName);
        }

        console.log('✅ Database reset complete. All old data is gone.');
        
        // Creating indexes for new core collections based on our defined schemas
        console.log('Rebuilding indexes for core schemas...');
        
        // Require all new models to re-init
        require('../models/User');
        require('../models/BrandProfile');
        require('../models/InfluencerProfile');
        require('../models/InstagramConnection');
        require('../models/InstagramAccount');
        require('../models/InstagramAccountDailyStat');
        require('../models/InstagramMedia');
        require('../models/InstagramMediaInsight');
        require('../models/InstagramComment');
        require('../models/InstagramDerivedMetric');

        await mongoose.syncIndexes();

        console.log('✅ Core indexes rebuilt successfully.');

    } catch (err) {
        console.error('❌ Database reset failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database.');
        process.exit(0);
    }
}

resetDatabase();
