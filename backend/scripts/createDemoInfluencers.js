require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const connectDB = require('../config/db');
const { ensureDemoInfluencers, DEMO_PASSWORD } = require('../utils/ensureDemoInfluencers');

async function main() {
    await connectDB();
    const accounts = await ensureDemoInfluencers();
    console.log(`Demo influencer logins ensured with password: ${DEMO_PASSWORD}`);
    accounts.forEach((account) => {
        console.log(`- ${account.email}`);
    });
    process.exit(0);
}

main().catch((error) => {
    console.error('Failed to create demo influencer accounts:', error);
    process.exit(1);
});
