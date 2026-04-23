const User = require('../models/User');
const { generateUniqueCode } = require('./generateCode');

async function ensureAdminUser() {
    const adminEmail = 'admin@porchest.com';
    const existing = await User.findOne({ email: adminEmail });

    if (existing) {
        let changed = false;

        if (existing.role !== 'admin') {
            existing.role = 'admin';
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

        if (!existing.password) {
            existing.password = 'porchest_admin';
            changed = true;
        }

        if (existing.isVerified !== undefined) {
            existing.set('isVerified', undefined);
            changed = true;
        }

        if (existing.profileCompletionStatus !== undefined) {
            existing.set('profileCompletionStatus', undefined);
            changed = true;
        }

        if (existing.instagramConnected !== undefined) {
            existing.set('instagramConnected', undefined);
            changed = true;
        }

        if (existing.brandProfileId) {
            existing.set('brandProfileId', undefined);
            changed = true;
        }

        if (existing.influencerProfileId) {
            existing.set('influencerProfileId', undefined);
            changed = true;
        }

        if (changed) {
            await existing.save();
            console.log('[Bootstrap] Admin account ensured for existing user');
        }

        return existing;
    }

    const userCode = await generateUniqueCode('USR', User, 'userCode');
    const admin = await User.create({
        userCode,
        role: 'admin',
        email: adminEmail,
        password: 'porchest_admin',
        status: 'active',
    });

    console.log('[Bootstrap] Default admin account created: admin@porchest.com');
    return admin;
}

module.exports = ensureAdminUser;
