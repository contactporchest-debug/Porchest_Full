const User = require('../models/User');
const { generateUniqueCode } = require('./generateCode');

async function ensureAdminUser() {
    const adminEmail = 'admin@porchest.com';
    const adminPassword = 'Porchest_Admin';
    const existing = await User.findOne({ email: adminEmail });

    if (existing) {
        let changed = false;

        if (existing.role !== 'owner') {
            existing.role = 'owner';
            changed = true;
        }

        if (existing.status !== 'active') {
            existing.status = 'active';
            changed = true;
        }

        if (!existing.isVerified) {
            existing.isVerified = true;
            changed = true;
        }

        if (!existing.userCode) {
            existing.userCode = await generateUniqueCode('USR', User, 'userCode');
            changed = true;
        }

        existing.password = adminPassword;
        changed = true;

        if (changed) {
            await existing.save();
            console.log('[Bootstrap] Owner account ensured for existing user record');
        }

        return existing;
    }

    const adminCode = await generateUniqueCode('USR', User, 'userCode');
    const admin = await User.create({
        userCode: adminCode,
        role: 'owner',
        email: adminEmail,
        password: adminPassword,
        status: 'active',
        isVerified: true,
    });

    console.log('[Bootstrap] Default owner account created: admin@porchest.com');
    return admin;
}

module.exports = ensureAdminUser;
