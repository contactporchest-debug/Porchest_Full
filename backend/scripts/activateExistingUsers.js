/**
 * One-time migration script:
 * Activates all existing users that were created before OTP verification was implemented.
 * Sets them to status='active' and isVerified=true.
 * Run once: node scripts/activateExistingUsers.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await User.updateMany(
        { isVerified: { $ne: true } },
        { $set: { isVerified: true, status: 'active' } }
    );

    console.log(`Updated ${result.modifiedCount} users to active/verified.`);
    await mongoose.disconnect();
}

run().catch(console.error);
