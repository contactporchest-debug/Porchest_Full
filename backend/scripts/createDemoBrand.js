require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const connectDB = require('../config/db');
const { ensureDemoBrand, DEMO_BRAND_EMAIL, DEMO_BRAND_PASSWORD } = require('../utils/ensureDemoBrand');

async function main() {
    await connectDB();
    const account = await ensureDemoBrand();
    console.log(`Demo brand login ensured: ${DEMO_BRAND_EMAIL} / ${DEMO_BRAND_PASSWORD}`);
    console.log(`Brand profile ready for: ${account.brandName}`);
    process.exit(0);
}

main().catch((error) => {
    console.error('Failed to create demo brand account:', error);
    process.exit(1);
});
