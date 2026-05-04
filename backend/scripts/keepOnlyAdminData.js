require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
}
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
}

const mongoose = require('mongoose');
const User = require('../models/User');
const { ADMIN_ROLES } = require('../utils/accessRoles');

async function run() {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is undefined');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    const adminUsers = await User.find({ role: { $in: ADMIN_ROLES } }).select('_id email role userCode').lean();
    console.log(`Found ${adminUsers.length} admin user(s) to preserve.`);

    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
        const name = collection.name;
        if (name === 'users') {
            continue;
        }

        const result = await mongoose.connection.db.collection(name).deleteMany({});
        console.log(`Cleared ${name}: ${result.deletedCount || 0} document(s) removed.`);
    }

    const nonAdminUsers = await User.deleteMany({ role: { $nin: ADMIN_ROLES } });
    console.log(`Removed ${nonAdminUsers.deletedCount || 0} non-admin user(s).`);

    const remainingAdmins = await User.find({ role: { $in: ADMIN_ROLES } }).select('_id email role userCode').lean();
    console.log('Remaining admin users:');
    console.log(JSON.stringify(remainingAdmins, null, 2));

    await mongoose.disconnect();
    console.log('Cleanup complete.');
}

run().catch(async (err) => {
    console.error('Cleanup failed:', err.message);
    try {
        await mongoose.disconnect();
    } catch {}
    process.exit(1);
});
