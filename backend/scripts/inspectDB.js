/**
 * DB Inspector — lists all collections and their document counts + sample fields.
 * Run: node backend/scripts/inspectDB.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function inspect() {
    console.log('🔌 Connecting...');
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    console.log(`✅ Connected to: ${db.databaseName}\n`);

    const collections = await db.listCollections().toArray();
    console.log(`📦 Collections found: ${collections.length}\n`);
    console.log('─'.repeat(60));

    for (const col of collections) {
        const coll = db.collection(col.name);
        const count = await coll.countDocuments();
        const sample = count > 0 ? await coll.findOne({}) : null;
        const fields = sample ? Object.keys(sample).filter(k => k !== '__v').join(', ') : '(empty)';
        console.log(`\n📁 ${col.name}  (${count} documents)`);
        console.log(`   Fields: ${fields}`);
        if (count > 0 && count <= 5) {
            const docs = await coll.find({}).toArray();
            docs.forEach(d => {
                const preview = Object.entries(d)
                    .filter(([k]) => !['_id', '__v', 'password', 'otp'].includes(k))
                    .slice(0, 5)
                    .map(([k, v]) => `${k}=${JSON.stringify(v)?.substring(0, 30)}`)
                    .join(' | ');
                console.log(`   → ${preview}`);
            });
        }
    }

    console.log('\n' + '─'.repeat(60));
    await mongoose.disconnect();
    console.log('\n🔌 Done.');
}

inspect().catch(e => { console.error('❌', e.message); process.exit(1); });
