const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const BrandProfile = require('../models/BrandProfile');

function loadMongoUri() {
    const envPath = path.resolve(__dirname, '../../.env');
    const raw = fs.readFileSync(envPath, 'utf8');
    const line = raw.split(/\r?\n/).find((entry) => entry.startsWith('MONGODB_URI='));
    if (!line) throw new Error('MONGODB_URI not found in .env');
    return line.slice('MONGODB_URI='.length).trim().replace(/^"|"$/g, '');
}

(async () => {
    await mongoose.connect(loadMongoUri());
    const result = await BrandProfile.updateMany(
        { 'targetAudience.cities': { $exists: true } },
        { $unset: { 'targetAudience.cities': '' } }
    );
    console.log(JSON.stringify({
        matched: result.matchedCount ?? result.nMatched ?? 0,
        modified: result.modifiedCount ?? result.nModified ?? 0,
    }, null, 2));
    await mongoose.disconnect();
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
