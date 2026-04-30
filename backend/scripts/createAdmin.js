require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const connectDB = require('../config/db');
const ensureAdminUser = require('../utils/ensureAdminUser');
const { ensureDemoBrand, DEMO_BRAND_EMAIL, DEMO_BRAND_PASSWORD } = require('../utils/ensureDemoBrand');

async function main() {
    await connectDB();
    await ensureAdminUser();
    await ensureDemoBrand();
    console.log('Owner login ensured: admin@porchest.com / Porchest_Admin');
    console.log(`Demo brand login ensured: ${DEMO_BRAND_EMAIL} / ${DEMO_BRAND_PASSWORD}`);
    process.exit(0);
}

main().catch((error) => {
    console.error('Failed to create admin user:', error);
    process.exit(1);
});
