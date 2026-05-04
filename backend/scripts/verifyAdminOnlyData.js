const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');

function loadEnv(filePath) {
    if (!fs.existsSync(filePath)) return;
    const contents = fs.readFileSync(filePath, 'utf8');
    for (const line of contents.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        let value = trimmed.slice(idx + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}

async function run() {
    loadEnv(path.resolve(__dirname, '../.env'));
    loadEnv(path.resolve(__dirname, '../../.env'));
    loadEnv(path.resolve(process.cwd(), '.env'));

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is undefined');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({}, 'email role status').lean();
    const collections = await mongoose.connection.db.listCollections().toArray();
    const counts = {};

    for (const collection of collections) {
        counts[collection.name] = await mongoose.connection.db.collection(collection.name).countDocuments();
    }

    console.log(JSON.stringify({ users, counts }, null, 2));
    await mongoose.disconnect();
}

run().catch(async (err) => {
    console.error(err);
    try {
        await mongoose.disconnect();
    } catch {}
    process.exit(1);
});
